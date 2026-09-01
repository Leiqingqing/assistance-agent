import z from "zod";

export const AgentConversationParamsSchema = z.object({
  agentId: z.string().min(1),
});
export type AgentConversationParams = z.infer<typeof AgentConversationParamsSchema>;

export const AgentConversationMessagesQuerySchema = z.object({
    cursor: z.coerce
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER)
      .optional(),
  });
export type AgentConversationMessagesQuery = z.infer<typeof AgentConversationMessagesQuerySchema>;

export const AgentConversationMessageSchema = z.object({
    id: z.string().min(1),
    conversationId: z.string().min(1),
    agentId: z.string().min(1),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    status: z.enum(["completed", "failed"]),
    createdAtMs: z.number().int().nonnegative(),
});
export type AgentConversationMessage = z.infer<typeof AgentConversationMessageSchema>;

export const AgentConversationResponseSchema = z.object({
    conversationId: z.string().min(1),
    agentId: z.string().min(1),
    title: z.string().nullable(),
    summary: z.string().nullable(),
    messageCount: z.number().int().nonnegative(),
    openingMessage: z.string().nullable(),
    messages: z.array(AgentConversationMessageSchema),
    nextCursor: z.string().nullable(),
});
export type AgentConversationResponse = z.infer<typeof AgentConversationResponseSchema>;

