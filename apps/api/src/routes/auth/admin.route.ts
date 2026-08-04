import {
  AdminPasswordLoginRequestSchema,
  AdminTokenRefleshRequestSchema,
} from "@repo/contracts/auth";
import { buildSuccess, createMeta } from "@repo/contracts/common";
import { Hono } from "hono";
import { type ApiEnvBindings } from "/env";
import { validate } from "@/lib/validator";
import { handleAdminLogout } from "@/auth/service/adminLogout";
import { handelAdminPasswordLoginService } from "@/auth/service/adminPasswordLogin";
import { handleAdminTokenReflesh } from "@/auth/service/adminTokenRefresh";

export const adminAuthRoute = new Hono<{ Bindings: ApiEnvBindings }>();

adminAuthRoute.post(
  "/admin/password/login",
  validate("json", AdminPasswordLoginRequestSchema),
  async (c) => {
    const request = c.req.valid("json");
    const res = await handelAdminPasswordLoginService(c, request);

    return c.json(buildSuccess(createMeta(), res));
  },
);

adminAuthRoute.post(
  "/admin/token/refresh",
  validate("json", AdminTokenRefleshRequestSchema),
  async (c) => {
    const request = c.req.valid("json");
    const res = await handleAdminTokenReflesh(c, request.refreshToken);

    return c.json(buildSuccess(createMeta(), res));
  },
);

adminAuthRoute.post(
  "/admin/logout",
  validate("json", AdminTokenRefleshRequestSchema),
  async (c) => {
    const request = c.req.valid("json");
    const res = await handleAdminLogout(c, request.refreshToken);

    return c.json(buildSuccess(createMeta(), res));
  },
);

export default adminAuthRoute;