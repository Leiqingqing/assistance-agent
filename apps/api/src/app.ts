import { Hono } from "hono";
import {
  BizCode,
  buildFailure,
  buildSuccess,
  pingRequestSchema,
  pingResponseSchema,
  type PingError,
  type PingResult,
  type PingResponse,
} from "@repo/contracts";
import { HTTPException } from "hono/http-exception";
import { getApiBaseUrl, getAppEnv, type ApiEnvBindings } from "../.env";


type AppErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500 | 504;

export class AppError<E> extends Error {
  constructor(
    readonly code: BizCode,
    message: string,
    readonly status: AppErrorStatus,
    readonly details?: E,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const createMeta = () => ({
  requestId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
});

const app = new Hono<{ Bindings: ApiEnvBindings }>();

app.notFound((c) => {
  const errorMsg = {
    code: BizCode.COMMON_NOT_FOUND,
    message: "Not found",
    details: {
      reason: `${c.req.method} ${c.req.path} is not found`,
    },
  };
  const res = buildFailure(errorMsg, createMeta());
  return c.json(res, 404);
});

app.onError((error, c) => {
  const meta = createMeta();

  if (error instanceof AppError) {
    const errorMsg = {
      code: error.code,
      message: error.message,
      details: error.details,
    };
    const res = buildFailure(errorMsg, meta);
    return c.json(res, error.status);
  }

  if (error instanceof HTTPException) {
    const errorMsg = {
      code: BizCode.COMMON_INVALID_REQUEST,
      message: error.message,
      details: {
        reason: error.message,
      },
    };
    const res = buildFailure(errorMsg, meta);
    return c.json(res, error.status);
  }

  console.error(error);

  const errorMsg = {
    code: BizCode.SYSTEM_INTERNAL_ERROR,
    message: "Internal server error",
    details: {
      reason: error instanceof Error ? error.message : "Unknown server error",
    },
  };
  const res = buildFailure(errorMsg, meta);
  return c.json(res, 500);
});

const routes = app
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
  .post("/ping", async (c) => {
    const body = await c.req.json().catch(() => undefined);
    const request = pingRequestSchema.safeParse(body);

    if (!request.success) {
      throw new AppError<PingError>(
        BizCode.COMMON_INVALID_REQUEST,
        "Invalid ping request",
        400,
        {
          reason: request.error.issues[0]?.message ?? "Request body is invalid",
        },
      );
    }

    const result: PingResult = {
      pong: true,
      echo: request.data,
      serverTime: new Date().toISOString(),
    };

    const response = buildSuccess(createMeta(), result) satisfies PingResponse;

    return c.json(pingResponseSchema.parse(response));
  });

export type AppType = typeof routes;

export default routes;
