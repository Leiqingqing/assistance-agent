import { z } from "zod";

export const MemoryStatusSchema = z.enum(["active", "disabled", "deleted"]);
export type MemoryStatus = z.infer<typeof MemoryStatusSchema>;

export const MemorySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  agentId: z.string().min(1),
  type: z.string().min(1),
  content: z.string().min(1),
  importance: z.number().int().min(1).max(5),
  status: MemoryStatusSchema,
  sourceMessageId: z.string().min(1).nullable(),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
});
export type Memory = z.infer<typeof MemorySchema>;

export const CreateMemoryRequestSchema = z.object({
  agentId: z.string().min(1),
  type: z.string().trim().min(1).max(64),
  content: z.string().trim().min(1).max(4000),
  importance: z.number().int().min(1).max(5).default(3),
});
export type CreateMemoryRequest = z.infer<typeof CreateMemoryRequestSchema>;

export const ListMemoriesQuerySchema = z.object({
  agentId: z.string().min(1),
  status: z.enum(["active", "disabled"]).optional(),
});
export type ListMemoriesQuery = z.infer<typeof ListMemoriesQuerySchema>;

export const MemoryParamsSchema = z.object({
  memoryId: z.string().min(1),
});

export const UpdateMemoryRequestSchema = z
  .object({
    type: z.string().trim().min(1).max(64).optional(),
    content: z.string().trim().min(1).max(4000).optional(),
    importance: z.number().int().min(1).max(5).optional(),
    status: z.enum(["active", "disabled"]).optional(),
  })
  .refine(
    (value) =>
      value.type !== undefined ||
      value.content !== undefined ||
      value.importance !== undefined ||
      value.status !== undefined,
    { message: "At least one field must be provided" },
  );
export type UpdateMemoryRequest = z.infer<typeof UpdateMemoryRequestSchema>;

export const MemoryListResponseSchema = z.object({
  memories: z.array(MemorySchema),
});

export interface MemoryError {
  reason: "AGENT_NOT_FOUND" | "MEMORY_NOT_FOUND";
}
