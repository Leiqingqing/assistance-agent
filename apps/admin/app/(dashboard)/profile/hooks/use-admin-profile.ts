"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminProfile } from "../_api/get-admin-profile";

export function useAdminProfile() {
  const query = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: getAdminProfile,
  });

  return {
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "获取管理员资料失败"
          : null,
    isLoading: query.isPending,
    profile: query.data,
    retry: query.refetch,
  };
}
