import { AgentCompanionListResponseSchema } from "@repo/contracts/chat";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";
import type { AuthVariables } from "@/auth/require-user";
import { listOwnedAgents } from "@/chat/repository";
import { getDb } from "@/db/client";

export async function handleListAgents(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
) {
  const agents = await listOwnedAgents(
    getDb(context.env.DB),
    context.get("userId"),
  );

  return AgentCompanionListResponseSchema.parse({ agents });
}
