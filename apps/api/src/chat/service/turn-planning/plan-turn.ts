import type { ParsedApiEnvBindings } from "/env";
import { SAFETY_RECENT_MESSAGE_LIMIT } from "@/chat/constants";
import {
  evaluateConversationSafety,
  getBoundaryReply,
  isDirectBoundaryReply,
  serializeConversationSafetyMetadata,
} from "@/chat/service/turn-planning/evaluate-conversation-safety";
import { analyzeConversation } from "@/chat/service/turn-planning/graph";
import { mergeConversationMetadata } from "@/chat/service/turn-planning/metadata";
import { CONVERSATION_EMOTION_ANALYSIS_VERSION } from "@/chat/service/turn-planning/nodes/detect-emotion";
import { CONVERSATION_INTENT_ANALYSIS_VERSION } from "@/chat/service/turn-planning/nodes/detect-intent";
import { EMOTION_ROUTE_VERSION } from "@/chat/service/turn-planning/nodes/route-emotion";
import { REPLY_POLICY_VERSION } from "@/chat/service/turn-planning/policies/reply-policy";
import type {
  PlanTurnInput,
  TurnPlan,
} from "@/chat/service/turn-planning/types";

export async function planTurn(
  env: ParsedApiEnvBindings,
  input: PlanTurnInput,
): Promise<TurnPlan> {
  const safety = await evaluateConversationSafety(env, {
    agentName: input.agentName,
    guardrailsPrompt: input.agentGuardrails,
    activeMemories: input.activeMemories,
    history: input.recentMessages.slice(-SAFETY_RECENT_MESSAGE_LIMIT),
    currentUserContent: input.userText,
  });
  const safetyMetadataJson = serializeConversationSafetyMetadata(safety);

  if (isDirectBoundaryReply(safety)) {
    return {
      kind: "boundary",
      safety,
      reply: getBoundaryReply(safety.boundaryAction),
      metadataJson: safetyMetadataJson,
    };
  }

  const analysis = await analyzeConversation(env, {
    agentName: input.agentName,
    agentGuardrails: input.agentGuardrails,
    safety,
    activeMemories: input.activeMemories,
    recentMessages: input.recentMessages,
    messageCount: input.messageCount,
    userText: input.userText,
  });

  return {
    kind: "reply",
    safety,
    intent: analysis.intent,
    emotion: analysis.emotion,
    emotionRoute: analysis.emotionRoute,
    replyPolicy: analysis.replyPolicy,
    metadataJson: mergeConversationMetadata(safetyMetadataJson, {
      intentAnalysisVersion: CONVERSATION_INTENT_ANALYSIS_VERSION,
      intent: analysis.intent,
      emotionAnalysisVersion: CONVERSATION_EMOTION_ANALYSIS_VERSION,
      emotion: analysis.emotion,
      emotionRouteVersion: EMOTION_ROUTE_VERSION,
      emotionRoute: analysis.emotionRoute,
      replyPolicyVersion: REPLY_POLICY_VERSION,
      replyPolicy: analysis.replyPolicy,
    }),
  };
}
