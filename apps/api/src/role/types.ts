import type { RoleStatus } from "@repo/contracts/role";

export interface CreateRoleRecordInput {
  id: string;
  applicationId: string;
  code: string;
  name: string;
  description: string | null;
  nowMs: number;
}

export interface UpdateRoleRecordInput {
  name?: string;
  description?: string | null;
  status?: Exclude<RoleStatus, "deleted">;
  updatedAtMs: number;
  activeAtMs?: number;
  disableAtMs?: number | null;
}
