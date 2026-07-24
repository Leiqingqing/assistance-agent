import {
  adminPasswordLoginRequestSchema,
  adminPasswordLoginResponseSchema,
  type AdminPasswordLoginResponse,
} from "@repo/contracts/auth";
import {
  buildSuccess,
  createMeta,
} from "@repo/contracts/common";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import type { ApiEnvBindings } from "/env";
import { handelAdminPasswordLoginService } from "./service/adminPasswordLogin";
import { validate } from "@/lib/validator";

const authRouter = new Hono<{ Bindings: ApiEnvBindings }>()

authRouter.post(
  "/admin/password/login",
  validate("json", adminPasswordLoginRequestSchema),
  async (c) => {
    const request = c.req.valid("json");
    const result = await handelAdminPasswordLoginService(c, request);

    setCookie(c, 'refresh_token', result.refreshToken, {
      httpOnly: true,
      maxAge: result.refreshTokenTtlSec,
      path: "/auth",
      sameSite: "Lax",
    });

    const response = buildSuccess(
      createMeta(),
      {
        tokenType: result.tokenType,
        accessToken: result.accessToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      },
    ) satisfies AdminPasswordLoginResponse;

    return c.json(adminPasswordLoginResponseSchema.parse(response));
  },
);

export default authRouter;