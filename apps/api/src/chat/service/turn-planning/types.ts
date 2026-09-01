import type {
  ConversationEmotion,
  ConversationIntent,
  ConversationSafety,
  EmotionRoute,
  ReplyPolicy,
} from "@repo/contracts/chat";

import type { ChatHistoryMessage, ChatMemory } from "@/chat/types";

export type PlanTurnInput = {
  agentName: string;
  agentGuardrails: string | null;
  activeMemories: ChatMemory[];
  recentMessages: ChatHistoryMessage[];
  messageCount: number;
  userText: string;
};

export type BoundaryTurnPlan = {
  kind: "boundary";
  safety: ConversationSafety;
  reply: string;
  metadataJson: string;
};

export type ReplyTurnPlan = {
  kind: "reply";
  safety: ConversationSafety;
  intent: ConversationIntent;
  emotion: ConversationEmotion;
  emotionRoute: EmotionRoute;
  replyPolicy: ReplyPolicy;
  metadataJson: string;
};

export type TurnPlan = BoundaryTurnPlan | ReplyTurnPlan;
