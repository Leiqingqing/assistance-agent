import type {
  AgentConversationMessagesQuerySchema,
  ConversationEmotion,
  ConversationIntent,
  ConversationSafety,
  EmotionRoute,
} from "@repo/contracts/chat";
import type { z } from "zod";

export type MessagesQuery = z.infer<
  typeof AgentConversationMessagesQuerySchema
>;

export type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentPrompt = {
  name: string;
  headline: string | null;
  description: string | null;
  storyBackground: string | null;
  personalityPrompt: string | null;
  tonePrompt: string | null;
  guardrailsPrompt: string | null;
  defaultPrompt: string | null;
};

export type ConversationPrompt = {
  summary: string | null;
};

export type ChatMemory = {
  type: string;
  content: string;
  importance: number;
};

export type BuildChatMessagesInput = {
  agent: AgentPrompt;
  conversation: ConversationPrompt;
  memories: ChatMemory[];
  history: ChatHistoryMessage[];
  currentUserContent: string;
  safety: ConversationSafety;
  intent: ConversationIntent;
  emotion: ConversationEmotion;
  emotionRoute: EmotionRoute;
};

export type MemoryCandidate = {
  type: string;
  content: string;
  importance: number;
};

export type BuildRollingSummaryInput = {
  previousSummary: string | null;
  recentMessages: ChatHistoryMessage[];
  userContent: string;
  assistantContent: string;
};

export type SaveAssistantTurnInput = {
  id: string;
  conversationId: string;
  userId: string;
  agentId: string;
  userMessageId: string;
  userContent: string;
  assistantContent: string;
  previousSummary: string | null;
  recentMessages: ChatHistoryMessage[];
  allowMemoryExtraction?: boolean;
  nowMs: number;
};

export type EvaluateConversationSafetyInput = {
  agentName: string;
  guardrailsPrompt: string | null;
  activeMemories: ChatMemory[];
  history: ChatHistoryMessage[];
  currentUserContent: string;
};

export type ConversationSafetyPromptInput = {
  agentName: string;
  agentGuardrails: string;
  activeMemories: string;
  recentMessages: string;
  userText: string;
};

export type StructuredOutputMethod =
  | "jsonSchema"
  | "functionCalling"
  | "jsonMode";

export type StructuredOutputStrategy = {
  id: string;
  method: StructuredOutputMethod;
  useResponsesApi: boolean;
};