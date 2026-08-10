import {
  CreateRoleRequestSchema,
  ListRolesQuerySchema,
  RoleParamsSchema,
  UpdateRoleRequestSchema,
} from "@repo/contracts/role";
import { buildSuccess, createMeta } from "@repo/contracts/common";
import { Hono } from "hono";
import type { ApiEnvBindings } from "/env";
import { validate } from "@/lib/validator";
import { requireRole } from "@/role/require-role";
import { handleCreateRole } from "@/role/service/createRole";
import { handleDeleteRole } from "@/role/service/deleteRole";
import { handleGetRole } from "@/role/service/getRole";
import { handleListRoles } from "@/role/service/listRoles";
import { handleUpdateRole } from "@/role/service/updateRole";

export const roleRoutes = new Hono<{ Bindings: ApiEnvBindings }>();

roleRoutes.post(
  "/",
  requireRole,
  validate("json", CreateRoleRequestSchema),
  async (c) => {
    const role = await handleCreateRole(c, c.req.valid("json"));
    return c.json(buildSuccess(createMeta(), role), 201);
  },
);

roleRoutes.get("/", validate("query", ListRolesQuerySchema), async (c) => {
  const result = await handleListRoles(c, c.req.valid("query"));
  return c.json(buildSuccess(createMeta(), result));
});

roleRoutes.get(
  "/:roleId",
  validate("param", RoleParamsSchema),
  async (c) => {
    const role = await handleGetRole(c, c.req.valid("param").roleId);
    return c.json(buildSuccess(createMeta(), role));
  },
);

roleRoutes.patch(
  "/:roleId",
  requireRole,
  validate("param", RoleParamsSchema),
  validate("json", UpdateRoleRequestSchema),
  async (c) => {
    const role = await handleUpdateRole(
      c,
      c.req.valid("param").roleId,
      c.req.valid("json"),
    );
    return c.json(buildSuccess(createMeta(), role));
  },
);

roleRoutes.delete(
  "/:roleId",
  requireRole,
  validate("param", RoleParamsSchema),
  async (c) => {
    const role = await handleDeleteRole(c, c.req.valid("param").roleId);
    return c.json(buildSuccess(createMeta(), role));
  },
);
