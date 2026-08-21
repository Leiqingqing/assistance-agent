import {
  CompanionIntentPrimarySchema,
  ConversationIntentSchema,
  type ConversationIntent,
  type ConversationSafety,
} from "@repo/contracts/chat";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import type { ParsedApiEnvBindings } from "/env";
import type {
  ChatHistoryMessage,
  ChatMemory,
  StructuredOutputMethod,
} from "@/chat/types";
import type { ConversationAnalysisGraphState } from "@/chat/service/conversation-analysis/state";

export const CONVERSATION_INTENT_ANALYSIS_VERSION = "conversation-intent-v1";

const STRUCTURED_OUTPUT_METHOD_TIMEOUT_MS = 8_000;
const STRUCTURED_OUTPUT_METHODS: readonly StructuredOutputMethod[] = [
  "jsonSchema",
  "jsonMode",
  "functionCalling",
];
const structuredOutputMethodCache = new Map<string, StructuredOutputMethod>();

const conversationIntentPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      '你是 AI 电子伴侣聊天产品的意图识别器。',
      '你的任务不是回复用户，而是判断用户在当前亲密陪伴/交友聊天场景中的真实沟通意图。',
      '必须结合最近对话、长期记忆、Agent 人设边界和安全边界结果来判断。',
      '优先区分：普通闲聊、情绪陪伴、恋爱暧昧、角色扮演、生活分享、关系建议、记忆更新、偏好设置、对 Agent 的反馈、误会修复。',
      '不要把所有问题都归为关系建议；用户只是想被陪伴、被听见或维持互动时，要识别为陪伴类意图。',
      '当用户表达模糊但情绪明确时，先判断情绪和期待，再决定是否需要追问。',
      "必须严格返回符合指定 schema 的 JSON，不得增加字段、返回 Markdown 或解释。",
      "",
      "primary/secondary 可选值：casual_chat | emotional_support | relationship_advice | romantic_flirt | companionship_presence | roleplay | life_sharing | memory_update | preference_setting | agent_feedback | conversation_repair | date_or_activity_planning | creative_request | meta_question | unclear",
      "userNeed 可选值：be_heard | be_comforted | get_advice | get_reply_draft | play_along | feel_connected | set_boundary | update_memory | adjust_agent | unknown",
      "requestedAgentAction 可选值：answer_directly | comfort_first | ask_follow_up | draft_message | analyze_situation | roleplay_response | remember_fact | adjust_style | repair_misunderstanding | continue_topic",
      "relationshipSignal 可选值：neutral | warming_up | seeking_closeness | testing_boundary | feeling_hurt | pulling_away | dependency_risk | conflict",
      "replyExpectation.depth：short | medium | deep",
      "replyExpectation.warmth：low | medium | high",
      "replyExpectation.directness：gentle | balanced | direct",
      "",
      "必须返回所有字段，格式示例：",
      `{{`,
      `  "primary": "emotional_support",`,
      `  "secondary": ["companionship_presence"],`,
      `  "confidence": 0.85,`,
      `  "userNeed": "be_comforted",`,
      `  "requestedAgentAction": "comfort_first",`,
      `  "relationshipSignal": "neutral",`,
      `  "replyExpectation": {{`,
      `    "depth": "medium",`,
      `    "warmth": "high",`,
      `    "directness": "gentle",`,
      `    "shouldAskQuestion": false`,
      `  }},`,
      `  "shouldClarify": false,`,
      `  "clarifyingQuestion": null,`,
      `  "promptGuidance": "先共情承接用户情绪，再给予温和陪伴。"`,
      `}}`,
    ].join("\n"),
  ],
  [
    "human",
    [
      "Agent 名称：{agentName}",
      "",
      "Agent 边界规则：",
      "{agentGuardrails}",
      "",
      "本轮安全评估：",
      "{safety}",
      "",
      "长期记忆：",
      "{activeMemories}",
      "",
      "最近对话：",
      "{recentMessages}",
      "",
      "本轮用户输入：",
      "{normalizedInput}",
    ].join("\n"),
  ],
]);

const ConversationIntentModelOutputSchema = ConversationIntentSchema.partial()
  .extend({
    secondary: z
      .union([
        z.array(CompanionIntentPrimarySchema).max(3),
        CompanionIntentPrimarySchema,
      ])
      .optional(),
    replyExpectation: ConversationIntentSchema.shape.replyExpectation
      .partial()
      .optional(),
  });

type ConversationIntentModelOutput = z.infer<
  typeof ConversationIntentModelOutputSchema
>;

export const FALLBACK_CONVERSATION_INTENT: ConversationIntent =  {
  primary: 'unclear',
  secondary: [],
  confidence: 0.3,
  userNeed: 'unknown',
  requestedAgentAction: 'ask_follow_up',
  relationshipSignal: 'neutral',
  replyExpectation: {
    depth: 'medium',
    warmth: 'medium',
    directness: 'gentle',
    shouldAskQuestion: true,
  },
  shouldClarify: true,
  clarifyingQuestion: '你是更想让我先听你说说，还是想让我帮你一起想办法？',
  promptGuidance: '先简短承接用户，不要擅自下结论；用一个自然的问题澄清用户真正需要。',
};

function formatActiveMemories(memories: ChatMemory[]): string {
  if (memories.length === 0) {
    return "无可用长期记忆。";
  }

  return memories
    .map(
      (memory) =>
        `- [${memory.type} / 重要度 ${memory.importance}] ${memory.content}`,
    )
    .join("\n");
}

function formatRecentMessages(messages: ChatHistoryMessage[]): string {
  if (messages.length === 0) {
    return "无历史对话。";
  }

  return messages
    .map(
      (message) =>
        `${message.role === "user" ? "用户" : "Agent"}：${message.content}`,
    )
    .join("\n");
}
// 修复意图模型输出，补全缺失字段
function repairConversationIntentModelOutput(
  intent: ConversationIntentModelOutput,
): ConversationIntent {
  const shouldClarify =
    intent.shouldClarify ??
    intent.requestedAgentAction === "ask_follow_up";
  const secondary =
    intent.secondary === undefined
      ? []
      : Array.isArray(intent.secondary)
        ? intent.secondary
        : [intent.secondary];

  return ConversationIntentSchema.parse({
    primary: intent.primary ?? FALLBACK_CONVERSATION_INTENT.primary,
    secondary,
    confidence:
      intent.confidence ??
      (intent.primary ? 0.5 : FALLBACK_CONVERSATION_INTENT.confidence),
    userNeed: intent.userNeed ?? FALLBACK_CONVERSATION_INTENT.userNeed,
    requestedAgentAction:
      intent.requestedAgentAction ??
      FALLBACK_CONVERSATION_INTENT.requestedAgentAction,
    relationshipSignal:
      intent.relationshipSignal ??
      FALLBACK_CONVERSATION_INTENT.relationshipSignal,
    replyExpectation: {
      ...FALLBACK_CONVERSATION_INTENT.replyExpectation,
      ...intent.replyExpectation,
      shouldAskQuestion:
        intent.replyExpectation?.shouldAskQuestion ?? shouldClarify,
    },
    shouldClarify,
    clarifyingQuestion: shouldClarify
      ? intent.clarifyingQuestion?.trim() ||
        FALLBACK_CONVERSATION_INTENT.clarifyingQuestion
      : null,
    promptGuidance:
      intent.promptGuidance?.trim() ||
      "围绕已识别的用户需要自然回应，不要暴露意图分类标签。",
  });
}

function normalizeConversationIntent(intent: ConversationIntent, safety: ConversationSafety): ConversationIntent {
  const next: ConversationIntent = {
    ...intent,
    secondary: Array.from(new Set(intent.secondary.filter((item) => item !== intent.primary))).slice(0, 3),
    replyExpectation: { ...intent.replyExpectation },
    clarifyingQuestion: intent.clarifyingQuestion?.trim() || null,
    promptGuidance: intent.promptGuidance.trim(),
  }

  if (next.confidence < 0.45) {
    next.primary = 'unclear'
    next.secondary = []
    next.userNeed = 'unknown'
    next.requestedAgentAction = 'ask_follow_up'
    next.shouldClarify = true
    next.replyExpectation.shouldAskQuestion = true
  }

  if (next.primary === 'memory_update') {
    next.userNeed = 'update_memory'
    next.requestedAgentAction = 'remember_fact'
    next.replyExpectation.depth = 'short'
    next.replyExpectation.shouldAskQuestion = false
    next.shouldClarify = false
  }

  if (next.primary === 'preference_setting' || next.primary === 'agent_feedback') {
    next.userNeed = 'adjust_agent'
    next.requestedAgentAction = next.primary === 'agent_feedback' ? 'repair_misunderstanding' : 'adjust_style'
  }

  if (safety.category === 'emotional_dependency' || safety.boundaryAction === 'soft_boundary') {
    next.relationshipSignal = next.relationshipSignal === 'neutral' ? 'dependency_risk' : next.relationshipSignal
    next.promptGuidance = [
      next.promptGuidance,
      '注意不要强化过度依赖，回复要温和陪伴，同时鼓励用户保留现实支持和自主判断。',
    ].filter(Boolean).join(' ')
  }

  if (next.shouldClarify && !next.clarifyingQuestion) {
    next.clarifyingQuestion = FALLBACK_CONVERSATION_INTENT.clarifyingQuestion
  }

  if (!next.shouldClarify) {
    next.clarifyingQuestion = null
  }

  if (!next.promptGuidance) {
    next.promptGuidance = FALLBACK_CONVERSATION_INTENT.promptGuidance
  }

  return next
}
async function invokeConversationIntentAnalysis(
  model: ChatOpenAI,
  method: StructuredOutputMethod,
  state: ConversationAnalysisGraphState,
): Promise<ConversationIntent> {
  const structuredModel = model.withStructuredOutput(
    ConversationIntentModelOutputSchema,
    {
      method,
      name: "conversation_intent",
    },
  );
  const intentChain = conversationIntentPrompt.pipe(structuredModel);
  const intent = await intentChain.invoke({
    agentName: state.agentName,
    agentGuardrails:
      state.agentGuardrails?.trim() || "无额外自定义边界规则。",
    safety: JSON.stringify(state.safety),
    activeMemories: formatActiveMemories(state.activeMemories),
    recentMessages: formatRecentMessages(state.recentMessages),
    normalizedInput: state.normalizedInput,
  });

  return normalizeConversationIntent(
    repairConversationIntentModelOutput(intent),
    state.safety,
  );
}

export function createDetectIntentNode(env: ParsedApiEnvBindings) {
  const baseURL = env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const modelName = env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const model = new ChatOpenAI({
    apiKey: env.DEEPSEEK_API_KEY,
    model: modelName,
    temperature: 0,
    maxRetries: 0,
    modelKwargs: {
      thinking: { type: "disabled" },
    },
    timeout: STRUCTURED_OUTPUT_METHOD_TIMEOUT_MS,
    configuration: {
      baseURL,
    },
    reasoning: { effort: "none" },
    zdrEnabled: true,
  });

  return async (
    state: ConversationAnalysisGraphState,
  ): Promise<Partial<ConversationAnalysisGraphState>> => {
    const cacheKey = `${baseURL}|${modelName}`;
    const cachedMethod = structuredOutputMethodCache.get(cacheKey);
    const methods = cachedMethod
      ? [
          cachedMethod,
          ...STRUCTURED_OUTPUT_METHODS.filter(
            (method) => method !== cachedMethod,
          ),
        ]
      : STRUCTURED_OUTPUT_METHODS;
    let lastError: unknown;

    for (const method of methods) {
      try {
        const intent = await invokeConversationIntentAnalysis(
          model,
          method,
          state,
        );

        structuredOutputMethodCache.set(cacheKey, method);
        return { intent };
      } catch (error) {
        lastError = error;
        console.warn(
          `Conversation intent structured output method failed: ${method}`,
          error,
        );
      }
    }

    console.error(
      "All conversation intent structured output methods failed; using fallback",
      lastError,
    );
    return { intent: FALLBACK_CONVERSATION_INTENT };
  };
}

export function getIntentSystemInstruction(intent: ConversationIntent | null) {
  if (!intent) {
    return ''
  }

  return [
    '本轮用户意图判断：',
    `- 主要意图：${intent.primary}（置信度 ${intent.confidence.toFixed(2)}）`,
    intent.secondary.length > 0 ? `- 次要意图：${intent.secondary.join('、')}` : '',
    `- 用户需要：${intent.userNeed}`,
    `- 建议动作：${intent.requestedAgentAction}`,
    `- 关系信号：${intent.relationshipSignal}`,
    `- 回复期待：深度 ${intent.replyExpectation.depth}，温度 ${intent.replyExpectation.warmth}，直接程度 ${intent.replyExpectation.directness}`,
    `- 是否追问：${intent.shouldClarify ? '是' : '否'}`,
    intent.shouldClarify && intent.clarifyingQuestion ? `- 可用追问：${intent.clarifyingQuestion}` : '',
    `- 回复指导：${intent.promptGuidance}`,
    '请把以上意图判断作为隐性策略，不要在回复中暴露分类标签。',
  ].filter(Boolean).join('\n')
}