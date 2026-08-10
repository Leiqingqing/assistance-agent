import { z } from "zod";
import { BizCode } from "../common";

export interface AuthError {
  reason: AuthErrorReason;
}

export type AuthErrorReason =
  | "ACCESS_TOKEN_INVALID"
  | "ADMIN_OWNER_REQUIRED"
  | "ADMIN_ROLE_REQUIRED"
  | "APPLICATION_NOT_FOUND"
  | "AUTH_METHOD_DISABLED"
  | "EMAIL_LOGIN_DISABLED"
  | "EMAIL_NOT_FOUND"
  | "EMAIL_UNVERIFIED"
  | "INVALID_CREDENTIALS"
  | "PASSWORD_LOCKED"
  | "REFRESH_TOKEN_EXPIRED"
  | "REFRESH_TOKEN_INVALID"
  | "REFRESH_TOKEN_REUSED"
  | "SESSION_REVOKED"
  | "USER_DISABLED";

export const authErrorReasonSchema = z.enum([
  "ACCESS_TOKEN_INVALID",
  "ADMIN_OWNER_REQUIRED",
  "ADMIN_ROLE_REQUIRED",
  "APPLICATION_NOT_FOUND",
  "AUTH_METHOD_DISABLED",
  "EMAIL_LOGIN_DISABLED",
  "EMAIL_NOT_FOUND",
  "EMAIL_UNVERIFIED",
  "INVALID_CREDENTIALS",
  "PASSWORD_LOCKED",
  "REFRESH_TOKEN_EXPIRED",
  "REFRESH_TOKEN_INVALID",
  "REFRESH_TOKEN_REUSED",
  "SESSION_REVOKED",
  "USER_DISABLED",
]) satisfies z.ZodType<AuthErrorReason>;

export const authErrorSchema = z.object({
  reason: authErrorReasonSchema,
}) satisfies z.ZodType<AuthError>;

export const authMetaSchema = z.object({
  requestId: z.string().min(1),
  timestamp: z.string().datetime(),
});

export const authFailureSchema = z.object({
  ok: z.literal(false),
  meta: authMetaSchema,
  error: z.object({
    code: z.enum(BizCode),
    message: z.string().min(1),
    details: authErrorSchema,
  }),
});
