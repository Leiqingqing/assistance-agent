import {
  type HealthError,
  type HealthResponse,
  type HealthResult,
} from "@repo/contracts";
import { http } from "../../http";

export const systemHealthQueryKey = ["system-health"] as const;

export async function getClientSystemHealth(): Promise<HealthResponse> {
  return http.get<HealthResult, HealthError>("/health");
}
