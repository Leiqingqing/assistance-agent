import { z } from "zod";

export const AGENT_GROUP_CHAT_MAX_AGENTS = 6;

export const AgentGroupChatMemberSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  name: z.string().min(1).max(120),
  headline: z.string().max(200).nullable(),
  imageKey: z.string().max(300).nullable(),
  status: z.enum(["active", "removed"]),
  displayOrder: z.number().int().nonnegative(),
  joinedAtMs: z.number().int().nonnegative(),
});
export type AgentGroupChatMember = z.infer<typeof AgentGroupChatMemberSchema>;

export const AgentGroupChatMessageSchema = z.object({
  id: z.string().min(1),
  groupChatId: z.string().min(1),
  senderType: z.enum(["user", "agent", "system"]),
  agentId: z.string().min(1).nullable(),
  agentName: z.string().max(120).nullable(),
  agentImageKey: z.string().max(300).nullable(),
  content: z.string(),
  status: z.enum(["completed", "failed"]),
  turnIndex: z.number().int().nonnegative(),
  createdAtMs: z.number().int().nonnegative(),
});
export type AgentGroupChatMessage = z.infer<typeof AgentGroupChatMessageSchema>;

export const AgentGroupChatSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  summary: z.string().max(2000).nullable(),
  messageCount: z.number().int().nonnegative(),
  lastMessageAtMs: z.number().int().nonnegative().nullable(),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
  members: z.array(AgentGroupChatMemberSchema),
  latestMessage: AgentGroupChatMessageSchema.nullable(),
});
export type AgentGroupChat = z.infer<typeof AgentGroupChatSchema>;

export const AgentGroupChatDetailResponseSchema = z.object({
  groupChat: AgentGroupChatSchema,
  messages: z.array(AgentGroupChatMessageSchema),
  nextCursor: z.string().nullable(),
});
export type AgentGroupChatDetailResponse = z.infer<
  typeof AgentGroupChatDetailResponseSchema
>;

export const CreateAgentGroupChatRequestSchema = z.object({
  title: z.string().trim().min(1).max(120),
  agentIds: z.array(z.string().min(1)).min(1).max(AGENT_GROUP_CHAT_MAX_AGENTS),
});
export type CreateAgentGroupChatRequest = z.infer<
  typeof CreateAgentGroupChatRequestSchema
>;

export const CreateAgentGroupChatResponseSchema = z.object({
  groupChat: AgentGroupChatSchema,
});

export const AddAgentGroupChatRequestSchema = z.object({
  agentId: z.string().min(1),
});
export type AddAgentGroupChatRequest = z.infer<
  typeof AddAgentGroupChatRequestSchema
>;

export const AddAgentGroupChatResponseSchema = z.object({
  groupChat: AgentGroupChatSchema,
});

export const AgentGroupChatParamsSchema = z.object({
  groupChatId: z.string().min(1),
});

export const AgentGroupChatMemberParamsSchema =
  AgentGroupChatParamsSchema.extend({
    agentId: z.string().min(1),
  });

export const RemoveAgentGroupChatResponseSchema = z.object({
  groupChatId: z.string().min(1),
  agentId: z.string().min(1),
  dissolved: z.boolean(),
});
export type RemoveAgentGroupChatResponse = z.infer<
  typeof RemoveAgentGroupChatResponseSchema
>;

export const SendAgentGroupChatMessageRequestSchema = z.object({
  groupChatId: z.string().min(1),
  message: z.string().trim().min(1).max(4000),
});
export type SendAgentGroupChatMessageRequest = z.infer<
  typeof SendAgentGroupChatMessageRequestSchema
>;

export const SendAgentGroupChatMessageResponseSchema = z.object({
  userMessage: AgentGroupChatMessageSchema,
  agentMessages: z.array(AgentGroupChatMessageSchema),
  groupChat: AgentGroupChatSchema,
});
export type SendAgentGroupChatMessageResponse = z.infer<
  typeof SendAgentGroupChatMessageResponseSchema
>;
