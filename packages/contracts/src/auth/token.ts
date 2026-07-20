import { z } from "zod";
import { type ApiResponse } from "../common";
import { authFailureSchema, authMetaSchema, type AuthError } from "./error";

export interface AccessTokenResult {
  tokenType: "Bearer";
  accessToken: string;
  accessTokenExpiresAt: string;
}

export type RefreshAccessTokenResponse = ApiResponse<
  AccessTokenResult,
  AuthError
>;

export const accessTokenResultSchema = z.object({
  tokenType: z.literal("Bearer"),
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.string().datetime(),
}) satisfies z.ZodType<AccessTokenResult>;

export const refreshAccessTokenResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    meta: authMetaSchema,
    data: accessTokenResultSchema,
  }),
  authFailureSchema,
]) satisfies z.ZodType<RefreshAccessTokenResponse>;
