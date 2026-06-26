import { Hono } from "hono";
import { type ApiEnvBindings } from "../../../.env";

export const orderRoutes = new Hono<{ Bindings: ApiEnvBindings }>();
