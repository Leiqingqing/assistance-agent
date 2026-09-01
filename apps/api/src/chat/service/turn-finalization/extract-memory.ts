import type { MemoryCandidate } from "@/chat/types";

const MEMORY_KEYWORD_PATTERN = /喜欢|不喜欢|希望|记住|不要|习惯/;

export function extractMemoryCandidate(
  userContent: string,
): MemoryCandidate | null {
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
