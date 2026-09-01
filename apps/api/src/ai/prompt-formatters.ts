import type { ChatHistoryMessage, ChatMemory } from "@/chat/types";

export function formatActiveMemories(memories: ChatMemory[]): string {
  if (memories.length === 0) {
    return "无可用长期记忆。";
  }

  return memories
    .map(
      (memory) =>
        `- [${memory.type} / 重要度 ${memory.importance}] ${memory.content}`,
    )
    .join("\n");
}

export function formatRecentMessages(messages: ChatHistoryMessage[]): string {
  if (messages.length === 0) {
    return "无历史对话。";
  }

  return messages
    .map(
      (message) =>
        `${message.role === "user" ? "用户" : "Agent"}：${message.content}`,
    )
    .join("\n");
}
