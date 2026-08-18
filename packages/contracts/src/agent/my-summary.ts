import z from "zod"

export const AgentMemorySchema = z.object({
    id: z.string().min(1),
    agentId: z.string().min(1),
    type: z.string().min(1).max(80),
    content: z.string().min(1).max(2000),
    importance: z.number().int().min(1).max(5),
    status: z.enum(['active', 'disabled', 'deleted']),
    sourceMessageId: z.string().nullable(),
    sourceMessage: z.object({
      id: z.string().min(1),
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      createdAtMs: z.number().int().nonnegative(),
    }).nullable(),
    createdAtMs: z.number().int().nonnegative(),
    updatedAtMs: z.number().int().nonnegative(),
  })
  
  export const UpdateAgentMemoryRequestSchema = z.object({
    type: z.string().trim().min(1).max(80).optional(),
    content: z.string().trim().min(1).max(2000).optional(),
    importance: z.number().int().min(1).max(5).optional(),
    status: z.enum(['active', 'disabled']).optional(),
  })