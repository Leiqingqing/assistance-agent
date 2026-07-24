import { z } from "zod";
import { authFailureSchema, authMetaSchema } from "./error";
import { accessTokenResultSchema } from "./token";

export const adminPasswordLoginRequestSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(1024),
}) 

export const adminPasswordLoginResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    meta: authMetaSchema,
    data: accessTokenResultSchema,
  }),
  authFailureSchema,
])

export type  AdminPasswordLoginRequest  = z.infer<typeof adminPasswordLoginRequestSchema>;

export type AdminPasswordLoginResponse = z.infer<typeof adminPasswordLoginResponseSchema>;
