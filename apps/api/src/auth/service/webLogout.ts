import type { Context } from "hono";
import { getApiEnv, type ApiEnvBindings } from "/env";
import { getDb } from "@/db/client";
import {
  refreshTokenInvalidError,
  refreshTokenReplayedError,
  sessionRevokedError,
} from "../errors";
import { verifyRefreshToken } from "../jwt";
import { sha256Hex } from "../password";
import { findWebTokenRefreshRecord, revokeSession } from "../repository";

export const handleWebLogout = async (
  context: Context<{ Bindings: ApiEnvBindings }>,
  refreshToken: string,
): Promise<{ success: boolean }> => {
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

  await revokeSession(db, {
    sessionId: currentToken.sessionId,
    revokedAtMs: nowMs,
  });

  return { success: true };
};
