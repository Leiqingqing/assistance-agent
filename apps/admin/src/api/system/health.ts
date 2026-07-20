import { healthResponseSchema, type HealthResponse } from "@repo/contracts";
import { getServerApiBaseUrl } from "@env.server";

export interface HealthCheck {
  url: string;
  ok: boolean;
  service?: string;
  appEnv?: string;
  error?: string;
}

export async function getHealthCheck(): Promise<HealthCheck> {
  const url = new URL("/health", getServerApiBaseUrl()).toString();

  try {
    const response = await fetch(url, { cache: "no-store" });
    const body = healthResponseSchema.parse(
      (await response.json()) as HealthResponse,
    );

    return {
      url,
      ok: response.ok && body.ok === true,
      service: body.ok ? body.data.service : undefined,
      appEnv: body.ok ? body.data.appEnv : undefined,
      error: body.ok ? undefined : body.error.message,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown health error",
    };
  }
}
