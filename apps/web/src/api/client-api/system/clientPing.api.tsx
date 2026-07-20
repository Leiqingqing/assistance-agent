import {
  type PingError,
  type PingRequest,
  type PingResponse,
  type PingResult,
} from "@repo/contracts";
import { http } from "@/api/http";

export function createClientPingRequest(): PingRequest {
  return {
    nonce: crypto.randomUUID(),
    sentAt: new Date().toISOString(),
    source: "web-home",
  };
}

export async function postClientSystemPing(
  request: PingRequest,
): Promise<PingResponse> {
  return http.post<PingRequest, PingResult, PingError>("/ping", request);
}
