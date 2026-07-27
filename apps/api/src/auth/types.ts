import type {
  AdminPasswordLoginRequest,
  AdminPasswordLoginResponse,
  AdminTokenRefleshResponse,
} from "@repo/contracts/auth";
import type { Context } from "hono";
import type { ApiEnvBindings } from "/env";

export interface RefreshTokenClaims {
  sub: string;
  sid: string;
  appId: string;
  jti: string;
}

export type AccessTokenClaims = Omit<RefreshTokenClaims, "jti">;

export interface SessionContext {
  userId: string;
  sessionId: string;
  applicationId: string;
  roles: string[];
}

export interface AdminPasswordLoginPolicyRecord {
  applicationId: string;
  isPasswordEnabled: boolean;
}

export interface AdminPasswordLoginAccountRecord {
  applicationId: string;
  userId: string;
  userStatus: string;
  emailId: string;
  isEmailVerified: boolean;
  isEmailLoginEnabled: boolean;
  credentialId: string | null;
  passwordHash: string | null;
  passwordAlgo: string | null;
  failedAttemptCount: number;
  lockedUntilMs: number | null;
  hasAdminRole: boolean;
  roles: string[];
}

export interface RecordPasswordLoginFailureInput {
  credentialId: string;
  failedAttemptCount: number;
  lockedUntilMs: number | null;
  updatedAtMs: number;
}

export interface CreateAuthSessionInput {
  id: string;
  userId: string;
  applicationId: string;
  passwordCredentialId: string;
  loginEmailId: string;
  createdAtMs: number;
  expiresAtMs: number;
  userAgent: string | null;
  ipHash: string | null;
}

export interface InsertRefreshTokenInput {
  sessionId: string;
  refreshTokenId: string;
  tokenHash: string;
  nowMs: number;
  refreshTokenExpiresAtMs: number;
}

export interface AdminTokenRefleshRecord {
  refreshTokenId: string;
  tokenHash: string;
  tokenExpiresAtMs: number;
  tokenUsedAtMs: number | null;
  tokenRevokedAtMs: number | null;
  tokenReuseDetectedAtMs: number | null;
  sessionId: string;
  userId: string;
  applicationId: string;
  applicationCode: string;
  applicationStatus: string;
  latestRefreshTokenId: string | null;
  sessionExpiresAtMs: number;
  sessionRevokedAtMs: number | null;
}

export interface MakeRefreshTokenUsedInput {
  refreshTokenId: string;
  usedAtMs: number;
}

export interface UpdateRefreshTokenRotationInput {
  sessionId: string;
  previousRefreshTokenId: string;
  replacementRefreshTokenId: string;
  nowMs: number;
}

export type AdminPasswordLoginResult = AdminPasswordLoginResponse;
export type AdminTokenRefleshResult = AdminTokenRefleshResponse;

export type AdminPasswordLoginService = (
  context: Context<{ Bindings: ApiEnvBindings }>,
  request: AdminPasswordLoginRequest,
) => Promise<AdminPasswordLoginResult>;

export type AdminTokenRefleshService = (
  context: Context<{ Bindings: ApiEnvBindings }>,
  refreshToken: string,
) => Promise<AdminTokenRefleshResult>;
