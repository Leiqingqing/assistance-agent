import { AgentConversationResponseSchema } from "@repo/contracts/chat";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { MESSAGE_PAGE_SIZE } from "@/chat/constants";
import { agentNotFoundError } from "@/chat/errors";
import { getDb } from "@/db/client";
import {
  findOwnedAgent,
  findOrCreateConversation,
  listConversationMessages,
} from "@/chat/repository";

const DEFAULT_OPENING_MESSAGE = "你好！有什么我可以帮助你的吗？";

export async function handleGetConversation(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  agentId: string,
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const agent = await findOwnedAgent(db, userId, agentId);

  if (agent === null) {
    throw agentNotFoundError();
  }

  const conversation = await findOrCreateConversation(db, {
    id: crypto.randomUUID(),
    userId,
    agentId,
    nowMs: Date.now(),
  });
  const records = await listConversationMessages(db, {
    conversationId: conversation.id,
    userId,
    agentId,
    limit: MESSAGE_PAGE_SIZE,
  });
  const nextCursor =
    records.length === MESSAGE_PAGE_SIZE && records.length > 0
      ? String(records[records.length - 1]!.createdAtMs)
      : null;
  const messages = records.reverse().map((message) => ({
    id: message.id,
    conversationId: message.conversationId,
    agentId: message.agentId,
    role: message.role,
    content: message.content,
    status: message.status,
    createdAtMs: message.createdAtMs,
  }));

  return AgentConversationResponseSchema.parse({
    conversationId: conversation.id,
    agentId: conversation.agentId,
    title: conversation.title,
    summary: conversation.summary,
    messageCount: conversation.messageCount,
    openingMessage:
      conversation.messageCount === 0
        ? agent.openingMessage || DEFAULT_OPENING_MESSAGE
        : null,
    messages,
    nextCursor,
  });
}
