import { RoleSchema } from "@repo/contracts/role";
import type { Context } from "hono";
import { getDb } from "@/db/client";
import type { ApiEnvBindings } from "/env";
import { isProtectedRoleCode } from "../role-policy";
import { roleNotFoundError, roleProtectedError } from "../errors";
import { deleteRoleRecord, findRoleById } from "../repository";

export async function handleDeleteRole(
  context: Context<{ Bindings: ApiEnvBindings }>,
  roleId: string,
) {
  const db = getDb(context.env.DB);
  const currentRole = await findRoleById(db, roleId);

  if (currentRole === null || currentRole.status === "deleted") {
    throw roleNotFoundError();
  }

  if (isProtectedRoleCode(currentRole.code)) {
    throw roleProtectedError();
  }

  const role = await deleteRoleRecord(db, roleId, Date.now());

  if (role === null) {
    throw roleNotFoundError();
  }

  return RoleSchema.parse(role);
}
