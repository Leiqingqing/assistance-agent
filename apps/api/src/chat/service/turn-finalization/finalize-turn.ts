import type { ReplyPolicy } from "@/chat/schema/reply";

import type { ParsedApiEnvBindings } from "/env";
import {
  evaluateReplyQuality,
  serializeReplyQualityMetadata,
} from "@/chat/service/turn-finalization/evaluate-reply-quality";
import { findMemoryByContent, persistAssistantTurn } from "@/chat/repository";
import { buildRollingSummary } from "@/chat/service/turn-finalization/build-summary";
import { detectMemoryCandidate } from "@/chat/service/turn-finalization/detect-memory-candidate";
import { extractMemoryCandidates } from "@/chat/service/turn-finalization/extract-memory";
import type { ChatMemory, SaveAssistantTurnInput } from "@/chat/types";
import type { Db } from "@/db/client";

export type FinalizeTurnInput = Omit<
  SaveAssistantTurnInput,
  "assistantContent" | "metadataJson"
> & {
  db: Db;
  env: ParsedApiEnvBindings;
  activeMemories: ChatMemory[];
  assistantContent: string;
  replyPolicy?: ReplyPolicy | null;
};

export async function finalizeTurn(input: FinalizeTurnInput): Promise<void> {
  const summary = buildRollingSummary({
    previousSummary: input.previousSummary,
    recentMessages: input.recentMessages,
    userContent: input.userContent,
    assistantContent: input.assistantContent,
  });
  const screening =
    input.allowMemoryExtraction === false
      ? null
      : await detectMemoryCandidate(input.env, {
          userText: input.userContent,
          activeMemories: input.activeMemories,
          recentMessages: input.recentMessages,
        });
  const candidates =
    screening === null ? [] : extractMemoryCandidates(screening);
  const duplicateMemories = await Promise.all(
    candidates.map((candidate) =>
      findMemoryByContent(input.db, {
        userId: input.userId,
        agentId: input.agentId,
        content: candidate.content,
      }),
    ),
  );
  const memories = candidates.flatMap((candidate, index) =>
    duplicateMemories[index] === null
      ? [
          {
            id: crypto.randomUUID(),
            ...candidate,
            sourceMessageId: input.userMessageId,
          },
        ]
      : [],
  );
  const metadataJson = input.replyPolicy
    ? serializeReplyQualityMetadata({
        replyPolicy: input.replyPolicy,
        replyQuality: evaluateReplyQuality({
          text: input.assistantContent,
          policy: input.replyPolicy,
        }),
      })
    : null;

  await persistAssistantTurn(input.db, {
    id: input.id,
    conversationId: input.conversationId,
    userId: input.userId,
    agentId: input.agentId,
    assistantContent: input.assistantContent,
    summary,
    memories,
    metadataJson,
    nowMs: input.nowMs,
  });
}
