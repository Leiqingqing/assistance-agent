import { MemorySchema, type UpdateMemoryRequest } from "@repo/contracts/memory";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import { memoryNotFoundError } from "../errors";
import { updateOwnedMemoryRecord } from "../repository";

export async function handleUpdateMemory(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  memoryId: string,
  request: UpdateMemoryRequest,
) {
  const memory = await updateOwnedMemoryRecord(
    getDb(context.env.DB),
    context.get("userId"),
    memoryId,
    { ...request, updatedAtMs: Date.now() },
  );

  if (memory === null) {
    throw memoryNotFoundError();
  }

  return MemorySchema.parse(memory);
}
