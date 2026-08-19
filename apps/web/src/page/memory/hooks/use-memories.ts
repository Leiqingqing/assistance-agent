"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateMemoryRequest,
  MemoryStatus,
  UpdateMemoryRequest,
} from "@repo/contracts/memory";
import {
  createMemory,
  deleteMemory,
  listMemories,
  updateMemory,
} from "@/api/memory";

export const memoryQueryKey = (agentId: string, status?: MemoryStatus) =>
  ["memories", agentId, status ?? "all"] as const;

export function useMemoriesQuery(
  agentId: string | null,
  status?: Exclude<MemoryStatus, "deleted">,
) {
  return useQuery({
    queryKey: memoryQueryKey(agentId ?? "", status),
    queryFn: () => listMemories({ agentId: agentId!, status }),
    enabled: agentId !== null,
  });
}

export function useCreateMemoryMutation(agentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateMemoryRequest) => createMemory(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["memories", agentId ?? ""],
      });
    },
  });
}

export function useUpdateMemoryMutation(agentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memoryId,
      request,
    }: {
      memoryId: string;
      request: UpdateMemoryRequest;
    }) => updateMemory({ memoryId, request }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["memories", agentId ?? ""],
      });
    },
  });
}

export function useDeleteMemoryMutation(agentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMemory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["memories", agentId ?? ""],
      });
    },
  });
}
