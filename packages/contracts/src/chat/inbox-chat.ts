import z from "zod";

export const AgentConversationParamsSchema = z.object({
  agentId: z.string().min(1),
});

export const AgentConversationMessagesQuerySchema = z.object({
  cursor: z.coerce
    .number()
    .int()
    .positive()
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
});

const InboxChatPartSchema = z
  .object({
    type: z.string().min(1),
  })
  .passthrough();

export const InboxChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(InboxChatPartSchema).min(1).max(50),
});

export const InboxChatRequestSchema = z.object({
  conversationId: z.string().min(1),
  messages: z.array(InboxChatMessageSchema).min(1).max(20),
});

export const AgentCompanionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  headline: z.string().nullable(),
  description: z.string().nullable(),
  openingMessage: z.string().nullable(),
  imageKey: z.string().nullable(),
  lastAssistantMessage: z.string().nullable(),
  lastAssistantMessageAtMs: z.number().int().nonnegative().nullable(),
});

export const AgentCompanionListResponseSchema = z.object({
  agents: z.array(AgentCompanionSchema),
});

export const AgentConversationMessageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  agentId: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  status: z.enum(["completed", "failed"]),
  createdAtMs: z.number().int().nonnegative(),
});

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
