import {
  ReplyPolicySchema,
  type ConversationEmotion,
  type ConversationIntent,
  type ConversationRelationshipStage,
  type ConversationSafety,
  type EmotionRoute,
  type ReplyPolicy,
} from "@repo/contracts/chat";

import type { ConversationAnalysisState } from "@/chat/service/turn-planning/state";

export const REPLY_POLICY_VERSION = "reply-policy-v1";

type ReplyPolicyName = ReplyPolicy["policy"];
type AllowedMove = ReplyPolicy["allowedMoves"][number];
type ForbiddenMove = ReplyPolicy["forbiddenMoves"][number];
type SentenceBudget = ReplyPolicy["sentenceBudget"];

const ALWAYS_FORBIDDEN: readonly ForbiddenMove[] = [
  "lecture",
  "diagnose_user",
  "take_sides_aggressively",
  "pressure_to_disclose",
  "promise_real_world_action",
  "expose_internal_labels",
];

const RELAXED_IMMERSION_INTENTS: ReadonlySet<ConversationIntent["primary"]> =
  new Set(["meta_question", "agent_feedback", "preference_setting"]);

const RESPONSE_LENGTH_SENTENCE_CAP: Record<
  EmotionRoute["responseLength"],
  number
> = {
  very_short: 2,
  short: 4,
  medium: 6,
  long: 8,
};

const POLICY_SENTENCE_BUDGET: Record<ReplyPolicyName, SentenceBudget> = {
  quiet_presence: { min: 1, max: 2 },
  memory_ack: { min: 1, max: 2 },
  playful_flirt: { min: 1, max: 3 },
  calm_boundary: { min: 2, max: 3 },
  gentle_clarify: { min: 2, max: 3 },
  warm_companion: { min: 2, max: 4 },
  relationship_repair: { min: 2, max: 4 },
  practical_support: { min: 2, max: 5 },
  roleplay_flow: { min: 2, max: 5 },
  deep_empathy: { min: 3, max: 6 },
};

const POLICY_RHYTHM: Record<ReplyPolicyName, ReplyPolicy["rhythm"]> = {
  quiet_presence: "still",
  memory_ack: "still",
  deep_empathy: "soft",
  relationship_repair: "soft",
  gentle_clarify: "soft",
  warm_companion: "natural",
  roleplay_flow: "natural",
  playful_flirt: "lively",
  calm_boundary: "focused",
  practical_support: "focused",
};

const POLICY_OPENING: Record<ReplyPolicyName, ReplyPolicy["openingMove"]> = {
  quiet_presence: "acknowledge",
  warm_companion: "acknowledge",
  memory_ack: "acknowledge",
  deep_empathy: "comfort",
  playful_flirt: "play",
  calm_boundary: "set_boundary",
  relationship_repair: "apologize",
  gentle_clarify: "clarify",
  practical_support: "answer",
  roleplay_flow: "play",
};

const POLICY_ALLOWED_MOVES: Record<ReplyPolicyName, AllowedMove[]> = {
  quiet_presence: ["validate_feeling", "offer_presence", "mirror_emotion"],
  warm_companion: [
    "validate_feeling",
    "mirror_emotion",
    "offer_presence",
    "ask_one_question",
    "light_tease",
  ],
  deep_empathy: [
    "validate_feeling",
    "mirror_emotion",
    "offer_presence",
    "ask_one_question",
  ],
  playful_flirt: [
    "light_tease",
    "use_pet_name",
    "mirror_emotion",
    "offer_presence",
    "ask_one_question",
  ],
  calm_boundary: [
    "set_soft_boundary",
    "offer_presence",
    "validate_feeling",
  ],
  relationship_repair: [
    "repair_misunderstanding",
    "validate_feeling",
    "ask_one_question",
    "offer_presence",
  ],
  gentle_clarify: [
    "validate_feeling",
    "ask_one_question",
    "offer_presence",
  ],
  practical_support: [
    "validate_feeling",
    "give_one_suggestion",
    "give_two_suggestions",
    "ask_one_question",
  ],
  roleplay_flow: [
    "continue_roleplay",
    "light_tease",
    "mirror_emotion",
    "offer_presence",
  ],
  memory_ack: ["acknowledge_memory", "offer_presence"],
};

const POLICY_DISPLAY_NAME: Record<ReplyPolicyName, string> = {
  quiet_presence: "安静陪伴",
  warm_companion: "温暖陪伴",
  deep_empathy: "深度共情",
  playful_flirt: "轻暧昧",
  calm_boundary: "温和边界",
  relationship_repair: "关系修复",
  gentle_clarify: "轻澄清",
  practical_support: "实用建议",
  roleplay_flow: "角色沉浸",
  memory_ack: "记忆确认",
};

const OPENING_DISPLAY_NAME: Record<ReplyPolicy["openingMove"], string> = {
  acknowledge: "先接住对方",
  comfort: "先安抚",
  mirror: "先映照情绪",
  apologize: "先道歉",
  play: "先俏皮接住",
  answer: "先直接回应",
  clarify: "先轻轻确认",
  set_boundary: "先稳住边界",
};

export const FALLBACK_REPLY_POLICY: ReplyPolicy = ReplyPolicySchema.parse({
  policy: "gentle_clarify",
  sentenceBudget: { min: 2, max: 3 },
  rhythm: "soft",
  openingMove: "acknowledge",
  allowedMoves: ["validate_feeling", "ask_one_question", "offer_presence"],
  forbiddenMoves: [
    ...ALWAYS_FORBIDDEN,
    "over_explain",
    "multiple_questions",
    "premature_advice",
    "intense_flirt",
    "break_immersion",
  ],
  questionLimit: 1,
  adviceLimit: 0,
  intimacyLevel: "low",
  styleGuidance:
    "先温和承接，再用一个轻问题确认用户想继续聊什么。句子 2～3 句；问句最多 1 个；不要给建议。不要暴露内部标签，也不要打破角色沉浸。",
});

function uniqueMoves<T extends string>(moves: T[], limit: number): T[] {
  return Array.from(new Set(moves)).slice(0, limit);
}

function clampSentenceBudget(
  budget: SentenceBudget,
  responseLength: EmotionRoute["responseLength"],
): SentenceBudget {
  const max = Math.min(budget.max, RESPONSE_LENGTH_SENTENCE_CAP[responseLength]);
  const min = Math.min(budget.min, max);

  return { min, max };
}

function mapEmotionRouteToPolicy(
  route: EmotionRoute["route"],
): ReplyPolicyName {
  switch (route) {
    case "quiet_presence":
      return "quiet_presence";
    case "deep_comfort":
      return "deep_empathy";
    case "playful_flirt":
      return "playful_flirt";
    case "calm_deescalation":
      return "calm_boundary";
    case "relationship_repair":
      return "relationship_repair";
    case "gentle_clarification":
      return "gentle_clarify";
    case "practical_support":
      return "practical_support";
    case "warm_comfort":
    case "light_companion":
      return "warm_companion";
  }
}

function resolvePolicyName(params: {
  intent: ConversationIntent | null;
  emotionRoute: EmotionRoute;
}): ReplyPolicyName {
  const fromRoute = mapEmotionRouteToPolicy(params.emotionRoute.route);

  if (fromRoute === "relationship_repair" || fromRoute === "calm_boundary") {
    return fromRoute;
  }

  const intent = params.intent?.primary;

  if (intent === "roleplay") {
    return "roleplay_flow";
  }

  if (intent === "memory_update" || intent === "preference_setting") {
    return "memory_ack";
  }

  return fromRoute;
}

function resolveQuestionLimit(params: {
  policy: ReplyPolicyName;
  shouldAskQuestion: boolean;
}): number {
  if (!params.shouldAskQuestion) {
    return 0;
  }

  if (
    params.policy === "quiet_presence" ||
    params.policy === "memory_ack" ||
    params.policy === "calm_boundary" ||
    params.policy === "roleplay_flow"
  ) {
    return 0;
  }

  return 1;
}

function resolveAdviceLimit(params: {
  policy: ReplyPolicyName;
  shouldGiveAdvice: boolean;
  responseLength: EmotionRoute["responseLength"];
}): number {
  if (!params.shouldGiveAdvice) {
    return 0;
  }

  if (params.policy === "practical_support") {
    return params.responseLength === "very_short" ||
      params.responseLength === "short"
      ? 1
      : 2;
  }

  return 1;
}

function resolveIntimacyLevel(params: {
  policy: ReplyPolicyName;
  safety: ConversationSafety;
  relationshipStage: ConversationRelationshipStage | null;
  shouldUsePetName: boolean;
}): ReplyPolicy["intimacyLevel"] {
  if (
    params.safety.boundaryAction !== "continue" ||
    params.policy === "calm_boundary" ||
    params.relationshipStage?.stage === "new_connection" ||
    params.relationshipStage?.stage === "boundary_sensitive" ||
    params.relationshipStage?.stage === "dependency_watch" ||
    params.relationshipStage?.boundaryMode === "firm" ||
    params.relationshipStage?.intimacyPermission === "low"
  ) {
    return "low";
  }

  if (
    params.policy === "playful_flirt" &&
    params.relationshipStage?.intimacyPermission === "high" &&
    params.relationshipStage.stage === "close_bond"
  ) {
    return "high";
  }

  if (
    params.policy === "playful_flirt" ||
    params.shouldUsePetName ||
    params.relationshipStage?.intimacyPermission === "medium" ||
    params.relationshipStage?.intimacyPermission === "high"
  ) {
    return "medium";
  }

  return "low";
}

function resolveOpeningMove(params: {
  policy: ReplyPolicyName;
  emotion: ConversationEmotion | null;
  shouldAskQuestion: boolean;
}): ReplyPolicy["openingMove"] {
  if (params.policy === "warm_companion" && params.emotion?.needsComfort) {
    return "comfort";
  }

  if (params.policy === "deep_empathy" && params.emotion?.needsComfort) {
    return params.emotion.intensity >= 0.75 ? "mirror" : "comfort";
  }

  if (params.policy === "gentle_clarify" && !params.shouldAskQuestion) {
    return "acknowledge";
  }

  return POLICY_OPENING[params.policy];
}

function resolveRhythm(params: {
  policy: ReplyPolicyName;
  emotion: ConversationEmotion | null;
}): ReplyPolicy["rhythm"] {
  if (
    params.policy === "roleplay_flow" &&
    (params.emotion?.primaryEmotion === "playful" ||
      params.emotion?.primaryEmotion === "happy")
  ) {
    return "lively";
  }

  return POLICY_RHYTHM[params.policy];
}

function isRelaxedImmersion(intent: ConversationIntent | null): boolean {
  return intent !== null && RELAXED_IMMERSION_INTENTS.has(intent.primary);
}

function resolveAllowedMoves(params: {
  policy: ReplyPolicyName;
  questionLimit: number;
  adviceLimit: number;
  intimacyLevel: ReplyPolicy["intimacyLevel"];
  shouldUsePetName: boolean;
  shouldMirrorEmotion: boolean;
}): AllowedMove[] {
  let moves = [...POLICY_ALLOWED_MOVES[params.policy]];

  if (params.questionLimit === 0) {
    moves = moves.filter((move) => move !== "ask_one_question");
  }

  if (params.adviceLimit === 0) {
    moves = moves.filter(
      (move) =>
        move !== "give_one_suggestion" && move !== "give_two_suggestions",
    );
  } else if (params.adviceLimit === 1) {
    moves = moves.filter((move) => move !== "give_two_suggestions");
  }

  if (!params.shouldUsePetName || params.intimacyLevel === "low") {
    moves = moves.filter((move) => move !== "use_pet_name");
  }

  if (!params.shouldMirrorEmotion) {
    moves = moves.filter((move) => move !== "mirror_emotion");
  }

  if (params.intimacyLevel === "low") {
    moves = moves.filter((move) => move !== "light_tease");
  }

  return uniqueMoves(moves, 6);
}

function resolveForbiddenMoves(params: {
  policy: ReplyPolicyName;
  questionLimit: number;
  adviceLimit: number;
  intimacyLevel: ReplyPolicy["intimacyLevel"];
  relaxedImmersion: boolean;
}): ForbiddenMove[] {
  const forbidden: ForbiddenMove[] = [...ALWAYS_FORBIDDEN];

  if (params.policy !== "practical_support") {
    forbidden.push("over_explain");
  }

  if (params.questionLimit <= 1) {
    forbidden.push("multiple_questions");
  }

  if (params.adviceLimit === 0) {
    forbidden.push("premature_advice");
  }

  if (
    params.policy !== "playful_flirt" ||
    params.intimacyLevel !== "high"
  ) {
    forbidden.push("intense_flirt");
  }

  if (!params.relaxedImmersion) {
    forbidden.push("break_immersion");
  }

  return uniqueMoves(forbidden, 12);
}

function buildStyleGuidance(params: {
  policy: ReplyPolicyName;
  sentenceBudget: SentenceBudget;
  questionLimit: number;
  adviceLimit: number;
  openingMove: ReplyPolicy["openingMove"];
  rhythm: ReplyPolicy["rhythm"];
  relaxedImmersion: boolean;
  routeGuidance: string;
  relationshipGuidance: string | null;
}): string {
  const sentenceRule = `句子 ${params.sentenceBudget.min}～${params.sentenceBudget.max} 句`;
  const questionRule =
    params.questionLimit === 0
      ? "不要提问"
      : `问句最多 ${params.questionLimit} 个`;
  const adviceRule =
    params.adviceLimit === 0
      ? "不要给建议"
      : `建议最多 ${params.adviceLimit} 条`;

  return [
    `本轮策略：${POLICY_DISPLAY_NAME[params.policy]}。节奏 ${params.rhythm}，${OPENING_DISPLAY_NAME[params.openingMove]}。`,
    `${sentenceRule}；${questionRule}；${adviceRule}。`,
    "不要暴露内部标签、评分、路由名称或分析过程。",
    params.relaxedImmersion
      ? "用户在谈使用体验或设定，可以短暂说明，但仍不要暴露内部标签。"
      : "保持角色沉浸，不要提及自己是 AI、模型或系统。",
    params.routeGuidance,
    params.relationshipGuidance,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

export function buildReplyPolicy(params: {
  safety: ConversationSafety;
  intent: ConversationIntent | null;
  emotion: ConversationEmotion | null;
  emotionRoute: EmotionRoute | null;
  relationshipStage: ConversationRelationshipStage | null;
}): ReplyPolicy {
  if (!params.intent && !params.emotion && !params.emotionRoute) {
    return FALLBACK_REPLY_POLICY;
  }

  const emotionRoute = params.emotionRoute ?? {
    route: "gentle_clarification" as const,
    responseLength: "short" as const,
    shouldAskQuestion: true,
    shouldGiveAdvice: false,
    shouldUsePetName: false,
    shouldMirrorEmotion: false,
    routeGuidance: FALLBACK_REPLY_POLICY.styleGuidance,
  };

  const policy = resolvePolicyName({
    intent: params.intent,
    emotionRoute,
  });
  const sentenceBudget = clampSentenceBudget(
    POLICY_SENTENCE_BUDGET[policy],
    emotionRoute.responseLength,
  );
  const questionLimit = resolveQuestionLimit({
    policy,
    shouldAskQuestion: emotionRoute.shouldAskQuestion,
  });
  const adviceLimit = resolveAdviceLimit({
    policy,
    shouldGiveAdvice: emotionRoute.shouldGiveAdvice,
    responseLength: emotionRoute.responseLength,
  });
  const intimacyLevel = resolveIntimacyLevel({
    policy,
    safety: params.safety,
    relationshipStage: params.relationshipStage,
    shouldUsePetName: emotionRoute.shouldUsePetName,
  });
  const relaxedImmersion = isRelaxedImmersion(params.intent);
  const openingMove = resolveOpeningMove({
    policy,
    emotion: params.emotion,
    shouldAskQuestion: emotionRoute.shouldAskQuestion,
  });
  const rhythm = resolveRhythm({
    policy,
    emotion: params.emotion,
  });

  return ReplyPolicySchema.parse({
    policy,
    sentenceBudget,
    rhythm,
    openingMove,
    allowedMoves: resolveAllowedMoves({
      policy,
      questionLimit,
      adviceLimit,
      intimacyLevel,
      shouldUsePetName: emotionRoute.shouldUsePetName,
      shouldMirrorEmotion: emotionRoute.shouldMirrorEmotion,
    }),
    forbiddenMoves: resolveForbiddenMoves({
      policy,
      questionLimit,
      adviceLimit,
      intimacyLevel,
      relaxedImmersion,
    }),
    questionLimit,
    adviceLimit,
    intimacyLevel,
    styleGuidance: buildStyleGuidance({
      policy,
      sentenceBudget,
      questionLimit,
      adviceLimit,
      openingMove,
      rhythm,
      relaxedImmersion,
      routeGuidance: emotionRoute.routeGuidance,
      relationshipGuidance:
        params.relationshipStage?.relationshipGuidance ?? null,
    }),
  });
}

export function buildReplyPolicyNode(
  state: typeof ConversationAnalysisState.State,
) {
  return {
    replyPolicy: buildReplyPolicy({
      safety: state.safety,
      intent: state.intent,
      emotion: state.emotion,
      emotionRoute: state.emotionRoute,
      relationshipStage: state.relationshipStage,
    }),
  };
}

export function getReplyPolicySystemInstruction(
  replyPolicy: ReplyPolicy | null,
): string {
  if (!replyPolicy) {
    return "";
  }

  const questionRule =
    replyPolicy.questionLimit === 0
      ? "不要提问"
      : `问句最多 ${replyPolicy.questionLimit} 个`;
  const adviceRule =
    replyPolicy.adviceLimit === 0
      ? "不要给建议"
      : `建议最多 ${replyPolicy.adviceLimit} 条`;
  const immersionRule = replyPolicy.forbiddenMoves.includes("break_immersion")
    ? "保持角色沉浸，不要提及自己是 AI、模型或系统。"
    : "可以短暂说明使用方式，但仍不要暴露内部标签。";

  return [
    "本轮回复合同：",
    `- 策略：${POLICY_DISPLAY_NAME[replyPolicy.policy]}；节奏 ${replyPolicy.rhythm}；${OPENING_DISPLAY_NAME[replyPolicy.openingMove]}`,
    `- 句子：${replyPolicy.sentenceBudget.min}～${replyPolicy.sentenceBudget.max} 句`,
    `- ${questionRule}；${adviceRule}`,
    "- 禁止暴露内部标签、评分或路由名称。",
    `- ${immersionRule}`,
    `- 回复指导：${replyPolicy.styleGuidance}`,
    "请把以上合同作为隐性策略执行，不要向用户复述规则或标签。",
  ].join("\n");
}
