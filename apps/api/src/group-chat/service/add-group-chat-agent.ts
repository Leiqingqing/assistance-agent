import {
  AddAgentGroupChatResponseSchema,
  AGENT_GROUP_CHAT_MAX_AGENTS,
  type AddAgentGroupChatRequest,
} from "@repo/contracts/group-chat";
import type { Context } from "hono";
import { uuidv7 } from "uuidv7";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import {
  groupChatAgentAlreadyActiveError,
  groupChatAgentLimitReachedError,
  groupChatAgentNotFoundError,
  groupChatNotFoundError,
} from "../errors";
import {
  findOwnedGroupChatRecord,
  listGroupChatMemberRecords,
  listLatestGroupChatMessageRecords,
  listOwnedAgentsByIds,
  saveGroupChatMemberRecord,
} from "../repository";

export async function handleAddGroupChatAgent(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  groupChatId: string,
  request: AddAgentGroupChatRequest,
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const [groupChat, agents, members] = await Promise.all([
    findOwnedGroupChatRecord(db, userId, groupChatId),
    listOwnedAgentsByIds(db, userId, [request.agentId]),
    listGroupChatMemberRecords(db, userId, [groupChatId]),
  ]);

  if (groupChat === null) {
    throw groupChatNotFoundError();
  }

  if (agents.length !== 1) {
    throw groupChatAgentNotFoundError();
  }

  const existingMember = members.find(
    (member) => member.agentId === request.agentId,
  );

  if (existingMember?.status === "active") {
    throw groupChatAgentAlreadyActiveError();
  }

  const activeMemberCount = members.filter(
    (member) => member.status === "active",
  ).length;

  if (activeMemberCount >= AGENT_GROUP_CHAT_MAX_AGENTS) {
    throw groupChatAgentLimitReachedError();
  }

  const nowMs = Date.now();
  const displayOrder =
    Math.max(-1, ...members.map((member) => member.displayOrder)) + 1;

  await saveGroupChatMemberRecord(db, {
    id: existingMember?.id ?? uuidv7(),
    existingMemberId: existingMember?.id,
    groupChatId,
    userId,
    agentId: request.agentId,
    displayOrder,
    nowMs,
  });

  const [updatedMembers, latestMessages] = await Promise.all([
    listGroupChatMemberRecords(db, userId, [groupChatId]),
    listLatestGroupChatMessageRecords(db, userId, [groupChatId]),
  ]);

  return AddAgentGroupChatResponseSchema.parse({
    groupChat: {
      id: groupChat.id,
      title: groupChat.title,
      summary: groupChat.summary,
      messageCount: groupChat.messageCount,
      lastMessageAtMs: groupChat.lastMessageAtMs,
      createdAtMs: groupChat.createdAtMs,
      updatedAtMs: nowMs,
      members: updatedMembers,
      latestMessage: latestMessages[0] ?? null,
    },
  });
}
