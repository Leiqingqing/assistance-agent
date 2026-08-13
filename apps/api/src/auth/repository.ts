import { and, eq, gt, isNull, sql } from "drizzle-orm";
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
  AdminTokenRefleshRecord,
  CreateAuthSessionInput,
  InsertRefreshTokenInput,
  MakeRefreshTokenUsedInput,
  RecordPasswordLoginFailureInput,
  RevokeSessionInput,
  UpdateRefreshTokenRotationInput,
} from "./types";

function parseRoles(value: string): string[] {
  const roles: unknown = JSON.parse(value);
  return Array.isArray(roles)
    ? roles.filter((role): role is string => typeof role === "string")
    : [];
}

const findPasswordLoginPolicy = async (
  db: Db,
  applicationCode: string,
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
        eq(applications.code, applicationCode),
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

export const findAdminPasswordLoginPolicy = (db: Db) =>
  findPasswordLoginPolicy(db, "admin");

export const findWebPasswordLoginPolicy = (db: Db) =>
  findPasswordLoginPolicy(db, "web");

export const canAdminUsePasswordLogin = async (db: Db): Promise<boolean> => {
  const policy = await findAdminPasswordLoginPolicy(db);
  return policy?.isPasswordEnabled === true;
};

const findPasswordLoginAccount = async (
  db: Db,
  normalizedEmail: string,
  applicationCode: string,
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
        eq(applications.code, applicationCode),
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

export const findAdminPasswordLoginAccount = (
  db: Db,
  normalizedEmail: string,
) => findPasswordLoginAccount(db, normalizedEmail, "admin");

export const findWebPasswordLoginAccount = (
  db: Db,
  normalizedEmail: string,
) => findPasswordLoginAccount(db, normalizedEmail, "web");

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

export const createPasswordLoginSession = async (
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

export const createAdminPasswordLoginSession = createPasswordLoginSession;
export const createWebPasswordLoginSession = createPasswordLoginSession;

export const insertRefreshToken = async (
  db: Db,
  input: InsertRefreshTokenInput,
): Promise<void> => {
  await db.insert(refreshTokens).values({
    id: input.refreshTokenId,
    sessionId: input.sessionId,
    tokenHash: input.tokenHash,
    createdAtMs: input.nowMs,
    expiresAtMs: input.refreshTokenExpiresAtMs,
  });
};

const findTokenRefreshRecord = async (
  db: Db,
  tokenHash: string,
  sessionId: string,
): Promise<AdminTokenRefleshRecord | null> => {
  const [record] = await db
    .select({
      refreshTokenId: refreshTokens.id,
      tokenExpiresAtMs: refreshTokens.expiresAtMs,
      tokenUsedAtMs: refreshTokens.usedAtMs,
      tokenRevokedAtMs: refreshTokens.revokedAtMs,
      tokenReuseDetectedAtMs: refreshTokens.reuseDetectedAtMs,
      sessionId: authSessions.id,
      userId: authSessions.userId,
      applicationId: authSessions.applicationId,
      applicationCode: applications.code,
      applicationStatus: applications.status,
      sessionExpiresAtMs: authSessions.expiresAtMs,
      sessionRevokedAtMs: authSessions.revokedAtMs,
    })
    .from(refreshTokens)
    .innerJoin(authSessions, eq(authSessions.id, refreshTokens.sessionId))
    .innerJoin(applications, eq(applications.id, authSessions.applicationId))
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(authSessions.id, sessionId),
      ),
    )
    .limit(1);

  return record ?? null;
};

export const findAdminTokenRefleshRecord = findTokenRefreshRecord;
export const findWebTokenRefreshRecord = findTokenRefreshRecord;

const findActiveRoles = async (
  db: Db,
  userId: string,
  applicationId: string,
): Promise<string[]> => {
  const adminRolesJson = sql<string>`(
    SELECT COALESCE(json_group_array(role.code), '[]')
    FROM user_role_bindings AS binding
    INNER JOIN roles AS role
      ON role.id = binding.role_id
     AND role.status = 'active'
     AND role.deleted_at_ms IS NULL
    WHERE binding.user_id = ${userId}
      AND binding.application_id = ${applicationId}
      AND role.application_id = ${applicationId}
      AND binding.revoked_at_ms IS NULL
  )`;
  const [record] = await db
    .select({ adminRolesJson })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.status, "active"),
        isNull(users.deletedAtMs),
      ),
    )
    .limit(1);

  return record === undefined ? [] : parseRoles(record.adminRolesJson);
};

export const findActiveAdminRoles = findActiveRoles;
export const findActiveWebRoles = findActiveRoles;

export const makeUsed = async (
  db: Db,
  input: MakeRefreshTokenUsedInput,
): Promise<boolean> => {
  const claimedTokens = await db
    .update(refreshTokens)
    .set({
      usedAtMs: input.usedAtMs,
    })
    .where(
      and(
        eq(refreshTokens.id, input.refreshTokenId),
        isNull(refreshTokens.usedAtMs),
        isNull(refreshTokens.revokedAtMs),
        isNull(refreshTokens.reuseDetectedAtMs),
        gt(refreshTokens.expiresAtMs, input.usedAtMs),
      ),
    )
    .returning({ id: refreshTokens.id });

  return claimedTokens.length === 1;
};

export const updateRefreshTokenRotation = async (
  db: Db,
  input: UpdateRefreshTokenRotationInput,
): Promise<void> => {
  await db
    .update(refreshTokens)
    .set({ replacedByTokenId: input.replacementRefreshTokenId })
    .where(eq(refreshTokens.id, input.previousRefreshTokenId));

  await db
    .update(authSessions)
    .set({
      lastSeenAtMs: input.nowMs,
    })
    .where(eq(authSessions.id, input.sessionId));
};

export const revokeSession = async (
  db: Db,
  input: RevokeSessionInput,
): Promise<void> => {
  await db.batch([
    db
      .update(authSessions)
      .set({ revokedAtMs: input.revokedAtMs })
      .where(
        and(
          eq(authSessions.id, input.sessionId),
          isNull(authSessions.revokedAtMs),
        ),
      ),
    db
      .update(refreshTokens)
      .set({ revokedAtMs: input.revokedAtMs })
      .where(
        and(
          eq(refreshTokens.sessionId, input.sessionId),
          isNull(refreshTokens.revokedAtMs),
        ),
      ),
  ]);
};
