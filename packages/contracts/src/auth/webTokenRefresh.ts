import { z } from "zod";
import { WebPasswordLoginResponseSchema } from "./webPasswordLogin";

export const WebTokenRefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type WebTokenRefreshRequest = z.infer<
  typeof WebTokenRefreshRequestSchema
>;

export const WebTokenRefreshResponseSchema = WebPasswordLoginResponseSchema;

export type WebTokenRefreshResponse = z.infer<
  typeof WebTokenRefreshResponseSchema
>;
