import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  applicationAuthMethods,
  applications,
  authSessions,
  passwordCredentials,
  refreshTokens,
  userEmails,
  users,
} from "@/db/schema";
import type {
  AdminPasswordLoginAccountRecord,
  AdminPasswordLoginPolicyRecord,
  CreateAuthSessionInput,
  InsertRefreshTokenInput,
  RecordPasswordLoginFailureInput,
} from "./types";

function parseRoles(value: string): string[] {
  const roles: unknown = JSON.parse(value);
  return Array.isArray(roles)
    ? roles.filter((role): role is string => typeof role === "string")
    : [];
}

export const findAdminPasswordLoginPolicy = async (
  db: Db,
): Promise<AdminPasswordLoginPolicyRecord | null> => {
  const [record] = await db
    .select({
      applicationId: applications.id,
      isPasswordEnabled: applicationAuthMethods.isEnabled,
    })
    .from(applications)
    .leftJoin(
      applicationAuthMethods,
      and(
        eq(applicationAuthMethods.applicationId, applications.id),
        eq(applicationAuthMethods.authMethod, "password"),
        isNull(applicationAuthMethods.deletedAtMs),
      ),
    )
    .where(
      and(
        eq(applications.code, "admin"),
        eq(applications.status, "active"),
        isNull(applications.deletedAtMs),
      ),
    )
    .limit(1);

  if (record === undefined) {
    return null;
  }

  return {
    applicationId: record.applicationId,
    isPasswordEnabled: record.isPasswordEnabled === true,
  };
};

export const canAdminUsePasswordLogin = async (
  db: Db,
): Promise<boolean> => {
  const policy = await findAdminPasswordLoginPolicy(db);
  return policy?.isPasswordEnabled === true;
};

export const findAdminPasswordLoginAccount = async (
  db: Db,
  normalizedEmail: string,
): Promise<AdminPasswordLoginAccountRecord | null> => {
  const adminRolesJson = sql<string>`(
    SELECT COALESCE(json_group_array(role.code), '[]')
    FROM user_role_bindings AS binding
    INNER JOIN roles AS role
      ON role.id = binding.role_id
     AND role.status = 'active'
     AND role.deleted_at_ms IS NULL
    WHERE binding.user_id = ${users.id}
      AND binding.application_id = ${applications.id}
      AND role.application_id = ${applications.id}
      AND binding.revoked_at_ms IS NULL
  )`;
  const [record] = await db
    .select({
      applicationId: applications.id,
      userId: users.id,
      userStatus: users.status,
      emailId: userEmails.id,
      isEmailVerified: userEmails.isVerified,
      isEmailLoginEnabled: userEmails.isLoginEnabled,
      credentialId: passwordCredentials.id,
      passwordHash: passwordCredentials.passwordHash,
      passwordAlgo: passwordCredentials.passwordAlgo,
      failedAttemptCount: passwordCredentials.failedAttemptCount,
      lockedUntilMs: passwordCredentials.lockedUntilMs,
      adminRolesJson,
    })
    .from(userEmails)
    .innerJoin(
      users,
      and(eq(users.id, userEmails.userId), isNull(users.deletedAtMs)),
    )
    .innerJoin(
      applications,
      and(
        eq(applications.code, "admin"),
        eq(applications.status, "active"),
        isNull(applications.deletedAtMs),
      ),
    )
    .leftJoin(
      passwordCredentials,
      and(
        eq(passwordCredentials.userId, users.id),
        isNull(passwordCredentials.disabledAtMs),
      ),
    )
    .where(
      and(
        eq(userEmails.emailNormalized, normalizedEmail),
        isNull(userEmails.deletedAtMs),
      ),
    )
    .limit(1);

  if (record === undefined) {
    return null;
  }

  const roles = parseRoles(record.adminRolesJson);

  return {
    ...record,
    failedAttemptCount: record.failedAttemptCount ?? 0,
    hasAdminRole: roles.length > 0,
    roles,
  };
};

export const recordPasswordLoginFailure = async (
  db: Db,
  input: RecordPasswordLoginFailureInput,
): Promise<void> => {
  await db
    .update(passwordCredentials)
    .set({
      failedAttemptCount: input.failedAttemptCount,
      lockedUntilMs: input.lockedUntilMs,
      updatedAtMs: input.updatedAtMs,
    })
    .where(
      and(
        eq(passwordCredentials.id, input.credentialId),
        isNull(passwordCredentials.disabledAtMs),
      ),
    );
};

export const createAdminPasswordLoginSession = async (
  db: Db,
  input: CreateAuthSessionInput,
): Promise<void> => {
  await db.insert(authSessions).values({
    id: input.id,
    userId: input.userId,
    applicationId: input.applicationId,
    authMethod: "password",
    passwordCredentialId: input.passwordCredentialId,
    loginEmailId: input.loginEmailId,
    createdAtMs: input.createdAtMs,
    lastSeenAtMs: input.createdAtMs,
    expiresAtMs: input.expiresAtMs,
    userAgent: input.userAgent,
    ipHash: input.ipHash,
  });
};

export const insertRefreshToken = async (
  db: Db,
  input: InsertRefreshTokenInput,
): Promise<void> => {
  await db.insert(refreshTokens).values({
    id: input.refreshTokenId,
    sessionId: input.sessionId,
    tokenHash: input.tokenHash,
    status: "active",
    createdAtMs: input.nowMs,
    expiresAtMs: input.refreshTokenExpiresAtMs,
  });
};
