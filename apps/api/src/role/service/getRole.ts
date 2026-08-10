import { RoleSchema } from "@repo/contracts/role";
import type { Context } from "hono";
import { getDb } from "@/db/client";
import type { ApiEnvBindings } from "/env";
import { roleNotFoundError } from "../errors";
import { findRoleById } from "../repository";

export async function handleGetRole(
  context: Context<{ Bindings: ApiEnvBindings }>,
  roleId: string,
) {
  const role = await findRoleById(getDb(context.env.DB), roleId);

  if (role === null) {
    throw roleNotFoundError();
  }

  return RoleSchema.parse(role);
}
