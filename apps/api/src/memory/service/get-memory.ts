import { MemorySchema } from "@repo/contracts/memory";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import { memoryNotFoundError } from "../errors";
import { findOwnedMemoryById } from "../repository";

export async function handleGetMemory(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  memoryId: string,
) {
  const memory = await findOwnedMemoryById(
    getDb(context.env.DB),
    context.get("userId"),
    memoryId,
  );

  if (memory === null) {
    throw memoryNotFoundError();
  }

  return MemorySchema.parse(memory);
}
