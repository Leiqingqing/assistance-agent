import type { ReplyPolicy } from "@repo/contracts/chat";

import {
  evaluateReplyQuality,
  serializeReplyQualityMetadata,
} from "@/chat/service/turn-finalization/evaluate-reply-quality";
import { findMemoryByContent, persistAssistantTurn } from "@/chat/repository";
import { buildRollingSummary } from "@/chat/service/turn-finalization/build-summary";
import { extractMemoryCandidate } from "@/chat/service/turn-finalization/extract-memory";
import type { SaveAssistantTurnInput } from "@/chat/types";
import type { Db } from "@/db/client";

export type FinalizeTurnInput = Omit<
  SaveAssistantTurnInput,
  "assistantContent" | "metadataJson"
> & {
  db: Db;
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
  const memoryCandidate =
    input.allowMemoryExtraction === false
      ? null
      : extractMemoryCandidate(input.userContent);
  const duplicateMemory =
    memoryCandidate === null
      ? null
      : await findMemoryByContent(input.db, {
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
    memory,
    metadataJson,
    nowMs: input.nowMs,
  });
}
