import {
  MemoryListResponseSchema,
  type ListMemoriesQuery,
} from "@repo/contracts/memory";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import { memoryAgentNotFoundError } from "../errors";
import { doesUserOwnAgent, listOwnedMemoryRecords } from "../repository";

export async function handleListMemories(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  query: ListMemoriesQuery,
) {
  const db = getDb(context.env.DB);
  const userId = context.get("userId");

  if (!(await doesUserOwnAgent(db, userId, query.agentId))) {
    throw memoryAgentNotFoundError();
  }

  const memories = await listOwnedMemoryRecords(
    db,
    userId,
    query.agentId,
    query.status,
  );

  return MemoryListResponseSchema.parse({ memories });
}
