import { getDb } from "@/db/client";
import { getApiEnv, type ApiEnvBindings } from "/env";
import {
  AdminAuthSessionSchema,
  AdminTokenRefleshResponseSchema,
} from "@repo/contracts/auth";
import {
  adminRoleRequiredError,
  refreshTokenInvalidError,
  refreshTokenReplayedError,
  sessionRevokedError,
} from "../errors";
import { issueAdminTokenPair, verifyRefreshToken } from "../jwt";
import { sha256Hex } from "../password";
import {
  findActiveAdminRoles,
  findAdminTokenRefleshRecord,
  insertRefreshToken,
  makeUsed,
  updateRefreshTokenRotation,
} from "../repository";
import type { SessionContext } from "../types";
import type { Context } from "hono";

export const handleAdminTokenReflesh = async (
  context:Context<{ Bindings: ApiEnvBindings }>,
  refreshToken:string,
) => {
  const db = getDb(context.env.DB);
  const env = getApiEnv(context.env);

  const claims = await verifyRefreshToken({
    token: refreshToken,
    secret: env.REFRESH_TOKEN_SECRET,
  }).catch(() => {
    throw refreshTokenInvalidError();
  });
  const tokenHash = await sha256Hex(refreshToken);
  const currentToken = await findAdminTokenRefleshRecord(
    db,
    tokenHash,
    claims.sid,
  );

  if (
    currentToken === null ||
    currentToken.applicationCode !== "admin" ||
    currentToken.applicationStatus !== "active"
  ) {
    throw refreshTokenInvalidError();
  }

  const nowMs = Date.now();

  if (
    currentToken.sessionRevokedAtMs !== null ||
    currentToken.sessionExpiresAtMs <= nowMs
  ) {
    throw sessionRevokedError();
  }

  if (
    currentToken.tokenExpiresAtMs <= nowMs ||
    currentToken.tokenRevokedAtMs !== null
  ) {
    throw refreshTokenInvalidError();
  }

  if (
    currentToken.tokenUsedAtMs !== null ||
    currentToken.tokenReuseDetectedAtMs !== null 
  ) {
    throw refreshTokenReplayedError();
  }

  const isClaimed = await makeUsed(db, {
    refreshTokenId: currentToken.refreshTokenId,
    usedAtMs: nowMs,
  });

  if (!isClaimed) {
    throw refreshTokenReplayedError();
  }

  const roles = await findActiveAdminRoles(
    db,
    currentToken.userId,
    currentToken.applicationId,
  );

  if (!roles.includes("admin")) {
    throw adminRoleRequiredError();
  }

  const session: SessionContext = {
    userId: currentToken.userId,
    sessionId: currentToken.sessionId,
    applicationId: currentToken.applicationId,
    roles,
  };
  const tokens = await issueAdminTokenPair({
    claims: session,
    accessTokenSecret: env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
    accessTtlSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshTtlSec: env.REFRESH_TOKEN_TTL_SEC,
  });
  const refreshTokenExpiresAtMs = nowMs + env.REFRESH_TOKEN_TTL_SEC * 1000;
  const nextTokenHash = await sha256Hex(tokens.refreshToken);

  await insertRefreshToken(db, {
    sessionId: currentToken.sessionId,
    refreshTokenId: tokens.refreshTokenJti,
    tokenHash: nextTokenHash,
    nowMs,
    refreshTokenExpiresAtMs,
  });
  await updateRefreshTokenRotation(db, {
    sessionId: currentToken.sessionId,
    previousRefreshTokenId: currentToken.refreshTokenId,
    replacementRefreshTokenId: tokens.refreshTokenJti,
    nowMs,
  });

  return AdminTokenRefleshResponseSchema.parse({
    tokenType: "Bearer",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
    session: AdminAuthSessionSchema.parse({
      sessionId: currentToken.sessionId,
      userId: currentToken.userId,
      app: "admin",
      roles,
      expiresAtMs: currentToken.sessionExpiresAtMs,
    }),
  });
};

