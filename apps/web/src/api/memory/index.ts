import {
  MemoryListResponseSchema,
  MemorySchema,
  type CreateMemoryRequest,
  type ListMemoriesQuery,
  type Memory,
  type UpdateMemoryRequest,
} from "@repo/contracts/memory";
import { http } from "@/auth/http";

const MEMORY_PATH = "/rpc/memory";

export async function listMemories(
  query: ListMemoriesQuery,
): Promise<Memory[]> {
  const result = await http.get<unknown>(MEMORY_PATH, { query });
  return MemoryListResponseSchema.parse(result).memories;
}

export async function getMemory(memoryId: string): Promise<Memory> {
  const result = await http.get<unknown>(
    `${MEMORY_PATH}/${encodeURIComponent(memoryId)}`,
  );
  return MemorySchema.parse(result);
}

export async function createMemory(
  request: CreateMemoryRequest,
): Promise<Memory> {
  const result = await http.post<CreateMemoryRequest, unknown>(
    MEMORY_PATH,
    request,
  );
  return MemorySchema.parse(result);
}

export async function updateMemory({
  memoryId,
  request,
}: {
  memoryId: string;
  request: UpdateMemoryRequest;
}): Promise<Memory> {
  const result = await http.patch<UpdateMemoryRequest, unknown>(
    `${MEMORY_PATH}/${encodeURIComponent(memoryId)}`,
    request,
  );
  return MemorySchema.parse(result);
}

export async function deleteMemory(memoryId: string): Promise<Memory> {
  const result = await http.delete<unknown>(
    `${MEMORY_PATH}/${encodeURIComponent(memoryId)}`,
  );
  return MemorySchema.parse(result);
}
