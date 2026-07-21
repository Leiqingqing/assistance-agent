export interface RefreshTokenClaims {
  sub: string;
  sid: string;
  appId: string;
  jti: string;
}

export type AccessTokenClaims = Omit<RefreshTokenClaims, "jti">;

export interface SessionContext{
    userId: string;
    sessionId: string;
    applicationId: string;
    refreshTokenJti: string;
}