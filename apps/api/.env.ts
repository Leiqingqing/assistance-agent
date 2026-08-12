import { z } from "zod";

export const appEnvSchema = z.enum(["development", "test", "production"]);


export const apiEnvBindingsSchema = z.object({
  APP_ENV: appEnvSchema,
  API_BASE_URL: z.string().url(),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive(),
  REFRESH_TOKEN_TTL_SEC: z.coerce.number().int().positive(),
  ADMIN_ORIGIN: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_BASE_URL: z.string().url().optional(),
  DEEPSEEK_MODEL: z.string().min(1).optional(),
});

export type ApiD1Bindings = {
  DB: D1Database;
};

export type AppEnv = z.infer<typeof appEnvSchema>;
export type ApiEnvVars = z.input<typeof apiEnvBindingsSchema>;
export type ApiEnvBindings = ApiEnvVars & ApiD1Bindings;
export type ParsedApiEnvBindings = z.infer<typeof apiEnvBindingsSchema>;

export function getApiEnv(env: ApiEnvVars): ParsedApiEnvBindings {
  return apiEnvBindingsSchema.parse(env);
}

export function getAppEnv(env: ApiEnvBindings): AppEnv {
  return getApiEnv(env).APP_ENV;
}

export function getApiBaseUrl(env: ApiEnvBindings): string {
  return getApiEnv(env).API_BASE_URL;
}
