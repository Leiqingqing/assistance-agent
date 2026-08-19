import { uuidv7 } from "uuidv7";
import { MemorySchema, type CreateMemoryRequest } from "@repo/contracts/memory";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import { memoryAgentNotFoundError } from "../errors";
import { createMemoryRecord, doesUserOwnAgent } from "../repository";

export async function handleCreateMemory(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  request: CreateMemoryRequest,
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");

  if (!(await doesUserOwnAgent(db, userId, request.agentId))) {
    throw memoryAgentNotFoundError();
  }

  const memory = await createMemoryRecord(db, {
    id: uuidv7(),
    userId,
    agentId: request.agentId,
    type: request.type,
    content: request.content,
    importance: request.importance,
    nowMs: Date.now(),
  });

  return MemorySchema.parse(memory);
}
