import {
  EmotionRouteSchema,
  type ConversationEmotion,
  type ConversationIntent,
  type ConversationRelationshipStage,
  type ConversationSafety,
  type EmotionRoute,
} from "@repo/contracts/chat";

import type { ConversationAnalysisState } from "@/chat/service/turn-planning/state";
import { FALLBACK_CONVERSATION_EMOTION } from "./detect-emotion";

export const EMOTION_ROUTE_VERSION = "emotion-route-v1";

export const FALLBACK_EMOTION_ROUTE: EmotionRoute = {
  route: 'gentle_clarification',
  responseLength: 'short',
  shouldAskQuestion: true,
  shouldGiveAdvice: false,
  shouldUsePetName: false,
  shouldMirrorEmotion: false,
  routeGuidance: '先温和承接，再用一个轻问题确认用户想继续聊什么。',
}

export function buildEmotionRoute(params: {
  safety: ConversationSafety
  intent: ConversationIntent | null
  emotion: ConversationEmotion | null
  relationshipStage: ConversationRelationshipStage | null
}): EmotionRoute {
  if (!params.intent && !params.emotion) {
    return FALLBACK_EMOTION_ROUTE
  }

  const emotion = params.emotion ?? FALLBACK_CONVERSATION_EMOTION
  const intent = params.intent
  const relationshipStage = params.relationshipStage
  let route: EmotionRoute['route'] = 'light_companion'
  let responseLength: EmotionRoute['responseLength'] = 'short'
  let shouldAskQuestion = intent?.replyExpectation.shouldAskQuestion ?? false
  let shouldGiveAdvice = false
  let shouldUsePetName = false
  let shouldMirrorEmotion = false
  let routeGuidance = '用自然、轻松的方式延续对话，保持陪伴感，不要过度解释。'

  if (params.safety.boundaryAction === 'soft_boundary') {
    route = 'calm_deescalation'
    responseLength = 'short'
    shouldAskQuestion = false
    shouldGiveAdvice = false
    shouldMirrorEmotion = false
    routeGuidance = '保持温和但清晰的边界，不强化风险诉求，把话题带回安全、尊重现实边界的方向。'
  } else if (emotion.needsDeescalation || emotion.primaryEmotion === 'angry') {
    route = intent?.primary === 'conversation_repair' || intent?.primary === 'agent_feedback'
      ? 'relationship_repair'
      : 'calm_deescalation'
    responseLength = 'short'
    shouldAskQuestion = route === 'relationship_repair'
    shouldGiveAdvice = false
    shouldMirrorEmotion = true
    routeGuidance = route === 'relationship_repair'
      ? '先承认用户的不舒服，语气诚恳，不争辩；用一句轻问题确认希望如何调整互动方式。'
      : '先帮情绪降温，不站队、不拱火、不急着讲道理；用短句承接并给用户留出空间。'
  } else if (intent?.primary === 'conversation_repair' || intent?.primary === 'agent_feedback') {
    route = 'relationship_repair'
    responseLength = 'short'
    shouldAskQuestion = true
    shouldGiveAdvice = false
    shouldMirrorEmotion = emotion.valence === 'negative'
    routeGuidance = '把重点放在修复体验上，少解释系统原因，多表达理解和愿意调整。'
  } else if (intent?.primary === 'romantic_flirt' || emotion.primaryEmotion === 'affectionate') {
    route = 'playful_flirt'
    responseLength = 'short'
    shouldAskQuestion = intent?.replyExpectation.shouldAskQuestion ?? false
    shouldGiveAdvice = false
    shouldUsePetName = true
    shouldMirrorEmotion = true
    routeGuidance = '可以轻微暧昧和俏皮，但不要越过 Agent 人设边界；保持甜而不油腻。'
  } else if (intent?.primary === 'relationship_advice' || intent?.requestedAgentAction === 'analyze_situation') {
    route = emotion.needsComfort ? 'warm_comfort' : 'practical_support'
    responseLength = emotion.intensity >= 0.65 ? 'medium' : 'short'
    shouldAskQuestion = intent?.replyExpectation.shouldAskQuestion ?? false
    shouldGiveAdvice = true
    shouldMirrorEmotion = emotion.valence === 'negative'
    routeGuidance = emotion.needsComfort
      ? '先安抚再给建议，建议控制在一两个具体动作内，不要上来就分析对错。'
      : '直接给出可执行建议，保持像亲密朋友一样自然，不要写成正式咨询报告。'
  } else if (intent?.primary === 'roleplay') {
    route = 'light_companion'
    responseLength = intent?.replyExpectation.depth === 'deep' ? 'medium' : 'short'
    shouldAskQuestion = false
    shouldGiveAdvice = false
    shouldMirrorEmotion = true
    routeGuidance = '进入角色互动，跟随用户设定推进剧情，保持沉浸感，同时不突破安全边界。'
  } else if (emotion.needsComfort && emotion.intensity >= 0.75) {
    route = 'deep_comfort'
    responseLength = 'medium'
    shouldAskQuestion = emotion.needsClarification
    shouldGiveAdvice = false
    shouldMirrorEmotion = true
    routeGuidance = '认真承接用户情绪，少讲大道理；先让用户感到被理解，再给一个很轻的问题或陪伴句。'
  } else if (emotion.needsComfort || emotion.valence === 'negative') {
    route = emotion.primaryEmotion === 'tired' || intent?.primary === 'companionship_presence'
      ? 'quiet_presence'
      : 'warm_comfort'
    responseLength = route === 'quiet_presence' ? 'very_short' : 'short'
    shouldAskQuestion = route !== 'quiet_presence' && emotion.needsClarification
    shouldGiveAdvice = false
    shouldMirrorEmotion = true
    routeGuidance = route === 'quiet_presence'
      ? '用户更需要低压力陪伴，回复要短、轻、柔，不连续追问，不急着给建议。'
      : '先温柔安慰，承认用户感受，再用低压力方式延续话题。'
  } else if (intent?.primary === 'memory_update' || intent?.primary === 'preference_setting') {
    route = 'light_companion'
    responseLength = 'very_short'
    shouldAskQuestion = false
    shouldGiveAdvice = false
    routeGuidance = '简短确认已经理解用户的新偏好或信息，不要展开过多。'
  } else if (intent?.shouldClarify || emotion.needsClarification) {
    route = 'gentle_clarification'
    responseLength = 'short'
    shouldAskQuestion = true
    shouldGiveAdvice = false
    routeGuidance = '先承接，再只问一个轻问题，帮助确认用户是想被听见、被安慰还是想一起想办法。'
  }

  if (relationshipStage) {
    if (relationshipStage.stage === 'repairing' || relationshipStage.pacing === 'repair_first') {
      route = 'relationship_repair'
      responseLength = 'short'
      shouldAskQuestion = true
      shouldGiveAdvice = false
      shouldMirrorEmotion = true
      routeGuidance = `${relationshipStage.relationshipGuidance} 先修复关系体验，再决定是否继续推进话题。`
    } else if (
      relationshipStage.stage === 'boundary_sensitive' ||
      relationshipStage.stage === 'dependency_watch' ||
      relationshipStage.boundaryMode === 'firm'
    ) {
      route = 'calm_deescalation'
      responseLength = 'short'
      shouldAskQuestion = false
      shouldGiveAdvice = false
      shouldUsePetName = false
      shouldMirrorEmotion = emotion.valence === 'negative'
      routeGuidance = `${relationshipStage.relationshipGuidance} 回复要有陪伴感，但优先稳住边界和节奏。`
    } else if (
      route === 'playful_flirt' &&
      (relationshipStage.stage === 'new_connection' || relationshipStage.intimacyPermission === 'low')
    ) {
      route = 'light_companion'
      responseLength = 'short'
      shouldUsePetName = false
      routeGuidance = `${relationshipStage.relationshipGuidance} 可以有轻微好感表达，但不要直接进入高亲密暧昧。`
    }
  }

  if (emotion.primaryEmotion === 'happy' || emotion.primaryEmotion === 'playful') {
    shouldMirrorEmotion = true
  }

  return EmotionRouteSchema.parse({
    route,
    responseLength,
    shouldAskQuestion,
    shouldGiveAdvice,
    shouldUsePetName,
    shouldMirrorEmotion,
    routeGuidance: routeGuidance.replace(/\s+/g, ' ').trim().slice(0, 600),
  })
}

export function routeEmotionNode(state: typeof ConversationAnalysisState.State) {
  return {
    emotionRoute: buildEmotionRoute({
      safety: state.safety,
      intent: state.intent,
      emotion: state.emotion,
      relationshipStage: state.relationshipStage,
    }),
  }
}

export function getEmotionSystemInstruction(
  emotion: ConversationEmotion | null,
  emotionRoute: EmotionRoute | null,
): string {
  if (!emotion || !emotionRoute) {
    return "";
  }

  return [
    "本轮用户情绪与回复路由：",
    `- 主情绪：${emotion.primaryEmotion}（强度 ${emotion.intensity.toFixed(2)}）`,
    emotion.secondaryEmotions.length > 0
      ? `- 次要情绪：${emotion.secondaryEmotions.join("、")}`
      : "",
    `- 情绪倾向：${emotion.valence}；激活程度：${emotion.arousal}`,
    `- 可观察线索：${emotion.emotionalCue}`,
    `- 策略需要：安慰 ${emotion.needsComfort ? "是" : "否"}，降温 ${emotion.needsDeescalation ? "是" : "否"}，澄清 ${emotion.needsClarification ? "是" : "否"}`,
    `- 建议语气：${emotion.replyTone}`,
    `- 回复路由：${emotionRoute.route}；长度 ${emotionRoute.responseLength}`,
    `- 回复动作：追问 ${emotionRoute.shouldAskQuestion ? "是" : "否"}，建议 ${emotionRoute.shouldGiveAdvice ? "是" : "否"}，昵称 ${emotionRoute.shouldUsePetName ? "可用" : "不用"}，适度映照情绪 ${emotionRoute.shouldMirrorEmotion ? "是" : "否"}`,
    `- 路由指导：${emotionRoute.routeGuidance}`,
    "请将以上判断作为隐性回复策略，不要向用户暴露情绪标签、评分或路由名称。",
  ]
    .filter(Boolean)
    .join("\n");
}
