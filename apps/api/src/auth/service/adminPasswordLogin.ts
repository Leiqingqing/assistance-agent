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
import { uuidv7 } from "uuidv7";
import { getDb } from "@/db/client";
import { getApiEnv, type ApiEnvBindings } from "/env";
import { issueAdminTokenPair } from "../jwt";
import { sha256Hex, verifyPassword } from "../password";
import {
  createAdminPasswordLoginSession,
  findAdminPasswordLoginAccount,
  findAdminPasswordLoginPolicy,
  insertRefreshToken,
  recordPasswordLoginFailure,
} from "../repository";
import type {  SessionContext } from "../types";
import { AdminAuthSessionSchema, AdminPasswordLoginResponseSchema,  type AdminPasswordLoginRequest } from "@repo/contracts";
import type { Context } from "hono";

const PASSWORD_ALGORITHM = "sha256";
const MAX_FAILED_ATTEMPTS = 5;
const PASSWORD_LOCK_DURATION_MS = 15 * 60 * 1000;

export const handelAdminPasswordLoginService =
  async (context:Context<{ Bindings: ApiEnvBindings }>, request:AdminPasswordLoginRequest) => {
    const db = getDb(context.env.DB);
    const env = getApiEnv(context.env);
    const policy = await findAdminPasswordLoginPolicy(db);

    if (policy === null) {
      throw applicationNotFoundError();
    }

    if (!policy.isPasswordEnabled) {
      throw authMethodDisabledError();
    }

    const account = await findAdminPasswordLoginAccount(
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

    if (!account.hasAdminRole) {
      throw invalidCredentialsError();
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

    await createAdminPasswordLoginSession(db, {
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
    const tokens = await issueAdminTokenPair({
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

    return AdminPasswordLoginResponseSchema.parse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: "Bearer",
      expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
      refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
      session: AdminAuthSessionSchema.parse({
        sessionId,
        userId: account.userId,
        app: "admin",
        roles: account.roles,
        expiresAtMs: refreshTokenExpiresAtMs,
      }),
    });
  }
