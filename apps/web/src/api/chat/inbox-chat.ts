import {
  AgentCompanionListResponseSchema,
  AgentConversationResponseSchema,
} from "@repo/contracts/chat";
import type { z } from "zod";
import { getApiBaseUrlEnv } from "@env";
import { http } from "@/auth/http";

export type AgentCompanion = z.infer<
  typeof AgentCompanionListResponseSchema
>["agents"][number];
export type AgentConversation = z.infer<typeof AgentConversationResponseSchema>;

export function getInboxChatUrl() {
  const baseUrl = getApiBaseUrlEnv(process.env.NEXT_PUBLIC_API_BASE_URL);
  return new URL("/chat/inbox", baseUrl).toString();
}

export async function listAgentCompanions(): Promise<AgentCompanion[]> {
  const result = await http.get<unknown>("/rpc/chat/inbox");
  return AgentCompanionListResponseSchema.parse(result).agents;
}

export async function getAgentConversation(
  agentId: string,
): Promise<AgentConversation> {
  const result = await http.get<unknown>(
    `/rpc/chat/inbox/${encodeURIComponent(agentId)}/conversation`,
  );
  return AgentConversationResponseSchema.parse(result);
}

export async function getEarlierAgentMessages(
  agentId: string,
  cursor: string,
): Promise<AgentConversation> {
  const result = await http.get<unknown>(
    `/rpc/chat/inbox/${encodeURIComponent(agentId)}/messages`,
    { query: { cursor } },
  );
  return AgentConversationResponseSchema.parse(result);
}
