import {
  AdminPasswordLoginRequestSchema,
} from "@repo/contracts/auth";
import { buildSuccess, createMeta } from "@repo/contracts/common";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { type ApiEnvBindings } from "/env";
import {
  clearAdminRefreshTokenCookie,
  setRefreshTokenCookie,
} from "@/auth/cookie";
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

    const response = c.json(buildSuccess(createMeta(), res));

    setRefreshTokenCookie(response.headers, {
      value: res.refreshToken,
      maxAge: res.refreshExpiresInSec,
      path: "/auth/admin",
    });

    return response;
  },
);

adminAuthRoute.post("/admin/token/refresh", async (c) => {
  const refreshToken = getCookie(c, "refresh_token") ?? "";
  const res = await handleAdminTokenReflesh(c, refreshToken);

  const response = c.json(buildSuccess(createMeta(), res));

  setRefreshTokenCookie(response.headers, {
    value: res.refreshToken,
    maxAge: res.refreshExpiresInSec,
    path: "/auth/admin",
  });

  return response;
});

adminAuthRoute.post("/admin/logout", async (c) => {
  const refreshToken = getCookie(c, "refresh_token") ?? "";
  const res = await handleAdminLogout(c, refreshToken);

  const response = c.json(buildSuccess(createMeta(), res));
  clearAdminRefreshTokenCookie(response.headers);

  return response;
});

export default adminAuthRoute;