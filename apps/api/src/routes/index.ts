import { Hono } from "hono";
import { type ApiEnvBindings } from "/env";
import { catalogRoutes } from "./catalog";
import { chatRoutes } from "./chat";
import { orderRoutes } from "./order";
import { systemRoutes } from "./system";
import { userRoutes } from "./user";
import adminAuthRoute from "./auth/admin.route";
import { roleRoutes } from "./role/manage-role.route";

const routes = new Hono<{ Bindings: ApiEnvBindings }>()
  .route("/", systemRoutes)
  .route("/auth", adminAuthRoute)
  .route("/catalog", catalogRoutes)
  .route("/chat", chatRoutes)
  .route("/rpc/role", roleRoutes)
  .route("/user", userRoutes)
  .route("/order", orderRoutes);

export type RoutesType = typeof routes;

export default routes;
