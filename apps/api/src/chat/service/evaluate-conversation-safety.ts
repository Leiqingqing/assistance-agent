import {
  ConversationSafetySchema,
  type ConversationSafety,
} from "@repo/contracts/chat";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

import type { ParsedApiEnvBindings } from "/env";
import type {
  ChatHistoryMessage,
  ChatMemory,
  ConversationSafetyPromptInput,
  EvaluateConversationSafetyInput,
  StructuredOutputMethod,
} from "@/chat/types";

const CONVERSATION_SAFETY_ANALYSIS_VERSION = "conversation-safety-v1";
const STRUCTURED_OUTPUT_METHOD_TIMEOUT_MS = 8_000;
const STRUCTURED_OUTPUT_METHODS: readonly StructuredOutputMethod[] = [
  "jsonSchema",
  "jsonMode",
  "functionCalling",
];
const structuredOutputMethodCache = new Map<string, StructuredOutputMethod>();

const conversationSafetyPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "你是 AI 电子伴侣聊天产品的安全边界判断器。",
      "你的任务是判断本轮用户输入是否需要安全边界处理，而不是替用户聊天。",
      "必须优先识别自伤危机、违法暴力、隐私侵犯、操控关系、性边界、高风险医疗法律财务建议、强情绪依赖。",
      "不要因为产品是陪伴/恋爱/交友场景就放松边界；也不要过度拦截普通倾诉、轻度暧昧和正常情绪表达。",
      "如果不确定，使用 caution + soft_boundary，而不是 safe。",
      "必须严格返回以下 JSON 结构，不得缺少或增加字段：",
    `{{`,
    `  "safetyLevel": "safe",`,
    `  "category": "normal",`,
    `  "boundaryAction": "continue",`,
    `  "reason": "判断原因",`,
    `  "responseGuidance": "回复指引",`,
    `  "allowMemoryExtraction": true`,
    `}}`,
    "",
    "字段可选值：",
    "- safetyLevel: safe | caution | redirect | block | crisis",
    "- category: normal | emotional_dependency | manipulation | self_harm | sexual_boundary | privacy | illegal | medical_legal_financial | other",
    "- boundaryAction: continue | soft_boundary | redirect | refuse | crisis_support",
    "- reason 不超过 300 字",
    "- responseGuidance 不超过 600 字",
    "- allowMemoryExtraction 必须是 boolean",
    "只返回 JSON，不要返回 Markdown 或解释。",
    ].join("\n"),
  ],
  [
    "human",
    [
      "Agent 名称：{agentName}",
      "",
      "Agent 自定义边界规则：",
      "{agentGuardrails}",
      "",
      "长期记忆：",
      "{activeMemories}",
      "",
      "最近对话：",
      "{recentMessages}",
      "",
      "本轮用户输入：",
      "{userText}",
    ].join("\n"),
  ],
]);

const FALLBACK_CONVERSATION_SAFETY: ConversationSafety = {
  safetyLevel: "caution",
  category: "other",
  boundaryAction: "soft_boundary",
  reason: "安全边界判断暂时不可用，采用保守回复策略。",
  responseGuidance:
    "用温和、克制、尊重边界的方式回复；不要提供操控、伤害、违法或高风险专业建议。",
  allowMemoryExtraction: false,
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

function formatRecentMessages(history: ChatHistoryMessage[]): string {
  if (history.length === 0) {
    return "无历史对话。";
  }

  return history
    .map(
      (message) =>
        `${message.role === "user" ? "用户" : "Agent"}：${message.content}`,
    )
    .join("\n");
}

function normalizeConversationSafety(
  safety: ConversationSafety,
): ConversationSafety {
  const next = { ...safety };

  if (next.safetyLevel === "crisis") {
    next.boundaryAction = "crisis_support";
    next.allowMemoryExtraction = false;
  }

  if (
    next.safetyLevel === "block" &&
    next.boundaryAction !== "crisis_support"
  ) {
    next.boundaryAction = "refuse";
    next.allowMemoryExtraction = false;
  }

  if (
    next.boundaryAction === "refuse" ||
    next.boundaryAction === "crisis_support"
  ) {
    next.allowMemoryExtraction = false;
  }

  if (next.boundaryAction === "continue" && next.safetyLevel !== "safe") {
    next.boundaryAction = "soft_boundary";
  }

  if (!next.responseGuidance) {
    next.responseGuidance = "用温和、克制、尊重边界的方式回复。";
  }

  return next;
}

export function serializeConversationSafetyMetadata(
  safety: ConversationSafety,
): string {
  return JSON.stringify({
    analysisVersion: CONVERSATION_SAFETY_ANALYSIS_VERSION,
    safety,
  });
}

const BOUNDARY_REPLIES: Record<"refuse" | "crisis_support", string> = {
  refuse:
    "这件事我没办法继续帮你。我们可以换一个更安全、对你更有帮助的话题。如果你只是想聊聊心情，我在这里听着。",
  crisis_support:
    "我很担心你现在的状态。你不是一个人，请立刻向现实中的人求助：如果有紧急危险，马上联系当地紧急救援或身边信任的人，也可以拨打专业心理援助热线。如果你愿意，可以告诉我你此刻是否处于安全的环境，我会陪你把注意力放在保护自己上。我不会提供任何可能造成伤害的方法。",
};

export function isDirectBoundaryReply(
  safety: ConversationSafety,
): safety is ConversationSafety & {
  boundaryAction: "refuse" | "crisis_support";
} {
  return (
    safety.boundaryAction === "refuse" ||
    safety.boundaryAction === "crisis_support"
  );
}

export function getBoundaryReply(
  boundaryAction: "refuse" | "crisis_support",
): string {
  return BOUNDARY_REPLIES[boundaryAction];
}

async function invokeConversationSafetyAnalysis(
  model: ChatOpenAI,
  method: StructuredOutputMethod,
  promptInput: ConversationSafetyPromptInput,
): Promise<ConversationSafety> {
  const structuredModel = model.withStructuredOutput(ConversationSafetySchema, {
    method,
    name: "conversation_safety",
  });
  const safetyChain = conversationSafetyPrompt.pipe(structuredModel);
  const safety = await safetyChain.invoke(promptInput);

  return normalizeConversationSafety(ConversationSafetySchema.parse(safety));
}

export async function evaluateConversationSafety(
  env: ParsedApiEnvBindings,
  input: EvaluateConversationSafetyInput,
): Promise<ConversationSafety> {
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
    zdrEnabled: true
  });

  const promptInput: ConversationSafetyPromptInput = {
    agentName: input.agentName,
    agentGuardrails: input.guardrailsPrompt?.trim() || "无额外自定义边界规则。",
    activeMemories: formatActiveMemories(input.activeMemories),
    recentMessages: formatRecentMessages(input.history),
    userText: input.currentUserContent,
  };
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
      const safety = await invokeConversationSafetyAnalysis(
        model,
        method,
        promptInput,
      );

      structuredOutputMethodCache.set(cacheKey, method);
      return safety;
    } catch (error) {
      lastError = error;
      console.warn(
        `Conversation safety structured output method failed: ${method}`,
        error,
      );
    }
  }

  console.error(
    "All conversation safety structured output methods failed; using fallback",
    lastError,
  );
  return FALLBACK_CONVERSATION_SAFETY;
}
export function getSafetySystemInstruction(safety: ConversationSafety) {
  if (safety.boundaryAction === 'continue') {
    return ''
  }

  return [
    '本轮安全边界判断：',
    `- 等级：${safety.safetyLevel}`,
    `- 分类：${safety.category}`,
    `- 动作：${safety.boundaryAction}`,
    `- 回复策略：${safety.responseGuidance}`,
    '请严格遵守该策略，优先保护用户与他人的现实安全、隐私和关系边界。',
  ].join('\n')
}