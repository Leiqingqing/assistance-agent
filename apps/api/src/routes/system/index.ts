import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  AppError,
  BizCode,
  buildSuccess,
  createMeta,
} from "@repo/contracts/common";
import {
  pingRequestSchema,
  pingResponseSchema,
  type PingError,
  type PingResult,
  type PingResponse,
} from "@repo/contracts/system";
import { getApiBaseUrl, getAppEnv, type ApiEnvBindings } from "../../../.env";

export const systemRoutes = new Hono<{ Bindings: ApiEnvBindings }>()
  .get("/", (c) => {
    const appEnv = getAppEnv(c.env);

    return c.json({
      service: "api",
      framework: "hono",
      appEnv,
    });
  })
  .get("/health", (c) => {
    const appEnv = getAppEnv(c.env);
    getApiBaseUrl(c.env);

    return c.json({
      ok: true,
      service: "api",
      appEnv,
    });
  })
  .post(
    "/ping",
    zValidator("json", pingRequestSchema, (result) => {
      if (!result.success) {
        throw new AppError<PingError>(
          BizCode.COMMON_INVALID_REQUEST,
          "Invalid ping request",
          400,
          {
            reason:
              result.error.issues[0]?.message ?? "Request body is invalid",
          },
        );
      }
    }),
    (c) => {
      const request = c.req.valid("json");

      const result: PingResult = {
        pong: true,
        echo: request,
        serverTime: new Date().toISOString(),
      };

      const response = buildSuccess(createMeta(), result) satisfies PingResponse;

      return c.json(pingResponseSchema.parse(response));
    },
  );
