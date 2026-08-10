import { SignJWT, jwtVerify } from "jose";
import { uuidv7 } from "uuidv7";
import type { AccessTokenClaims, RefreshTokenClaims, SessionContext } from "./types";

const JWT_ALGORITHM = "HS256";

export type JwtSecretInput = string | ArrayBuffer | Uint8Array;

export function toSecret(secret: JwtSecretInput): Uint8Array {
  if (typeof secret === "string") {
    return new TextEncoder().encode(secret);
  }

  if (secret instanceof Uint8Array) {
    return secret;
  }

  return new Uint8Array(secret);
}

export async function signAccessToken(
  params:{
    claims: AccessTokenClaims,
    secret: string,
    ttlSec: number
  }
): Promise<string> {
  // JWT NumericDate uses seconds, while the app stores timestamps in milliseconds.
  const nowSec = Math.floor(Date.now() / 1000);
  const jwt = new SignJWT({
    sid: params.claims.sid,
    appId: params.claims.appId,
    roles: params.claims.roles,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setSubject(params.claims.sub)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + params.ttlSec);

  return jwt.sign(toSecret(params.secret));
}

export async function verifyAccessToken(
  params: {
    token: string;
    secret: string;
  },
): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(params.token, toSecret(params.secret));
  const sub = payload.sub;
  const sid = payload.sid;
  const appId = payload.appId;
  const roles = payload.roles;

  if (
    typeof sub !== "string" ||
    typeof sid !== "string" ||
    typeof appId !== "string" ||
    !Array.isArray(roles) ||
    !roles.every((role) => typeof role === "string")
  ) {
    throw new Error("Invalid access token claims");
  }

  return {
    sub,
    sid,
    appId,
    roles,
  };
}

export async function signRefreshToken(
  params:{
    claims: Omit<RefreshTokenClaims, "jti">,
    secret: string,
    ttlSec: number
  }
): Promise<{token: string, jti: string}> {
  // JWT NumericDate uses seconds, while the app stores timestamps in milliseconds.
  const nowSec = Math.floor(Date.now() / 1000);
  const jti = uuidv7();
  const jwt = new SignJWT({
    sid: params.claims.sid,
    appId: params.claims.appId,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setSubject(params.claims.sub)
    .setJti(jti)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + params.ttlSec);

  const token = await jwt.sign(toSecret(params.secret));

  return { token, jti };
}

export async function verifyRefreshToken(
  params:{
    token: string,
    secret: string
  }
): Promise<RefreshTokenClaims> {
  const { payload } = await jwtVerify( params.token, toSecret(params.secret));
  const sub = payload.sub;
  const sid = payload.sid;
  const appId = payload.appId;
  const jti = payload.jti;

  if (
    typeof sub !== "string" ||
    typeof sid !== "string" ||
    typeof appId !== "string" ||
    typeof jti !== "string"
  ) {
    throw new Error("Invalid refresh token claims");
  }

  return {
    sub,
    sid,
    appId,
    jti,
  };
}

export async function issueAdminTokenPair(
  params:{
    claims: SessionContext,
    accessTokenSecret: string,
    refreshTokenSecret: string,
    accessTtlSec: number,
    refreshTtlSec: number
  }
): Promise<{accessToken: string, refreshToken: string, refreshTokenJti: string}> {
  const accessToken = await signAccessToken({
    secret: params.accessTokenSecret,
    claims: {
      sub: params.claims.userId,
      sid: params.claims.sessionId,
      appId: params.claims.applicationId,
      roles: params.claims.roles,
    },
    ttlSec: params.accessTtlSec,
  });

  const refreshTokenResult = await signRefreshToken({
    secret: params.refreshTokenSecret,
    claims: {
      sub: params.claims.userId,
      sid: params.claims.sessionId,
      appId: params.claims.applicationId,
    },
    ttlSec: params.refreshTtlSec,
  });

  return {
    accessToken,
    refreshToken: refreshTokenResult.token,
    refreshTokenJti: refreshTokenResult.jti,
  };
}
