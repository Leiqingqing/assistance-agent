import { uuidv7 } from "uuidv7";
import { RoleSchema, type CreateRoleRequest } from "@repo/contracts/role";
import type { Context } from "hono";
import { getDb } from "@/db/client";
import type { ApiEnvBindings } from "/env";
import { isProtectedRoleCode } from "../role-policy";
import {
  roleApplicationNotFoundError,
  roleCodeConflictError,
  roleProtectedError,
} from "../errors";
import {
  createRoleRecord,
  doesRoleCodeExist,
  isActiveApplication,
} from "../repository";

function isUniqueRoleCodeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("UNIQUE constraint failed") &&
    error.message.includes("roles")
  );
}

export async function handleCreateRole(
  context: Context<{ Bindings: ApiEnvBindings }>,
  request: CreateRoleRequest,
) {
  if (isProtectedRoleCode(request.code)) {
    throw roleProtectedError();
  }

  const db = getDb(context.env.DB);

  if (!(await isActiveApplication(db, request.applicationId))) {
    throw roleApplicationNotFoundError();
  }

  if (await doesRoleCodeExist(db, request.applicationId, request.code)) {
    throw roleCodeConflictError();
  }

  const nowMs = Date.now();
  const role = await createRoleRecord(db, {
    id: uuidv7(),
    applicationId: request.applicationId,
    code: request.code,
    name: request.name,
    description: request.description ?? null,
    nowMs,
  }).catch((error: unknown) => {
    if (isUniqueRoleCodeError(error)) {
      throw roleCodeConflictError();
    }

    throw error;
  });

  return RoleSchema.parse(role);
}
