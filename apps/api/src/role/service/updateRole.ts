import { RoleSchema, type UpdateRoleRequest } from "@repo/contracts/role";
import type { Context } from "hono";
import { getDb } from "@/db/client";
import type { ApiEnvBindings } from "/env";
import { isProtectedRoleCode } from "../role-policy";
import { roleNotFoundError, roleProtectedError } from "../errors";
import { findRoleById, updateRoleRecord } from "../repository";
import type { UpdateRoleRecordInput } from "../types";

export async function handleUpdateRole(
  context: Context<{ Bindings: ApiEnvBindings }>,
  roleId: string,
  request: UpdateRoleRequest,
) {
  const db = getDb(context.env.DB);
  const currentRole = await findRoleById(db, roleId);

  if (currentRole === null || currentRole.status === "deleted") {
    throw roleNotFoundError();
  }

  if (isProtectedRoleCode(currentRole.code)) {
    throw roleProtectedError();
  }

  const nowMs = Date.now();
  const input: UpdateRoleRecordInput = {
    name: request.name,
    description: request.description,
    updatedAtMs: nowMs,
  };

  if (request.status !== undefined && request.status !== currentRole.status) {
    input.status = request.status;

    if (request.status === "active") {
      input.activeAtMs = nowMs;
      input.disableAtMs = null;
    } else {
      input.disableAtMs = nowMs;
    }
  }

  const role = await updateRoleRecord(db, roleId, input);

  if (role === null) {
    throw roleNotFoundError();
  }

  return RoleSchema.parse(role);
}
