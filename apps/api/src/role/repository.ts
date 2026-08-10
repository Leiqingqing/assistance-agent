import { and, asc, eq, isNull, ne } from "drizzle-orm";
import type { RoleStatus } from "@repo/contracts/role";
import type { Db } from "@/db/client";
import { applications, roles } from "@/db/schema";
import type {
  CreateRoleRecordInput,
  UpdateRoleRecordInput,
} from "./types";

export async function isActiveApplication(
  db: Db,
  applicationId: string,
): Promise<boolean> {
  const [application] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.status, "active"),
        isNull(applications.deletedAtMs),
      ),
    )
    .limit(1);

  return application !== undefined;
}

export async function doesRoleCodeExist(
  db: Db,
  applicationId: string,
  code: string,
): Promise<boolean> {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(
      and(
        eq(roles.applicationId, applicationId),
        eq(roles.code, code),
        isNull(roles.deletedAtMs),
      ),
    )
    .limit(1);

  return role !== undefined;
}

export async function createRoleRecord(
  db: Db,
  input: CreateRoleRecordInput,
) {
  const [role] = await db
    .insert(roles)
    .values({
      id: input.id,
      applicationId: input.applicationId,
      code: input.code,
      name: input.name,
      description: input.description,
      status: "active",
      createdAtMs: input.nowMs,
      updatedAtMs: input.nowMs,
      activeAtMs: input.nowMs,
    })
    .returning();

  return role;
}

export async function findRoleById(db: Db, roleId: string) {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  return role ?? null;
}

export async function listRoleRecords(
  db: Db,
  applicationId: string,
  status?: RoleStatus,
) {
  return db
    .select()
    .from(roles)
    .where(
      status === undefined
        ? eq(roles.applicationId, applicationId)
        : and(
            eq(roles.applicationId, applicationId),
            eq(roles.status, status),
          ),
    )
    .orderBy(asc(roles.code), asc(roles.createdAtMs));
}

export async function updateRoleRecord(
  db: Db,
  roleId: string,
  input: UpdateRoleRecordInput,
) {
  const [role] = await db
    .update(roles)
    .set({
      name: input.name,
      description: input.description,
      status: input.status,
      updatedAtMs: input.updatedAtMs,
      activeAtMs: input.activeAtMs,
      disableAtMs: input.disableAtMs,
    })
    .where(and(eq(roles.id, roleId), ne(roles.status, "deleted")))
    .returning();

  return role ?? null;
}

export async function deleteRoleRecord(
  db: Db,
  roleId: string,
  nowMs: number,
) {
  const [role] = await db
    .update(roles)
    .set({
      status: "deleted",
      updatedAtMs: nowMs,
      deletedAtMs: nowMs,
    })
    .where(and(eq(roles.id, roleId), ne(roles.status, "deleted")))
    .returning();

  return role ?? null;
}
