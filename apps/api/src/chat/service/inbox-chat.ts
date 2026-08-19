import { AppError, BizCode } from "@repo/contracts/common";
import { InboxChatRequestSchema } from "@repo/contracts/chat";
import type { Context } from "hono";
import type { z } from "zod";
import { getApiEnv, type ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import {
  MEMORY_INJECTION_LIMIT,
  MESSAGE_PAGE_SIZE,
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
import { saveAssistantTurn } from "@/chat/service/save-assistant-turn";
import { getDb } from "@/db/client";
import { buildTextStreamResponse } from "@/lib/response";

type InboxChatRequest = z.infer<typeof InboxChatRequestSchema>;
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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

type AgentPrompt = {
  name: string;
  headline: string | null;
  description: string | null;
  storyBackground: string | null;
  personalityPrompt: string | null;
  tonePrompt: string | null;
  guardrailsPrompt: string | null;
  defaultPrompt: string | null;
};

type ConversationPrompt = {
  summary: string | null;
};

type MemoryPrompt = {
  type: string;
  content: string;
  importance: number;
};

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

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

function buildMessages(input: {
  agent: AgentPrompt;
  conversation: ConversationPrompt;
  memories: MemoryPrompt[];
  history: HistoryMessage[];
  currentUserContent: string;
}): ChatMessage[] {
  const { agent, conversation, memories, history, currentUserContent } = input;
  const messages: ChatMessage[] = [
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
    messages.push({
      role: message.role,
      content: message.content,
    });
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

  await saveUserMessage(db, {
    id: userMessageId,
    conversationId: conversation.id,
    userId,
    agentId,
    content: currentUserContent,
    nowMs: userMessageAtMs,
  });

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
      excludeMessageId: userMessageId,
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
  const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL ?? "deepseek-chat",
      messages: buildMessages({
        agent,
        conversation,
        memories,
        history,
        currentUserContent,
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
    sseToTextReadableStream(upstreamResponse.body, async (content) => {
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
        nowMs: Date.now(),
      });
    }),
  );
}
