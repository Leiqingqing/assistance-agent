import { createMiddleware } from "hono/factory";
import { getApiEnv, type ApiEnvBindings } from "/env";
import {
  accessTokenInvalidError,
  adminOwnerRequiredError,
} from "@/auth/errors";
import { verifyAccessToken } from "@/auth/jwt";

const ADMIN_OWNER_ROLE = "admin_owner";

export const requireRole = createMiddleware<{
  Bindings: ApiEnvBindings;
}>(async (context, next) => {
  const authorization = context.req.header("Authorization");
  const [scheme, token, extra] = authorization?.trim().split(/\s+/) ?? [];

  if (scheme?.toLowerCase() !== "bearer" || !token || extra !== undefined) {
    throw accessTokenInvalidError();
  }

  const env = getApiEnv(context.env);
  const claims = await verifyAccessToken({
    token,
    secret: env.ACCESS_TOKEN_SECRET,
  }).catch(() => {
    throw accessTokenInvalidError();
  });

  if (!claims.roles.includes(ADMIN_OWNER_ROLE)) {
    throw adminOwnerRequiredError();
  }

  await next();
});
