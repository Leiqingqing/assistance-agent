import { zValidator } from "@hono/zod-validator";
import {
  adminPasswordLoginRequestSchema,
  adminPasswordLoginResponseSchema,
  type AdminPasswordLoginResponse,
  type AuthError,
} from "@repo/contracts/auth";
import {
  AppError,
  BizCode,
  buildSuccess,
  createMeta,
} from "@repo/contracts/common";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import type { ApiEnvBindings } from "/env";
import { handelAdminPasswordLoginService } from "./service/adminPasswordLogin";

const authRouter = new Hono<{ Bindings: ApiEnvBindings }>()

authRouter.post(
  "/admin/password/login",
  zValidator("json", adminPasswordLoginRequestSchema, (result) => {
    if (!result.success) {
      throw new AppError<AuthError>(
        BizCode.COMMON_INVALID_REQUEST,
        "Invalid admin password login request",
        400,
        { reason: "INVALID_CREDENTIALS" },
      );
    }
  }),
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