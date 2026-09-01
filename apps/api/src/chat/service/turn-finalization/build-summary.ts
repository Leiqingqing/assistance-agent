import type { BuildRollingSummaryInput } from "@/chat/types";

const SUMMARY_MAX_LENGTH = 1600;

export function buildRollingSummary(input: BuildRollingSummaryInput): string {
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
