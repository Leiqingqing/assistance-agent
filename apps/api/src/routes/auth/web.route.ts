import {
  WebPasswordLoginRequestSchema,
  WebTokenRefreshRequestSchema,
} from "@repo/contracts/auth";
import { buildSuccess, createMeta } from "@repo/contracts/common";
import { Hono } from "hono";
import { type ApiEnvBindings } from "/env";
import { handleWebLogout } from "@/auth/service/webLogout";
import { handleWebPasswordLogin } from "@/auth/service/webPasswordLogin";
import { handleWebTokenRefresh } from "@/auth/service/webTokenRefresh";
import { validate } from "@/lib/validator";

export const webAuthRoute = new Hono<{ Bindings: ApiEnvBindings }>();

webAuthRoute.post(
  "/web/password/login",
  validate("json", WebPasswordLoginRequestSchema),
  async (c) => {
    const request = c.req.valid("json");
    const result = await handleWebPasswordLogin(c, request);

    return c.json(buildSuccess(createMeta(), result));
  },
);

webAuthRoute.post(
  "/web/token/refresh",
  validate("json", WebTokenRefreshRequestSchema),
  async (c) => {
    const request = c.req.valid("json");
    const result = await handleWebTokenRefresh(c, request.refreshToken);

    return c.json(buildSuccess(createMeta(), result));
  },
);

webAuthRoute.post(
  "/web/logout",
  validate("json", WebTokenRefreshRequestSchema),
  async (c) => {
    const request = c.req.valid("json");
    const result = await handleWebLogout(c, request.refreshToken);

    return c.json(buildSuccess(createMeta(), result));
  },
);

export default webAuthRoute;
