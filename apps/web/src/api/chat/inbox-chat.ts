import { getApiBaseUrlEnv } from "@env";

export function getInboxChatUrl() {
  const baseUrl = getApiBaseUrlEnv(process.env.NEXT_PUBLIC_API_BASE_URL);
  return new URL("/chat/inbox", baseUrl).toString();
}
