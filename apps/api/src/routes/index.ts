import { Hono } from "hono";
import { type ApiEnvBindings } from "/env";
import { catalogRoutes } from "./catalog";
import { chatRoutes, rpcChatRoutes } from "./chat";
import { memoryRoutes } from "./memory";
import { orderRoutes } from "./order";
import { systemRoutes } from "./system";
import { userRoutes } from "./user";
import adminAuthRoute from "./auth/admin.route";
import webAuthRoute from "./auth/web.route";
import { roleRoutes } from "./role/manage-role.route";

const routes = new Hono<{ Bindings: ApiEnvBindings }>()
  .route("/", systemRoutes)
  .route("/auth", adminAuthRoute)
  .route("/auth", webAuthRoute)
  .route("/catalog", catalogRoutes)
  .route("/chat", chatRoutes)
  .route("/rpc/chat", rpcChatRoutes)
  .route("/rpc/memory", memoryRoutes)
  .route("/rpc/role", roleRoutes)
  .route("/user", userRoutes)
  .route("/order", orderRoutes);

export type RoutesType = typeof routes;

export default routes;
