import { z } from "zod";

export const appEnvSchema = z.enum(["development", "test", "production"]);
export const apiBaseUrlEnvSchema = z.string().url();

export type AppEnv = z.infer<typeof appEnvSchema>;
export type ApiBaseUrlEnv = z.infer<typeof apiBaseUrlEnvSchema>;

export function getAppEnv(value: string | undefined): AppEnv {
  return appEnvSchema.parse(value);
}

export function getApiBaseUrlEnv(value: string | undefined): ApiBaseUrlEnv {
  return apiBaseUrlEnvSchema.parse(value);
}
