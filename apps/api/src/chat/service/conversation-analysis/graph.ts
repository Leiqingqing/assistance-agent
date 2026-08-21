import { END, START, StateGraph } from "@langchain/langgraph";

import type { ParsedApiEnvBindings } from "/env";
import {
  createDetectIntentNode,
  FALLBACK_CONVERSATION_INTENT,
} from "@/chat/service/conversation-analysis/detect-intent";
import {
  ConversationAnalysisState,
  type ConversationAnalysisGraphState,
  type DetectConversationIntentInput,
} from "@/chat/service/conversation-analysis/state";

function normalizeUserInputNode(
  state: ConversationAnalysisGraphState,
): Partial<ConversationAnalysisGraphState> {
  const normalizedInput = state.userText
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { normalizedInput };
}

export function compileConversationAnalysisGraph(env: ParsedApiEnvBindings) {
  return new StateGraph(ConversationAnalysisState)
    .addNode("normalize_user_input", normalizeUserInputNode)
    .addNode("detect_conversation_intent", createDetectIntentNode(env))
    .addEdge(START, "normalize_user_input")
    .addEdge("normalize_user_input", "detect_conversation_intent")
    .addEdge("detect_conversation_intent", END)
    .compile();
}

export async function detectConversationIntent(
  env: ParsedApiEnvBindings,
  input: DetectConversationIntentInput,
) {
  const graph = compileConversationAnalysisGraph(env);
  const result = await graph.invoke({
    ...input,
    normalizedInput: "",
    intent: null,
  });

  return result.intent ?? FALLBACK_CONVERSATION_INTENT;
}
