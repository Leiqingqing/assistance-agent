import { AgentConversationResponseSchema } from "@repo/contracts/chat";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { MESSAGE_PAGE_SIZE } from "@/chat/constants";
import { agentNotFoundError, conversationNotFoundError } from "@/chat/errors";
import {
  doesUserOwnAgent,
  findConversation,
  listConversationMessages,
} from "@/chat/repository";
import type { MessagesQuery } from "@/chat/types";
import { getDb } from "@/db/client";

export async function handleGetMessages(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  agentId: string,
  query: MessagesQuery,
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const ownsAgent = await doesUserOwnAgent(db, userId, agentId);

  if (!ownsAgent) {
    throw agentNotFoundError();
  }

  const conversation = await findConversation(db, userId, agentId);

  if (conversation === null) {
    throw conversationNotFoundError();
  }

  const records = await listConversationMessages(db, {
    conversationId: conversation.id,
    userId,
    agentId,
    limit: MESSAGE_PAGE_SIZE,
    cursor: query.cursor,
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
    openingMessage: null,
    messages,
    nextCursor,
  });
}
