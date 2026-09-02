import {
  CreateAgentGroupChatResponseSchema,
  type CreateAgentGroupChatRequest,
} from "@repo/contracts/group-chat";
import type { Context } from "hono";
import { uuidv7 } from "uuidv7";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import {
  duplicateGroupChatAgentsError,
  groupChatAgentNotFoundError,
} from "../errors";
import { createGroupChatRecord, listOwnedAgentsByIds } from "../repository";

export async function handleCreateGroupChat(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  request: CreateAgentGroupChatRequest,
) {
  const uniqueAgentIds = new Set(request.agentIds);

  if (uniqueAgentIds.size !== request.agentIds.length) {
    throw duplicateGroupChatAgentsError();
  }

  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const agents = await listOwnedAgentsByIds(db, userId, request.agentIds);

  if (agents.length !== request.agentIds.length) {
    throw groupChatAgentNotFoundError();
  }

  const groupChatId = uuidv7();
  const nowMs = Date.now();
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const members = request.agentIds.map((agentId, displayOrder) => ({
    id: uuidv7(),
    agentId,
    displayOrder,
  }));

  await createGroupChatRecord(db, {
    id: groupChatId,
    userId,
    title: request.title,
    nowMs,
    members,
  });

  return CreateAgentGroupChatResponseSchema.parse({
    groupChat: {
      id: groupChatId,
      title: request.title,
      summary: null,
      messageCount: 0,
      lastMessageAtMs: null,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      members: members.map((member) => {
        const agent = agentsById.get(member.agentId);

        if (agent === undefined) {
          throw groupChatAgentNotFoundError();
        }

        return {
          id: member.id,
          agentId: member.agentId,
          name: agent.name,
          headline: agent.headline,
          imageKey: agent.imageKey,
          status: "active",
          displayOrder: member.displayOrder,
          joinedAtMs: nowMs,
        };
      }),
      latestMessage: null,
    },
  });
}
