import { AppError, BizCode, type AppErrorStatus } from "@repo/contracts/common";
import type { AuthError, AuthErrorReason } from "@repo/contracts/auth";

function createAuthError(
  code: BizCode,
  message: string,
  status: AppErrorStatus,
  reason: AuthErrorReason,
): AppError<AuthError> {
  return new AppError<AuthError>(code, message, status, { reason });
}

export function applicationNotFoundError(
  applicationName = "Admin",
): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    `${applicationName} application is unavailable`,
    401,
    "APPLICATION_NOT_FOUND",
  );
}

export function authMethodDisabledError(
  applicationName = "admin",
): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_FORBIDDEN,
    `Password login is disabled for the ${applicationName} application`,
    403,
    "AUTH_METHOD_DISABLED",
  );
}

export function emailNotFoundError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Email address was not found",
    401,
    "EMAIL_NOT_FOUND",
  );
}

export function emailLoginDisabledError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Email login is disabled",
    401,
    "EMAIL_LOGIN_DISABLED",
  );
}

export function emailUnverifiedError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Email address is not verified",
    401,
    "EMAIL_UNVERIFIED",
  );
}

export function userDisabledError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_FORBIDDEN,
    "User account is disabled",
    403,
    "USER_DISABLED",
  );
}

export function invalidCredentialsError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Invalid email or password",
    401,
    "INVALID_CREDENTIALS",
  );
}

export function passwordLockedError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Password login is temporarily locked",
    401,
    "PASSWORD_LOCKED",
  );
}

export function refreshTokenInvalidError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Refresh token is invalid",
    401,
    "REFRESH_TOKEN_INVALID",
  );
}

export function sessionRevokedError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Session has been revoked",
    401,
    "SESSION_REVOKED",
  );
}

export function refreshTokenReplayedError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Refresh token has already been used",
    401,
    "REFRESH_TOKEN_REUSED",
  );
}

export function adminRoleRequiredError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_FORBIDDEN,
    "An active admin role is required",
    403,
    "ADMIN_ROLE_REQUIRED",
  );
}

export function accessTokenInvalidError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Access token is invalid",
    401,
    "ACCESS_TOKEN_INVALID",
  );
}

export function adminOwnerRequiredError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_FORBIDDEN,
    "The admin_owner role is required",
    403,
    "ADMIN_OWNER_REQUIRED",
  );
}
