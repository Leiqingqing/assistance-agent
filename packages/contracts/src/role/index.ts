import { z } from "zod";

export const RoleStatusSchema = z.enum(["active", "disabled", "deleted"]);
export type RoleStatus = z.infer<typeof RoleStatusSchema>;
const RoleCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/);

export const RoleSchema = z.object({
  id: z.string().min(1),
  applicationId: z.string().min(1),
  code: RoleCodeSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  status: RoleStatusSchema,
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
  activeAtMs: z.number().int().nonnegative(),
  disableAtMs: z.number().int().nonnegative().nullable(),
  deletedAtMs: z.number().int().nonnegative().nullable(),
});
export type Role = z.infer<typeof RoleSchema>;

export const CreateRoleRequestSchema = RoleSchema.pick({
  applicationId: true,
  code: true,
  name: true,
  description: true,
});
export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;

export const ListRolesQuerySchema = z.object({
  applicationId: z.string().min(1),
  status: RoleStatusSchema.optional(),
});
export type ListRolesQuery = z.infer<typeof ListRolesQuerySchema>;

export const RoleParamsSchema = z.object({
  roleId: z.string().min(1),
});
export type RoleParams = z.infer<typeof RoleParamsSchema>;

export const UpdateRoleRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    status: z.enum(["active", "disabled"]).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.status !== undefined,
    { message: "At least one field must be provided" },
  );
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;

export const RoleListResponseSchema = z.object({
  roles: z.array(RoleSchema),
});
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>;

export interface RoleError {
  reason: RoleErrorReason;
}

export type RoleErrorReason =
  | "APPLICATION_NOT_FOUND"
  | "ROLE_CODE_CONFLICT"
  | "ROLE_NOT_FOUND"
  | "ROLE_PROTECTED";
