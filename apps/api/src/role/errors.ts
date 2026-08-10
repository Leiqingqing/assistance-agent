import {
  AppError,
  BizCode,
  type AppErrorStatus,
} from "@repo/contracts/common";
import type { RoleError, RoleErrorReason } from "@repo/contracts/role";

function createRoleError(
  code: BizCode,
  message: string,
  status: AppErrorStatus,
  reason: RoleErrorReason,
): AppError<RoleError> {
  return new AppError<RoleError>(code, message, status, { reason });
}

export function roleApplicationNotFoundError(): AppError<RoleError> {
  return createRoleError(
    BizCode.COMMON_NOT_FOUND,
    "Application was not found",
    404,
    "APPLICATION_NOT_FOUND",
  );
}

export function roleCodeConflictError(): AppError<RoleError> {
  return createRoleError(
    BizCode.BIZ_CONFLICT,
    "A role with this code already exists in the application",
    409,
    "ROLE_CODE_CONFLICT",
  );
}

export function roleNotFoundError(): AppError<RoleError> {
  return createRoleError(
    BizCode.COMMON_NOT_FOUND,
    "Role was not found",
    404,
    "ROLE_NOT_FOUND",
  );
}

export function roleProtectedError(): AppError<RoleError> {
  return createRoleError(
    BizCode.BIZ_RULE_VIOLATION,
    "Protected roles cannot be changed",
    422,
    "ROLE_PROTECTED",
  );
}
