import { z } from "zod";
import { type ApiResponse } from "../common";
import { authFailureSchema, authMetaSchema, type AuthError } from "./error";
import { accessTokenResultSchema, type AccessTokenResult } from "./token";

export interface PasswordLoginRequest {
  email: string;
  password: string;
}

export type PasswordLoginResponse = ApiResponse<AccessTokenResult, AuthError>;

export const passwordLoginRequestSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(1024),
}) satisfies z.ZodType<PasswordLoginRequest>;

export const passwordLoginResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    meta: authMetaSchema,
    data: accessTokenResultSchema,
  }),
  authFailureSchema,
]) satisfies z.ZodType<PasswordLoginResponse>;
