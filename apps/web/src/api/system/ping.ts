import { hc } from "hono/client";
import {
  pingRequestSchema,
  pingResponseSchema,
  type PingRequest,
  type PingResponse,
} from "@repo/contracts";
import type { AppType } from "api/app";
import { getServerApiBaseUrl } from "../../../.env.server";

export interface PingCheck {
  request: PingRequest;
  response: PingResponse;
}

export async function getPingCheck(): Promise<PingCheck> {
  const client = hc<AppType>(getServerApiBaseUrl());
  const request = pingRequestSchema.parse({
    nonce: crypto.randomUUID(),
    sentAt: new Date().toISOString(),
    source: "web-home",
  });

  try {
    const response = await client.ping.$post({ json: request });
    const body = await response.json();

    return {
      request,
      response: pingResponseSchema.parse(body),
    };
  } catch (error) {
    return {
      request,
      response: {
        ok: false,
        meta: {
          requestId: "local",
          timestamp: new Date().toISOString(),
        },
        error: {
          code: "SYSTEM.UPSTREAM_TIMEOUT",
          message: "Ping request failed",
          details: {
            reason:
              error instanceof Error ? error.message : "Unknown ping error",
          },
        },
      },
    };
  }
}
