import type {
  ConversationEmotion,
  ConversationIntent,
  ConversationRelationshipStage,
  ConversationSafety,
  EmotionRoute,
} from "@repo/contracts/chat";
import { Annotation } from "@langchain/langgraph";

import type { ChatHistoryMessage, ChatMemory } from "@/chat/types";

export const ConversationAnalysisState = Annotation.Root({
  agentName: Annotation<string>(),
  agentGuardrails: Annotation<string | null>(),
  safety: Annotation<ConversationSafety>(),
  activeMemories: Annotation<ChatMemory[]>(),
  recentMessages: Annotation<ChatHistoryMessage[]>(),
  messageCount: Annotation<number>(),
  userText: Annotation<string>(),
  normalizedInput: Annotation<string>(),
  intent: Annotation<ConversationIntent | null>(),
  emotion: Annotation<ConversationEmotion | null>(),
  relationshipStage: Annotation<ConversationRelationshipStage | null>(),
  emotionRoute: Annotation<EmotionRoute | null>(),
});

export type ConversationAnalysisGraphState =
  typeof ConversationAnalysisState.State;

export type DetectConversationIntentInput = {
  agentName: string;
  agentGuardrails: string | null;
  safety: ConversationSafety;
  activeMemories: ChatMemory[];
  recentMessages: ChatHistoryMessage[];
  messageCount: number;
  userText: string;
};
