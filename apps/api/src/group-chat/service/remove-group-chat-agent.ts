import { RemoveAgentGroupChatResponseSchema } from "@repo/contracts/group-chat";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import {
  groupChatAgentNotActiveError,
  groupChatNotFoundError,
} from "../errors";
import {
  findOwnedGroupChatRecord,
  listGroupChatMemberRecords,
  removeActiveGroupChatMemberRecord,
} from "../repository";

export async function handleRemoveGroupChatAgent(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  groupChatId: string,
  agentId: string,
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const [groupChat, members] = await Promise.all([
    findOwnedGroupChatRecord(db, userId, groupChatId),
    listGroupChatMemberRecords(db, userId, [groupChatId]),
  ]);

  if (groupChat === null) {
    throw groupChatNotFoundError();
  }

  const member = members.find(
    (groupChatMember) =>
      groupChatMember.agentId === agentId &&
      groupChatMember.status === "active",
  );

  if (member === undefined) {
    throw groupChatAgentNotActiveError();
  }

  const result = await removeActiveGroupChatMemberRecord(db, {
    groupChatId,
    userId,
    agentId,
    nowMs: Date.now(),
  });

  if (result.removedMember === null) {
    throw groupChatAgentNotActiveError();
  }

  return RemoveAgentGroupChatResponseSchema.parse({
    groupChatId,
    agentId,
    dissolved: result.dissolved,
  });
}
