import { z } from "zod";



export const accessTokenSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.string().datetime(),
  accessTokenTtlSec: z.number().int().positive(),
}) 

export const accessTokenResultSchema = accessTokenSchema;

export type AccessTokenResult = z.infer<typeof accessTokenResultSchema>;

export const refreshAccessTokenSchema = z.object({
  refreshToken: z.string().min(1),
  refreshTokenExpiresAt: z.string().datetime(),
  refreshTokenTtlSec: z.number().int().positive(),
})


