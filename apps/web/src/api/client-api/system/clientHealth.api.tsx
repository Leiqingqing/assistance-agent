import {
  ApiSuccess,
  type HealthResponse,
  type HealthResult,
} from "@repo/contracts";
import { http } from "@/auth/http";

export const systemHealthQueryKey = ["system-health"] as const;

export async function getClientSystemHealth(): Promise<HealthResponse> {
  return http.get<ApiSuccess<HealthResult>>("/health");
}
