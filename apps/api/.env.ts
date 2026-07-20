import { z } from "zod";

export const appEnvSchema = z.enum(["development", "test", "production"]);
export const apiBaseUrlEnvSchema = z.string().url();
export const apiEnvBindingsSchema = z.object({
  APP_ENV: appEnvSchema,
  API_BASE_URL: apiBaseUrlEnvSchema,
});

export type ApiD1Bindings = {
  DB: D1Database;
};

export type AppEnv = z.infer<typeof appEnvSchema>;
export type ApiBaseUrlEnv = z.infer<typeof apiBaseUrlEnvSchema>;
export type ApiEnvVars = z.input<typeof apiEnvBindingsSchema>;
export type ApiEnvBindings = ApiEnvVars & ApiD1Bindings;
export type ParsedApiEnvBindings = z.infer<typeof apiEnvBindingsSchema>;

export function getApiEnv(env: ApiEnvVars): ParsedApiEnvBindings {
  return apiEnvBindingsSchema.parse(env);
}

export function getAppEnv(env: ApiEnvBindings): AppEnv {
  return getApiEnv(env).APP_ENV;
}

export function getApiBaseUrl(env: ApiEnvBindings): ApiBaseUrlEnv {
  return getApiEnv(env).API_BASE_URL;
}
