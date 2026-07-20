import { z } from "zod";
import { type ApiResponse } from "../common";
import { authFailureSchema, authMetaSchema, type AuthError } from "./error";

export type AuthApplicationCode = "web" | "admin";
export type AuthMethod = "password" | "oauth";

export interface AuthMethodSummary {
  method: AuthMethod;
  provider?: string;
  enabled: boolean;
}

export interface AuthMethodsResult {
  applicationCode: AuthApplicationCode;
  methods: AuthMethodSummary[];
}

export type AuthMethodsResponse = ApiResponse<AuthMethodsResult, AuthError>;

export const authApplicationCodeSchema = z.enum([
  "web",
  "admin",
]) satisfies z.ZodType<AuthApplicationCode>;

export const authMethodSchema = z.enum([
  "password",
  "oauth",
]) satisfies z.ZodType<AuthMethod>;

export const authMethodSummarySchema = z.object({
  method: authMethodSchema,
  provider: z.string().min(1).max(64).optional(),
  enabled: z.boolean(),
}) satisfies z.ZodType<AuthMethodSummary>;

export const authMethodsResultSchema = z.object({
  applicationCode: authApplicationCodeSchema,
  methods: z.array(authMethodSummarySchema),
}) satisfies z.ZodType<AuthMethodsResult>;

export const authMethodsResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    meta: authMetaSchema,
    data: authMethodsResultSchema,
  }),
  authFailureSchema,
]) satisfies z.ZodType<AuthMethodsResponse>;
