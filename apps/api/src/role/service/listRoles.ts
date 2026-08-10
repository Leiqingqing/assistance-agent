import {
  RoleListResponseSchema,
  type ListRolesQuery,
} from "@repo/contracts/role";
import type { Context } from "hono";
import { getDb } from "@/db/client";
import type { ApiEnvBindings } from "/env";
import { roleApplicationNotFoundError } from "../errors";
import { isActiveApplication, listRoleRecords } from "../repository";

export async function handleListRoles(
  context: Context<{ Bindings: ApiEnvBindings }>,
  query: ListRolesQuery,
) {
  const db = getDb(context.env.DB);

  if (!(await isActiveApplication(db, query.applicationId))) {
    throw roleApplicationNotFoundError();
  }

  const roles = await listRoleRecords(db, query.applicationId, query.status);

  return RoleListResponseSchema.parse({ roles });
}
