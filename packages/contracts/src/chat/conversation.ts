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

export const ConversationSafetySchema = z.object({
    safetyLevel: z.enum([
        'safe', // safe：正常聊天
        'caution', // caution：轻度风险，继续回复但要克制
        'redirect', // redirect：需要温和转向
        'block', // block：不能满足用户请求
        'crisis'// crisis：危机支持，例如自伤、自杀、现实危险
    ]),
    category: z.enum([
      'normal',
      'emotional_dependency',
      'manipulation',
      'self_harm',
      'sexual_boundary',
      'privacy',
      'illegal',
      'medical_legal_financial',
      'other',
    ]),
    boundaryAction: z.enum(['continue', 'soft_boundary', 'redirect', 'refuse', 'crisis_support']),
    reason: z.string().trim().max(300),
    responseGuidance: z.string().trim().max(600),
    allowMemoryExtraction: z.boolean(),
})

export type ConversationSafety = z.infer<typeof ConversationSafetySchema>;