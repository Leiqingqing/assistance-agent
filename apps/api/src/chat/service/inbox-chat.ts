import { AppError, BizCode } from "@repo/contracts/common";
import type { Context } from "hono";
import { getApiEnv, type ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import {
  MEMORY_INJECTION_LIMIT,
  MESSAGE_PAGE_SIZE,
  SAFETY_RECENT_MESSAGE_LIMIT,
  SUMMARY_RECENT_MESSAGE_LIMIT,
} from "@/chat/constants";
import { agentNotFoundError, conversationNotFoundError } from "@/chat/errors";
import {
  findOwnedAgent,
  findOwnedConversationById,
  listActiveMemories,
  listRecentCompletedMessages,
  saveUserMessage,
} from "@/chat/repository";

import {
  evaluateConversationSafety,
  getBoundaryReply,
  getSafetySystemInstruction,
  isDirectBoundaryReply,
  serializeConversationSafetyMetadata,
} from "@/chat/service/evaluate-conversation-safety";
import {
  CONVERSATION_EMOTION_ANALYSIS_VERSION,
} from "@/chat/service/conversation-analysis/detect-emotion";
import {
  CONVERSATION_INTENT_ANALYSIS_VERSION,
  getIntentSystemInstruction,
} from "@/chat/service/conversation-analysis/detect-intent";
import { analyzeConversation } from "@/chat/service/conversation-analysis/graph";
import { mergeConversationMetadata } from "@/chat/service/conversation-analysis/metadata";
import {
  EMOTION_ROUTE_VERSION,
  getEmotionSystemInstruction,
} from "@/chat/service/conversation-analysis/route-emotion";
import { saveAssistantTurn } from "@/chat/service/save-assistant-turn";
import type {
  BuildChatMessagesInput,
  ChatCompletionMessage,
} from "@/chat/types";
import { getDb } from "@/db/client";
import {
  buildImmediateTextStream,
  buildTextStreamResponse,
} from "@/lib/response";
import type { InboxChatRequest } from "@repo/contracts";

function extractText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join("\n");
  }

  if (typeof value !== "object" || value === null) {
    return "";
  }

  const record = value as Record<string, unknown>;

  if (typeof record.text === "string") {
    return record.text;
  }

  return extractText(record.content);
}

function getLatestUserContent(payload: InboxChatRequest): string {
  for (let index = payload.messages.length - 1; index >= 0; index -= 1) {
    const message = payload.messages[index];
    if (message?.role !== "user") {
      continue;
    }

    const content = message.parts
      .map(extractText)
      .filter(Boolean)
      .join("\n")
      .trim();

    if (content) {
      return content;
    }
  }

  throw new AppError(
    BizCode.COMMON_INVALID_REQUEST,
    "A non-empty user message is required",
    400,
  );
}

function buildMessages(input: BuildChatMessagesInput): ChatCompletionMessage[] {
  const {
    agent,
    conversation,
    memories,
    history,
    currentUserContent,
    intent,
    emotion,
    emotionRoute,
    safety,
  } = input;
  const messages: ChatCompletionMessage[] = [
    {
      role: "system",
      content: [
        agent.defaultPrompt || "你是 AI Agent Web 控制台里的聊天陪伴助手。",
        `你的名字是：${agent.name}`,
        agent.headline ? `角色定位：${agent.headline}` : "",
        agent.description ? `角色描述：${agent.description}` : "",
        agent.storyBackground ? `故事背景：${agent.storyBackground}` : "",
        agent.personalityPrompt ? `性格设定：${agent.personalityPrompt}` : "",
        agent.tonePrompt ? `表达语气：${agent.tonePrompt}` : "",
        agent.guardrailsPrompt ? `行为边界：${agent.guardrailsPrompt}` : "",
        getSafetySystemInstruction(safety),
        getIntentSystemInstruction(intent),
        getEmotionSystemInstruction(emotion, emotionRoute),
        memories.length > 0
          ? [
              "以下是用户与该 Agent 的长期记忆，请优先尊重：",
              ...memories.map(
                (memory) =>
                  `- [${memory.type} / 重要度 ${memory.importance}] ${memory.content}`,
              ),
            ].join("\n")
          : "",
        conversation.summary ? `此前对话摘要：${conversation.summary}` : "",
        
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  for (const message of history) {
    messages.push(message);
  }

  messages.push({ role: "user", content: currentUserContent });

  return messages;
}

function getSseData(event: string): string | undefined {
  const dataLines = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => {
      const value = line.slice("data:".length);
      return value.startsWith(" ") ? value.slice(1) : value;
    });

  return dataLines.length > 0 ? dataLines.join("\n") : undefined;
}

function extractDeltaContent(event: string): string {
  const data = getSseData(event);

  if (!data || data === "[DONE]") {
    return "";
  }

  const payload = JSON.parse(data) as {
    choices?: Array<{ delta?: { content?: unknown } }>;
    error?: { message?: string };
  };

  if (payload.error) {
    throw new Error(
      payload.error.message ?? "Upstream completion stream failed",
    );
  }

  const content = payload.choices?.[0]?.delta?.content;
  return typeof content === "string" ? content : "";
}

function sseToTextReadableStream(
  source: ReadableStream<Uint8Array>,
  onComplete: (content: string) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = source.getReader();
  let buffer = "";
  let completeContent = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });

          if (done) {
            if (buffer.trim()) {
              const text = extractDeltaContent(buffer);
              if (text) {
                completeContent += text;
                controller.enqueue(encoder.encode(text));
              }
            }
            if (completeContent.trim()) {
              await onComplete(completeContent);
            }
            controller.close();
            return;
          }

          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";

          for (const event of events) {
            const text = extractDeltaContent(event);
            if (text) {
              completeContent += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        }
      } catch (error) {
        console.error("Inbox chat stream failed", error);
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
    },
  });
}


export async function handleInboxChat(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  payload: InboxChatRequest,
): Promise<Response> {
  const env = getApiEnv(context.env);

  if (!env.DEEPSEEK_API_KEY?.trim()) {
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "DeepSeek API key is not configured",
      500,
      { reason: "DEEPSEEK_API_KEY is missing" },
    );
  }

  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const conversation = await findOwnedConversationById(
    db,
    userId,
    payload.conversationId,
  );

  if (conversation === null) {
    throw conversationNotFoundError();
  }

  const agentId = conversation.agentId;
  const agent = await findOwnedAgent(db, userId, agentId);

  if (agent === null) {
    throw agentNotFoundError();
  }

  const currentUserContent = getLatestUserContent(payload);
  const userMessageId = crypto.randomUUID();
  const userMessageAtMs = Date.now();
  const [memories, recentHistory] = await Promise.all([
    listActiveMemories(db, {
      userId,
      agentId,
      limit: MEMORY_INJECTION_LIMIT,
    }),
    listRecentCompletedMessages(db, {
      conversationId: conversation.id,
      userId,
      agentId,
      limit: MESSAGE_PAGE_SIZE,
    }),
  ]);
  const history = recentHistory.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));
  const baseUrl = (env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(
    /\/+$/,
    "",
  );
  const model = env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const safety = await evaluateConversationSafety(env, {
    agentName: agent.name,
    guardrailsPrompt: agent.guardrailsPrompt,
    activeMemories: memories,
    history: history.slice(-SAFETY_RECENT_MESSAGE_LIMIT),
    currentUserContent,
  });
  const safetyMetadataJson = serializeConversationSafetyMetadata(safety);

  const saveCompletedAssistant = async (content: string) => {
    await saveAssistantTurn(db, {
      id: crypto.randomUUID(),
      conversationId: conversation.id,
      userId,
      agentId,
      userMessageId,
      userContent: currentUserContent,
      assistantContent: content,
      previousSummary: conversation.summary,
      recentMessages: history.slice(-SUMMARY_RECENT_MESSAGE_LIMIT),
      allowMemoryExtraction: safety.allowMemoryExtraction,
      nowMs: Date.now(),
    });
  };

  if (isDirectBoundaryReply(safety)) {
    await saveUserMessage(db, {
      id: userMessageId,
      conversationId: conversation.id,
      userId,
      agentId,
      content: currentUserContent,
      metadataJson: safetyMetadataJson,
      nowMs: userMessageAtMs,
    });

    return buildTextStreamResponse(
      buildImmediateTextStream(
        getBoundaryReply(safety.boundaryAction),
        saveCompletedAssistant,
      ),
    );
  }

  const analysis = await analyzeConversation(env, {
    agentName: agent.name,
    agentGuardrails: agent.guardrailsPrompt,
    safety,
    activeMemories: memories,
    recentMessages: history,
    messageCount: conversation.messageCount,
    userText: currentUserContent,
  });
  const { intent, emotion, emotionRoute } = analysis;

  await saveUserMessage(db, {
    id: userMessageId,
    conversationId: conversation.id,
    userId,
    agentId,
    content: currentUserContent,
    metadataJson: mergeConversationMetadata(safetyMetadataJson, {
      intentAnalysisVersion: CONVERSATION_INTENT_ANALYSIS_VERSION,
      intent,
      emotionAnalysisVersion: CONVERSATION_EMOTION_ANALYSIS_VERSION,
      emotion,
      emotionRouteVersion: EMOTION_ROUTE_VERSION,
      emotionRoute,
    }),
    nowMs: userMessageAtMs,
  });

  const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: buildMessages({
        agent,
        conversation,
        memories,
        history,
        currentUserContent,
        safety,
        intent,
        emotion,
        emotionRoute,
      }),
      stream: true,
    }),
  });

  if (!upstreamResponse.ok) {
    const reason = await upstreamResponse.text();
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "Upstream completion request failed",
      500,
      { reason, upstreamStatus: upstreamResponse.status },
    );
  }

  if (!upstreamResponse.body) {
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "Upstream completion response has no body",
      500,
    );
  }

  return buildTextStreamResponse(
    sseToTextReadableStream(upstreamResponse.body, saveCompletedAssistant),
  );
}
