import {
  WebAuthSessionSchema,
  WebPasswordLoginResponseSchema,
  type WebPasswordLoginRequest,
} from "@repo/contracts/auth";
import type { Context } from "hono";
import { uuidv7 } from "uuidv7";
import { getApiEnv, type ApiEnvBindings } from "/env";
import { getDb } from "@/db/client";
import {
  applicationNotFoundError,
  authMethodDisabledError,
  emailLoginDisabledError,
  emailNotFoundError,
  emailUnverifiedError,
  invalidCredentialsError,
  passwordLockedError,
  userDisabledError,
} from "../errors";
import { issueTokenPair } from "../jwt";
import { sha256Hex, verifyPassword } from "../password";
import {
  createWebPasswordLoginSession,
  findWebPasswordLoginAccount,
  findWebPasswordLoginPolicy,
  insertRefreshToken,
  recordPasswordLoginFailure,
} from "../repository";
import type { SessionContext } from "../types";

const PASSWORD_ALGORITHM = "sha256";
const MAX_FAILED_ATTEMPTS = 5;
const PASSWORD_LOCK_DURATION_MS = 15 * 60 * 1000;

export const handleWebPasswordLogin = async (
  context: Context<{ Bindings: ApiEnvBindings }>,
  request: WebPasswordLoginRequest,
) => {
  const db = getDb(context.env.DB);
  const env = getApiEnv(context.env);
  const policy = await findWebPasswordLoginPolicy(db);

  if (policy === null) {
    throw applicationNotFoundError("Web");
  }

  if (!policy.isPasswordEnabled) {
    throw authMethodDisabledError("web");
  }

  const account = await findWebPasswordLoginAccount(
    db,
    request.email.trim().toLowerCase(),
  );

  if (account === null) {
    throw emailNotFoundError();
  }

  if (!account.isEmailLoginEnabled) {
    throw emailLoginDisabledError();
  }

  if (!account.isEmailVerified) {
    throw emailUnverifiedError();
  }

  if (account.userStatus !== "active") {
    throw userDisabledError();
  }

  if (
    account.credentialId === null ||
    account.passwordHash === null ||
    account.passwordAlgo !== PASSWORD_ALGORITHM
  ) {
    throw invalidCredentialsError();
  }

  const nowMs = Date.now();

  if (account.lockedUntilMs !== null && account.lockedUntilMs > nowMs) {
    throw passwordLockedError();
  }

  const passwordMatches = await verifyPassword(
    request.password,
    account.passwordHash,
  );

  if (!passwordMatches) {
    const failedAttemptCount = account.failedAttemptCount + 1;
    const lockedUntilMs =
      failedAttemptCount >= MAX_FAILED_ATTEMPTS
        ? nowMs + PASSWORD_LOCK_DURATION_MS
        : null;

    await recordPasswordLoginFailure(db, {
      credentialId: account.credentialId,
      failedAttemptCount,
      lockedUntilMs,
      updatedAtMs: nowMs,
    });

    throw lockedUntilMs === null
      ? invalidCredentialsError()
      : passwordLockedError();
  }

  const sessionId = uuidv7();
  const refreshTokenExpiresAtMs = nowMs + env.REFRESH_TOKEN_TTL_SEC * 1000;

  await createWebPasswordLoginSession(db, {
    id: sessionId,
    userId: account.userId,
    applicationId: policy.applicationId,
    passwordCredentialId: account.credentialId,
    loginEmailId: account.emailId,
    createdAtMs: nowMs,
    expiresAtMs: refreshTokenExpiresAtMs,
    userAgent: context.req.header("User-Agent") ?? null,
    ipHash: null,
  });

  const session: SessionContext = {
    userId: account.userId,
    sessionId,
    applicationId: policy.applicationId,
    roles: account.roles,
  };
  const tokens = await issueTokenPair({
    claims: session,
    accessTokenSecret: env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
    accessTtlSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshTtlSec: env.REFRESH_TOKEN_TTL_SEC,
  });
  const tokenHash = await sha256Hex(tokens.refreshToken);

  await insertRefreshToken(db, {
    sessionId,
    refreshTokenId: tokens.refreshTokenJti,
    tokenHash,
    nowMs,
    refreshTokenExpiresAtMs,
  });

  return WebPasswordLoginResponseSchema.parse({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: "Bearer",
    expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
    session: WebAuthSessionSchema.parse({
      sessionId,
      userId: account.userId,
      app: "web",
      roles: account.roles,
      expiresAtMs: refreshTokenExpiresAtMs,
    }),
  });
};
