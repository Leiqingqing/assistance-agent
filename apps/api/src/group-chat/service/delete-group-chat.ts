import { CreateAgentGroupChatResponseSchema } from "@repo/contracts/group-chat";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import { groupChatNotFoundError } from "../errors";
import {
  deleteOwnedGroupChatRecord,
  findOwnedGroupChatRecord,
  listGroupChatMemberRecords,
  listLatestGroupChatMessageRecords,
} from "../repository";

export async function handleDeleteGroupChat(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  groupChatId: string,
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const groupChat = await findOwnedGroupChatRecord(db, userId, groupChatId);

  if (groupChat === null) {
    throw groupChatNotFoundError();
  }

  const [members, latestMessages] = await Promise.all([
    listGroupChatMemberRecords(db, userId, [groupChatId]),
    listLatestGroupChatMessageRecords(db, userId, [groupChatId]),
  ]);
  const response = CreateAgentGroupChatResponseSchema.parse({
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
  });
  const deletedGroupChat = await deleteOwnedGroupChatRecord(
    db,
    userId,
    groupChatId,
  );

  if (deletedGroupChat === null) {
    throw groupChatNotFoundError();
  }

  return response;
}
