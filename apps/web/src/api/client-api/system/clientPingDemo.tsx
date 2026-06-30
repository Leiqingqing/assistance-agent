"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { PingRequest, PingResponse } from "@repo/contracts";
import { postClientSystemPing } from "./clientPing.api";

export function useClientSystemPingMutation(
  options?: UseMutationOptions<PingResponse, Error, PingRequest>,
) {
  return useMutation({
    ...options,
    mutationFn: postClientSystemPing,
  });
}
