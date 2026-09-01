import type { AgentMemoryCandidate } from "@/chat/schema/memory";
import type { MemoryCandidate } from "@/chat/types";

export function extractMemoryCandidates(
  screening: AgentMemoryCandidate,
): MemoryCandidate[] {
  if (!screening.shouldExtract) {
    return [];
  }

  return screening.candidateFacts.map((content) => ({
    type: screening.category,
    content,
    importance: screening.importance,
  }));
}
