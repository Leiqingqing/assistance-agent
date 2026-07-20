import { Hono } from "hono";
import { type ApiEnvBindings } from "/env";

export const userRoutes = new Hono<{ Bindings: ApiEnvBindings }>();
