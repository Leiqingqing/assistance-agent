"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getClientSystemHealth,
  systemHealthQueryKey,
} from "./clientHealth.api";

export function useClientSystemHealthQuery() {
  return useQuery({
    queryKey: systemHealthQueryKey,
    queryFn: getClientSystemHealth,
  });
}
