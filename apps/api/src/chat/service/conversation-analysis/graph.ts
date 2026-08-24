import { END, START, StateGraph } from "@langchain/langgraph";

import type { ParsedApiEnvBindings } from "/env";
import {
  createDetectIntentNode,
  FALLBACK_CONVERSATION_INTENT,
} from "./detect-intent";
import {
  createDetectEmotionNode,
  FALLBACK_CONVERSATION_EMOTION,
} from "./detect-emotion";
import {
  FALLBACK_EMOTION_ROUTE,
  routeEmotionNode,
} from "./route-emotion";
import {
  ConversationAnalysisState,
  type ConversationAnalysisGraphState,
  type DetectConversationIntentInput,
} from "./state";
import { FALLBACK_RELATIONSHIP_STAGE, relationshipStageNode } from "./relationshipStage";

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
    .addNode("detect_conversation_emotion", createDetectEmotionNode(env))
    // .addNode("build_relationship_stage", relationshipStageNode)
    .addNode("route_conversation_emotion", routeEmotionNode)
    .addEdge(START, "normalize_user_input")
    .addEdge("normalize_user_input", "detect_conversation_intent")
    .addEdge("detect_conversation_intent", "detect_conversation_emotion")
    // .addEdge("detect_conversation_emotion", "build_relationship_stage")
    .addEdge("detect_conversation_emotion", "route_conversation_emotion")
    .addEdge("route_conversation_emotion", END)
    .compile();
}

export async function analyzeConversation(
  env: ParsedApiEnvBindings,
  input: DetectConversationIntentInput,
) {
  const graph = compileConversationAnalysisGraph(env);
  const result = await graph.invoke({
    ...input,
    normalizedInput: "",
    intent: null,
    emotion: null,
    relationshipStage: null,
    emotionRoute: null,
  });

  const intent = result.intent ?? FALLBACK_CONVERSATION_INTENT;
  const emotion = result.emotion ?? FALLBACK_CONVERSATION_EMOTION;
  const relationshipStage =
    result.relationshipStage ??FALLBACK_RELATIONSHIP_STAGE;
  const emotionRoute =
    result.emotionRoute ??
    FALLBACK_EMOTION_ROUTE;

  return {
    intent,
    emotion,
    relationshipStage,
    emotionRoute,
  };
}

export async function detectConversationIntent(
  env: ParsedApiEnvBindings,
  input: DetectConversationIntentInput,
) {
  const result = await analyzeConversation(env, input);
  return result.intent;
}
