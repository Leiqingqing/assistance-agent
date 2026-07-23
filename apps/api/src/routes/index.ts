import { Hono } from "hono";
import { type ApiEnvBindings } from "/env";
import { authRoutes } from "./auth";
import { catalogRoutes } from "./catalog";
import { orderRoutes } from "./order";
import { systemRoutes } from "./system";
import { userRoutes } from "./user";

const routes = new Hono<{ Bindings: ApiEnvBindings }>()
  .route("/", systemRoutes)
  .route("/auth", authRoutes)
  .route("/catalog", catalogRoutes)
  .route("/user", userRoutes)
  .route("/order", orderRoutes);

export type RoutesType = typeof routes;

export default routes;
