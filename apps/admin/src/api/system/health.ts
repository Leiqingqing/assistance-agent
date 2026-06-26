import { getServerApiBaseUrl } from "../../../.env.server";

interface HealthResponseBody {
  ok?: boolean;
  service?: string;
  appEnv?: string;
}

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
    const body = (await response.json()) as HealthResponseBody;

    return {
      url,
      ok: response.ok && body.ok === true,
      service: body.service,
      appEnv: body.appEnv,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown health error",
    };
  }
}
