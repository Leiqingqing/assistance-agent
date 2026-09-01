import { AppError, BizCode } from "@repo/contracts/common";
import type { Context } from "hono";

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
import {
  buildImmediateReplyResponse,
  generateReplyResponse,
} from "@/chat/service/reply-generation/generate-reply";
import { finalizeTurn } from "@/chat/service/turn-finalization/finalize-turn";
import { planTurn } from "@/chat/service/turn-planning/plan-turn";
import { getDb } from "@/db/client";
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

  const turnPlan = await planTurn(env, {
    agentName: agent.name,
    agentGuardrails: agent.guardrailsPrompt,
    activeMemories: memories,
    recentMessages: history,
    messageCount: conversation.messageCount,
    userText: currentUserContent,
  });

  const saveCompletedAssistant = (content: string) =>
    finalizeTurn({
      db,
      id: crypto.randomUUID(),
      conversationId: conversation.id,
      userId,
      agentId,
      userMessageId,
      userContent: currentUserContent,
      assistantContent: content,
      previousSummary: conversation.summary,
      recentMessages: history.slice(-SUMMARY_RECENT_MESSAGE_LIMIT),
      allowMemoryExtraction: turnPlan.safety.allowMemoryExtraction,
      replyPolicy: turnPlan.kind === "reply" ? turnPlan.replyPolicy : null,
      nowMs: Date.now(),
    });

  await saveUserMessage(db, {
    id: userMessageId,
    conversationId: conversation.id,
    userId,
    agentId,
    content: currentUserContent,
    metadataJson: turnPlan.metadataJson,
    nowMs: userMessageAtMs,
  });

  if (turnPlan.kind === "boundary") {
    return buildImmediateReplyResponse(turnPlan.reply, saveCompletedAssistant);
  }

  return generateReplyResponse(
    env,
    {
      agent,
      conversation,
      memories,
      history,
      currentUserContent,
      safety: turnPlan.safety,
      intent: turnPlan.intent,
      emotion: turnPlan.emotion,
      emotionRoute: turnPlan.emotionRoute,
      replyPolicy: turnPlan.replyPolicy,
    },
    saveCompletedAssistant,
  );
}
