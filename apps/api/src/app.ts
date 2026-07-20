import { Hono } from "hono";
import { AppError, BizCode, buildFailure, createMeta } from "@repo/contracts/common";
import { HTTPException } from "hono/http-exception";
import { type ApiEnvBindings } from "/env";
import routes from "./routes";

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

const appRoutes = app.route("/", routes);

export type AppType = typeof appRoutes;

export default appRoutes;
