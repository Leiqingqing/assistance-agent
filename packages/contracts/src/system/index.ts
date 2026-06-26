import { z } from "zod";
import { BizCode, type ApiResponse } from "../common";

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
