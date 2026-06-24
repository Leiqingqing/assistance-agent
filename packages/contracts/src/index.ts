import { z } from "zod";

export const BizCode = {
  COMMON_INVALID_REQUEST: "COMMON.INVALID_REQUEST",
  COMMON_NOT_FOUND: "COMMON.NOT_FOUND",
  AUTH_UNAUTHORIZED: "AUTH.UNAUTHORIZED",
  AUTH_FORBIDDEN: "AUTH.FORBIDDEN",
  BIZ_CONFLICT: "BIZ.CONFLICT",
  BIZ_RULE_VIOLATION: "BIZ.RULE_VIOLATION",
  SYSTEM_INTERNAL_ERROR: "SYSTEM.INTERNAL_ERROR",
  SYSTEM_UPSTREAM_TIMEOUT: "SYSTEM.UPSTREAM_TIMEOUT",
} as const;

export type BizCode = (typeof BizCode)[keyof typeof BizCode];

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  ok: true;
  meta: ApiMeta;
  data: T;
}

export interface ApiError<E> {
  code: BizCode;
  message: string;
  details?: E;
}

export interface ApiFailure<E> {
  ok: false;
  meta: ApiMeta;
  error: ApiError<E>;
}

export type ApiResponse<T, E> = ApiSuccess<T> | ApiFailure<E>;

export const buildSuccess = <T>(meta: ApiMeta, data: T): ApiSuccess<T> => ({
  ok: true,
  meta,
  data,
});

export const buildFailure = <E>(
  error: ApiError<E>,
  meta: ApiMeta,
): ApiFailure<E> => ({
  ok: false,
  meta,
  error,
});

export interface PingRequest {
  nonce: string;
  sentAt: string;
  source: string;
}

export interface PingResult {
  pong: true;
  echo: PingRequest;
  serverTime: string;
}

export interface PingError {
  reason: string;
}

export type PingResponse = ApiResponse<PingResult, PingError>;

export const pingRequestSchema = z.object({
  nonce: z.string().min(1).max(128),
  sentAt: z.string().datetime(),
  source: z.string().min(1).max(64),
}) satisfies z.ZodType<PingRequest>;

export const pingResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    meta: z.object({
      requestId: z.string().min(1),
      timestamp: z.string().datetime(),
    }),
    data: z.object({
      pong: z.literal(true),
      echo: pingRequestSchema,
      serverTime: z.string().datetime(),
    }),
  }),
  z.object({
    ok: z.literal(false),
    meta: z.object({
      requestId: z.string().min(1),
      timestamp: z.string().datetime(),
    }),
    error: z.object({
      code: z.enum(BizCode),
      message: z.string().min(1),
      details: z.object({
        reason: z.string().min(1),
      }),
    }),
  }),
]) satisfies z.ZodType<PingResponse>;
