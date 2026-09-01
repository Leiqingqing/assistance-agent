import {
  ConversationEmotionSchema,
  type ConversationEmotion,
  type ConversationSafety,
} from "@repo/contracts/chat";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import type { ParsedApiEnvBindings } from "/env";
import { createChatModel, getAiModelIdentity } from "@/ai/chat-model";
import {
  formatActiveMemories,
  formatRecentMessages,
} from "@/ai/prompt-formatters";
import {
  invokeStructuredOutputWithFallback,
  type StructuredOutputMethod,
} from "@/ai/structured-output";
import type { ConversationAnalysisGraphState } from "@/chat/service/turn-planning/state";

export const CONVERSATION_EMOTION_ANALYSIS_VERSION = "conversation-emotion-v1";

const conversationEmotionPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "你是 AI 电子伴侣聊天产品的情绪识别器。",
      "你的任务不是诊断用户，也不是回复用户，而是判断当前这轮聊天中用户表现出的情绪状态和陪伴需求。",
      "必须结合用户输入、最近对话、长期记忆、安全边界结果和意图判断来分析。",
      "不要把轻微抱怨夸大成严重危机；如果安全边界已经提示高风险，要保持谨慎。",
      "重点判断：用户是否需要安慰、是否需要降温、是否需要低压力陪伴、是否需要更具体的建议。",
      "primaryEmotion 必须选择最主要的一个当前情绪；secondaryEmotions 最多三个，使用简短、具体的中文情绪词，不能重复主情绪。",
      "必须严格返回符合指定 schema 的 JSON，不得增加字段、返回 Markdown 或解释。",
      "",
      "primaryEmotion/secondaryEmotions 可选值：neutral | happy | tired | lonely | sad | anxious | angry | jealous | embarrassed | affectionate | playful | confused | disappointed | stressed | hurt",
      "valence 可选值：positive | neutral | negative | mixed",
      "arousal 可选值：low | medium | high",
      "replyTone 可选值：light | warm | soft | playful | calm | serious | reassuring | apologetic",
      "",
      "必须返回所有字段，格式示例：",
      `{{`,
      `  "primaryEmotion": "lonely",`,
      `  "secondaryEmotions": ["happy", "anxious"],`,
      `  "intensity": 0.7,`,
      `  "valence": "negative",`,
      `  "arousal": "low",`,
      `  "needsComfort": true,`,
      `  "needsDeescalation": false,`,
      `  "needsClarification": false,`,
      `  "emotionalCue": "用户直接表达没人陪伴的失落感。",`,
      `  "replyTone": "soft"`,
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
      "已识别的本轮意图：",
      "{intent}",
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

const ConversationEmotionModelOutputSchema =
  ConversationEmotionSchema.partial().extend({
    secondaryEmotions: z
      .union([
        z.array(z.string().trim().min(1).max(40)).max(3),
        z.string().trim().min(1).max(40),
      ])
      .optional(),
  });

type ConversationEmotionModelOutput = z.infer<
  typeof ConversationEmotionModelOutputSchema
>;

export const FALLBACK_CONVERSATION_EMOTION: ConversationEmotion = {
  primaryEmotion: "neutral",
  secondaryEmotions: [],
  intensity: 0.3,
  valence: "neutral",
  arousal: "medium",
  needsComfort: false,
  needsDeescalation: false,
  needsClarification: true,
  emotionalCue: "情绪识别暂时不可用，采用中性陪伴策略。",
  replyTone: "warm",
};

function repairConversationEmotionModelOutput(
  emotion: ConversationEmotionModelOutput,
): ConversationEmotion {
  const secondaryEmotions =
    emotion.secondaryEmotions === undefined
      ? []
      : Array.isArray(emotion.secondaryEmotions)
        ? emotion.secondaryEmotions
        : [emotion.secondaryEmotions];

  return ConversationEmotionSchema.parse({
    ...FALLBACK_CONVERSATION_EMOTION,
    ...emotion,
    secondaryEmotions,
    emotionalCue:
      emotion.emotionalCue?.trim() ||
      FALLBACK_CONVERSATION_EMOTION.emotionalCue,
  });
}

function normalizeConversationEmotion(
  emotion: ConversationEmotion,
  safety: ConversationSafety,
): ConversationEmotion {
  const next: ConversationEmotion = {
    ...emotion,
    secondaryEmotions: Array.from(
      new Set(
        emotion.secondaryEmotions
          .map((item) => item.trim())
          .filter(
            (item) =>
              item.length > 0 &&
              item.toLocaleLowerCase() !==
                emotion.primaryEmotion.toLocaleLowerCase(),
          ),
      ),
    ).slice(0, 3),
    emotionalCue: emotion.emotionalCue.trim(),
  };

  if (next.primaryEmotion === "angry" && next.intensity >= 0.55) {
    next.needsDeescalation = true;
    next.replyTone = "calm";
  }

  if (
    ["lonely", "sad", "anxious", "disappointed", "hurt"].includes(
      next.primaryEmotion,
    ) &&
    next.intensity >= 0.4
  ) {
    next.needsComfort = true;
  }

  if (
    safety.category === "emotional_dependency" ||
    safety.boundaryAction === "soft_boundary"
  ) {
    next.replyTone = "warm";
  }

  return ConversationEmotionSchema.parse(next);
}

async function invokeConversationEmotionAnalysis(
  model: ChatOpenAI,
  method: StructuredOutputMethod,
  state: ConversationAnalysisGraphState,
): Promise<ConversationEmotion> {
  const structuredModel = model.withStructuredOutput(
    ConversationEmotionModelOutputSchema,
    {
      method,
      name: "conversation_emotion",
    },
  );
  const emotionChain = conversationEmotionPrompt.pipe(structuredModel);
  const emotion = await emotionChain.invoke({
    agentName: state.agentName,
    agentGuardrails: state.agentGuardrails?.trim() || "无额外自定义边界规则。",
    safety: JSON.stringify(state.safety),
    intent: JSON.stringify(state.intent),
    activeMemories: formatActiveMemories(state.activeMemories),
    recentMessages: formatRecentMessages(state.recentMessages),
    normalizedInput: state.normalizedInput,
  });

  return normalizeConversationEmotion(
    repairConversationEmotionModelOutput(emotion),
    state.safety,
  );
}

export function createDetectEmotionNode(env: ParsedApiEnvBindings) {
  const { baseURL, modelName } = getAiModelIdentity(env);
  const model = createChatModel(env);

  return async (
    state: ConversationAnalysisGraphState,
  ): Promise<Partial<ConversationAnalysisGraphState>> => {
    const emotion = await invokeStructuredOutputWithFallback({
      cacheKey: `${baseURL}|${modelName}`,
      operation: "conversation emotion",
      invoke: (method) =>
        invokeConversationEmotionAnalysis(model, method, state),
      fallback: FALLBACK_CONVERSATION_EMOTION,
    });

    return { emotion };
  };
}
