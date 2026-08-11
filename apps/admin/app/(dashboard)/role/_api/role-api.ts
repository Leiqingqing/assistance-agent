import type {
  CreateRoleRequest,
  Role,
  RoleListResponse,
} from "@repo/contracts/role";
import { http } from "@/auth/http";

export const ADMIN_APPLICATION_ID = "app_admin";

export function getRoles() {
  return http.get<RoleListResponse>("/rpc/role", {
    query: {
      applicationId: ADMIN_APPLICATION_ID,
    },
  });
}

export function createRole(
  input: Omit<CreateRoleRequest, "applicationId">,
) {
  return http.post<CreateRoleRequest, Role>("/rpc/role", {
    ...input,
    applicationId: ADMIN_APPLICATION_ID,
  });
}
