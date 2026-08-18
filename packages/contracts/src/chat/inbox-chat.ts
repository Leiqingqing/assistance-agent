import z from "zod"

export const AgentConversationParamsSchema = z.object({
  agentId: z.string().min(1),
})

export const AgentConversationMessagesQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})

const InboxChatPartSchema = z.object({
    type: z.string().min(1),
  }).passthrough()
  
export const InboxChatMessageSchema = z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant']),
    parts: z.array(InboxChatPartSchema).min(1).max(50),
  })
  
// mail 为当前对话的上下文
  export const InboxChatRequestSchema = z.object({
    conversationId: z.string().min(1).optional(),// 当前对话的id 也是agent的id
    messages: z.array(InboxChatMessageSchema).min(1).max(20),
    mail: z.object({
      subject: z.string().min(1).max(200),
      sender: z.string().min(1).max(120),
      senderEmail: z.string().email(),
      teaser: z.string().min(1).max(2000),
    }),
    conversation: z.object({
      id: z.string().min(1).optional(),
      name: z.string().min(1).max(120),
      handle: z.string().min(1).max(120),
      headline: z.string().min(1).max(200),
      lastActive: z.string().min(1).max(80),
      status: z.string().min(1).max(80),
      relationship: z.string().min(1).max(120),
      topic: z.string().min(1).max(120),
      chemistry: z.string().min(1).max(80),
      chemistryLabel: z.string().min(1).max(80),
      rhythm: z.string().min(1).max(80),
      profileNote: z.string().min(1).max(2000),
      imageKey: z.string().nullable().optional(),
    })
  })
  
  export const AgentConversationMessageSchema = z.object({
    id: z.string().min(1),
    conversationId: z.string().min(1),
    agentId: z.string().min(1),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    status: z.enum(['completed', 'failed']),
    createdAtMs: z.number().int().nonnegative(),
  })
  
  export const AgentConversationResponseSchema = z.object({
    conversationId: z.string().min(1),
    agentId: z.string().min(1),
    title: z.string().nullable(),
    summary: z.string().nullable(),
    messageCount: z.number().int().nonnegative(),
    openingMessage: z.string().nullable(),
    messages: z.array(AgentConversationMessageSchema),
    nextCursor: z.string().nullable(),
  })