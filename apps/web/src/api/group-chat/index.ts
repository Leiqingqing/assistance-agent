import {
  AddAgentGroupChatRequestSchema,
  AddAgentGroupChatResponseSchema,
  AgentGroupChatDetailResponseSchema,
  AgentGroupChatSchema,
  CreateAgentGroupChatRequestSchema,
  CreateAgentGroupChatResponseSchema,
  RemoveAgentGroupChatResponseSchema,
  SendAgentGroupChatMessageRequestSchema,
  SendAgentGroupChatMessageResponseSchema,
  type AddAgentGroupChatRequest,
  type AgentGroupChat,
  type AgentGroupChatDetailResponse,
  type CreateAgentGroupChatRequest,
  type RemoveAgentGroupChatResponse,
  type SendAgentGroupChatMessageRequest,
  type SendAgentGroupChatMessageResponse,
} from "@repo/contracts/group-chat";
import { z } from "zod";
import { http } from "@/auth/http";

const AgentGroupChatListSchema = z.array(AgentGroupChatSchema);

export async function listGroupChats(): Promise<AgentGroupChat[]> {
  const result = await http.get<unknown>("/rpc/group-chat");
  return AgentGroupChatListSchema.parse(result);
}

export async function createGroupChat(
  request: CreateAgentGroupChatRequest,
): Promise<AgentGroupChat> {
  const payload = CreateAgentGroupChatRequestSchema.parse(request);
  const result = await http.post<CreateAgentGroupChatRequest, unknown>(
    "/rpc/group-chat",
    payload,
  );
  return CreateAgentGroupChatResponseSchema.parse(result).groupChat;
}

export async function getGroupChat(
  groupChatId: string,
): Promise<AgentGroupChatDetailResponse> {
  const result = await http.get<unknown>(
    `/rpc/group-chat/${encodeURIComponent(groupChatId)}`,
  );
  return AgentGroupChatDetailResponseSchema.parse(result);
}

export async function getEarlierGroupChatMessages(
  groupChatId: string,
  cursor: string,
): Promise<AgentGroupChatDetailResponse> {
  const result = await http.get<unknown>(
    `/rpc/group-chat/${encodeURIComponent(groupChatId)}/messages`,
    { query: { cursor } },
  );
  return AgentGroupChatDetailResponseSchema.parse(result);
}

export async function addGroupChatAgent(
  groupChatId: string,
  request: AddAgentGroupChatRequest,
): Promise<AgentGroupChat> {
  const payload = AddAgentGroupChatRequestSchema.parse(request);
  const result = await http.post<AddAgentGroupChatRequest, unknown>(
    `/rpc/group-chat/${encodeURIComponent(groupChatId)}/agents`,
    payload,
  );
  return AddAgentGroupChatResponseSchema.parse(result).groupChat;
}

export async function removeGroupChatAgent(
  groupChatId: string,
  agentId: string,
): Promise<RemoveAgentGroupChatResponse> {
  const result = await http.delete<unknown>(
    `/rpc/group-chat/${encodeURIComponent(groupChatId)}/agents/${encodeURIComponent(agentId)}`,
  );
  return RemoveAgentGroupChatResponseSchema.parse(result);
}

export async function sendGroupChatMessage(
  request: SendAgentGroupChatMessageRequest,
  signal?: AbortSignal,
): Promise<SendAgentGroupChatMessageResponse> {
  const payload = SendAgentGroupChatMessageRequestSchema.parse(request);
  const result = await http.post<SendAgentGroupChatMessageRequest, unknown>(
    "/rpc/group-chat/messages",
    payload,
    { init: { signal } },
  );
  return SendAgentGroupChatMessageResponseSchema.parse(result);
}
