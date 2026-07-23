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

export function applicationNotFoundError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_UNAUTHORIZED,
    "Admin application is unavailable",
    401,
    "APPLICATION_NOT_FOUND",
  );
}

export function authMethodDisabledError(): AppError<AuthError> {
  return createAuthError(
    BizCode.AUTH_FORBIDDEN,
    "Password login is disabled for the admin application",
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
