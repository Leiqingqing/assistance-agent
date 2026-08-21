import type { Db } from "@/db/client";
import { findMemoryByContent, persistAssistantTurn } from "@/chat/repository";
import type {
  BuildRollingSummaryInput,
  MemoryCandidate,
  SaveAssistantTurnInput,
} from "@/chat/types";

const SUMMARY_MAX_LENGTH = 1600;
const MEMORY_KEYWORD_PATTERN = /喜欢|不喜欢|希望|记住|不要|习惯/;

function buildRollingSummary(input: BuildRollingSummaryInput): string {
  return [
    input.previousSummary,
    ...input.recentMessages.map(
      (message) =>
        `${message.role === "user" ? "用户" : "助手"}：${message.content}`,
    ),
    `用户：${input.userContent}`,
    `助手：${input.assistantContent}`,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .slice(-SUMMARY_MAX_LENGTH);
}

function extractMemoryCandidate(userContent: string): MemoryCandidate | null {
  const content = userContent.trim();
  if (!content || !MEMORY_KEYWORD_PATTERN.test(content)) {
    return null;
  }

  if (/不喜欢|不要/.test(content)) {
    return { type: "boundary", content, importance: 4 };
  }

  if (/喜欢|习惯/.test(content)) {
    return { type: "preference", content, importance: 3 };
  }

  return {
    type: "instruction",
    content,
    importance: /记住/.test(content) ? 4 : 3,
  };
}

export async function saveAssistantTurn(
  db: Db,
  input: SaveAssistantTurnInput,
): Promise<void> {
  const summary = buildRollingSummary({
    previousSummary: input.previousSummary,
    recentMessages: input.recentMessages,
    userContent: input.userContent,
    assistantContent: input.assistantContent,
  });
  const memoryCandidate =
    input.allowMemoryExtraction === false
      ? null
      : extractMemoryCandidate(input.userContent);
  const duplicateMemory =
    memoryCandidate === null
      ? null
      : await findMemoryByContent(db, {
          userId: input.userId,
          agentId: input.agentId,
          content: memoryCandidate.content,
        });
  const memory =
    memoryCandidate === null || duplicateMemory !== null
      ? null
      : {
          id: crypto.randomUUID(),
          ...memoryCandidate,
          sourceMessageId: input.userMessageId,
        };

  await persistAssistantTurn(db, {
    id: input.id,
    conversationId: input.conversationId,
    userId: input.userId,
    agentId: input.agentId,
    assistantContent: input.assistantContent,
    summary,
    memory,
    nowMs: input.nowMs,
  });
}
