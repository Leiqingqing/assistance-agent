import { AgentGroupChatDetailResponseSchema } from "@repo/contracts/group-chat";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import { GROUP_CHAT_MESSAGE_PAGE_SIZE } from "../constants";
import { groupChatNotFoundError } from "../errors";
import {
  findOwnedGroupChatRecord,
  listGroupChatMemberRecords,
  listGroupChatMessageRecords,
  listLatestGroupChatMessageRecords,
} from "../repository";

export async function handleGetGroupChatMessages(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  groupChatId: string,
  query: { cursor?: number },
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const groupChat = await findOwnedGroupChatRecord(db, userId, groupChatId);

  if (groupChat === null) {
    throw groupChatNotFoundError();
  }

  const [members, latestMessages, records] = await Promise.all([
    listGroupChatMemberRecords(db, userId, [groupChatId]),
    listLatestGroupChatMessageRecords(db, userId, [groupChatId]),
    listGroupChatMessageRecords(db, {
      groupChatId,
      userId,
      limit: GROUP_CHAT_MESSAGE_PAGE_SIZE,
      cursor: query.cursor,
    }),
  ]);
  const nextCursor =
    records.length === GROUP_CHAT_MESSAGE_PAGE_SIZE && records.length > 0
      ? String(records[records.length - 1]!.createdAtMs)
      : null;

  return AgentGroupChatDetailResponseSchema.parse({
    groupChat: {
      id: groupChat.id,
      title: groupChat.title,
      summary: groupChat.summary,
      messageCount: groupChat.messageCount,
      lastMessageAtMs: groupChat.lastMessageAtMs,
      createdAtMs: groupChat.createdAtMs,
      updatedAtMs: groupChat.updatedAtMs,
      members,
      latestMessage: latestMessages[0] ?? null,
    },
    messages: records.reverse(),
    nextCursor,
  });
}
