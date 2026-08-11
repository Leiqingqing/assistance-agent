"use client";

import type { CreateRoleRequest } from "@repo/contracts/role";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRole, getRoles } from "../_api/role-api";

const rolesQueryKey = ["admin", "roles"];

export function useRoles() {
  const query = useQuery({
    queryKey: rolesQueryKey,
    queryFn: getRoles,
  });

  return {
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "获取角色列表失败"
          : null,
    isLoading: query.isPending,
    roles: query.data?.roles ?? [],
    retry: query.refetch,
  };
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (
      input: Omit<CreateRoleRequest, "applicationId">,
    ) => createRole(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
  });

  return {
    create: mutation.mutateAsync,
    error:
      mutation.error instanceof Error
        ? mutation.error.message
        : mutation.error
          ? "新增角色失败"
          : null,
    isCreating: mutation.isPending,
    reset: mutation.reset,
  };
}
