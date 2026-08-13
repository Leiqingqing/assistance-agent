import {
  WebAuthSessionSchema,
  WebTokenRefreshResponseSchema,
} from "@repo/contracts/auth";
import type { Context } from "hono";
import { getApiEnv, type ApiEnvBindings } from "/env";
import { getDb } from "@/db/client";
import {
  refreshTokenInvalidError,
  refreshTokenReplayedError,
  sessionRevokedError,
} from "../errors";
import { issueTokenPair, verifyRefreshToken } from "../jwt";
import { sha256Hex } from "../password";
import {
  findActiveWebRoles,
  findWebTokenRefreshRecord,
  insertRefreshToken,
  makeUsed,
  updateRefreshTokenRotation,
} from "../repository";
import type { SessionContext } from "../types";

export const handleWebTokenRefresh = async (
  context: Context<{ Bindings: ApiEnvBindings }>,
  refreshToken: string,
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
  const currentToken = await findWebTokenRefreshRecord(
    db,
    tokenHash,
    claims.sid,
  );

  if (
    currentToken === null ||
    currentToken.applicationCode !== "web" ||
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

  const roles = await findActiveWebRoles(
    db,
    currentToken.userId,
    currentToken.applicationId,
  );
  const session: SessionContext = {
    userId: currentToken.userId,
    sessionId: currentToken.sessionId,
    applicationId: currentToken.applicationId,
    roles,
  };
  const tokens = await issueTokenPair({
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

  return WebTokenRefreshResponseSchema.parse({
    tokenType: "Bearer",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresInSec: env.ACCESS_TOKEN_TTL_SEC,
    refreshExpiresInSec: env.REFRESH_TOKEN_TTL_SEC,
    session: WebAuthSessionSchema.parse({
      sessionId: currentToken.sessionId,
      userId: currentToken.userId,
      app: "web",
      roles,
      expiresAtMs: currentToken.sessionExpiresAtMs,
    }),
  });
};
