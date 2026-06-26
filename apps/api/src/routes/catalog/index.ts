import { Hono } from "hono";
import { type ApiEnvBindings } from "../../../.env";

export const catalogRoutes = new Hono<{ Bindings: ApiEnvBindings }>();
