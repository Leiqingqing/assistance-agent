import z from "zod";

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



export type InboxChatRequest = z.infer<typeof InboxChatRequestSchema>;


