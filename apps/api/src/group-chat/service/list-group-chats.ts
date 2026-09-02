import { AgentGroupChatSchema } from "@repo/contracts/group-chat";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import {
  listGroupChatMemberRecords,
  listLatestGroupChatMessageRecords,
  listOwnedGroupChatRecords,
} from "../repository";

export async function handleListGroupChats(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const groupChats = await listOwnedGroupChatRecords(db, userId);
  const groupChatIds = groupChats.map((groupChat) => groupChat.id);
  const [members, latestMessages] = await Promise.all([
    listGroupChatMemberRecords(db, userId, groupChatIds),
    listLatestGroupChatMessageRecords(db, userId, groupChatIds),
  ]);
  const membersByGroupChatId = new Map<
    string,
    Array<(typeof members)[number]>
  >();

  for (const member of members) {
    const groupChatMembers = membersByGroupChatId.get(member.groupChatId) ?? [];
    groupChatMembers.push(member);
    membersByGroupChatId.set(member.groupChatId, groupChatMembers);
  }

  const latestMessagesByGroupChatId = new Map(
    latestMessages.map((message) => [message.groupChatId, message]),
  );

  return groupChats.map((groupChat) =>
    AgentGroupChatSchema.parse({
      id: groupChat.id,
      title: groupChat.title,
      summary: groupChat.summary,
      messageCount: groupChat.messageCount,
      lastMessageAtMs: groupChat.lastMessageAtMs,
      createdAtMs: groupChat.createdAtMs,
      updatedAtMs: groupChat.updatedAtMs,
      members: membersByGroupChatId.get(groupChat.id) ?? [],
      latestMessage: latestMessagesByGroupChatId.get(groupChat.id) ?? null,
    }),
  );
}
