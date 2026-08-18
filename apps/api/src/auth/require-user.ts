import { createMiddleware } from "hono/factory";
import { getApiEnv, type ApiEnvBindings } from "/env";
import { accessTokenInvalidError } from "@/auth/errors";
import { verifyAccessToken } from "@/auth/jwt";

export type AuthVariables = {
  userId: string;
};

export const requireUser = createMiddleware<{
  Bindings: ApiEnvBindings;
  Variables: AuthVariables;
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

  context.set("userId", claims.sub);
  await next();
});
