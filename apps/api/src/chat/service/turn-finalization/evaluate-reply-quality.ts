import {
  ReplyQualityGuardSchema,
  type ReplyPolicy,
  type ReplyQualityGuard,
} from "@repo/contracts/chat";

import { REPLY_POLICY_VERSION } from "@/chat/service/turn-planning/policies/reply-policy";

export const REPLY_QUALITY_GUARD_VERSION = "reply-quality-v1";

type ReplyViolation = ReplyQualityGuard["violations"][number];
type ViolationCode = ReplyViolation["code"];
type ViolationSeverity = ReplyViolation["severity"];
type ForbiddenMove = ReplyPolicy["forbiddenMoves"][number];

const FALLBACK_REPLY_QUALITY: ReplyQualityGuard = {
  status: "pass",
  score: 1,
  sentenceCount: 0,
  questionCount: 0,
  adviceCount: 0,
  violations: [],
};

const SENTENCE_ENDINGS = new Set(["。", "！", "？", "!", "?"]);

const INTERNAL_LABEL_PATTERN =
  /\b(?:light_companion|warm_comfort|deep_comfort|playful_flirt|calm_deescalation|relationship_repair|gentle_clarification|practical_support|quiet_presence|warm_companion|deep_empathy|calm_boundary|gentle_clarify|roleplay_flow|memory_ack|safetyLevel|boundaryAction|emotionRoute|replyPolicy|replyExpectation|allowMemoryExtraction|crisis_support|soft_boundary)\b|回复(?:合同|路由|策略)|情绪路由|意图(?:判断|分类)|安全等级|内部标签/;

const IMMERSION_BREAK_PATTERN =
  /作为(?:一个)?(?:AI|Ai|ai|人工智能|语言模型|大模型|聊天机器人)|我是(?:一个)?(?:AI|人工智能|语言模型|大模型|聊天机器人)|我无法真正|根据系统提示|我只是(?:一个)?(?:程序|模型|AI|人工智能)|language model|as an AI/i;

const ADVICE_PATTERN =
  /建议你|我建议|你可以试试|你可以先|你应该|你应当|不妨|试着|为什么不|最好先/;

const QUESTION_HINT_PATTERN =
  /[？?]|[吗呢嘛][。！!]?$|^(?:怎么了|为什么|怎么会)|要不要|好不好|是不是|对不对/;

const LECTURE_PATTERN =
  /你要学会|其实你应该明白|从心理学角度|说到底是你|你需要明白|本质上你/;

const OVER_EXPLAIN_SEQUENCE_PATTERN = /首先[\s\S]{0,80}其次/;
const OVER_EXPLAIN_CAUSAL_PATTERN = /因为|所以|因此|换句话说|也就是说|具体来说/g;

const INTENSE_FLIRT_PATTERN =
  /想你想疯|亲你|吻你|今晚想|上床|脱掉|摸你/;

const DIAGNOSIS_PATTERN =
  /抑郁症|焦虑症|双相|PTSD|ptsd|你这就是|确诊为|你有严重的/;

const AGGRESSIVE_SIDING_PATTERN =
  /他就是渣|她就是渣|这种人|你该分手|全是他的错|全是她的错|渣男|渣女/;

const PRESSURE_PATTERN =
  /你必须|现在就告诉我|答应我|不许不说|赶紧说/;

const REAL_WORLD_PROMISE_PATTERN =
  /我去找你|我们见面|我打电话给你|现实里保护你|我过来陪你|我马上过来/;

const SEVERITY_WEIGHT: Record<ViolationSeverity, number> = {
  low: 0.08,
  medium: 0.18,
  high: 0.35,
};

const SEVERITY_RANK: Record<ViolationSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function clipEvidence(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}

function firstMatch(text: string, pattern: RegExp): string | null {
  const flags = pattern.flags.replace("g", "");
  const match = new RegExp(pattern.source, flags).exec(text);
  return match?.[0] ? clipEvidence(match[0]) : null;
}

function isCountableSentence(sentence: string): boolean {
  const compact = sentence.replace(/[\s*（）()【】[\]…~～，,、]/g, "");
  return compact.length > 0 && !/^\p{Extended_Pictographic}+$/u.test(compact);
}

function splitSentences(text: string): string[] {
  const normalized = text
    .normalize("NFKC")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/`+/g, "")
    .replace(/[.]{3,}|…+/g, "，")
    .replace(/\r\n?/g, "\n")
    .trim();

  if (!normalized) {
    return [];
  }

  const sentences: string[] = [];
  let current = "";

  for (const char of normalized) {
    current += char;
    if (SENTENCE_ENDINGS.has(char) || char === "\n") {
      const sentence = current.trim();
      if (sentence && isCountableSentence(sentence)) {
        sentences.push(sentence);
      }
      current = "";
    }
  }

  const trailing = current.trim();
  if (trailing && isCountableSentence(trailing)) {
    sentences.push(trailing);
  }

  return sentences;
}

function isQuestionSentence(sentence: string): boolean {
  return QUESTION_HINT_PATTERN.test(sentence.trim());
}

function overflowSeverity(overflow: number): ViolationSeverity {
  if (overflow >= 3) {
    return "high";
  }
  if (overflow >= 2) {
    return "medium";
  }
  return "low";
}

function questionOverflowSeverity(
  questionLimit: number,
  questionCount: number,
): ViolationSeverity {
  if (questionLimit === 0) {
    return questionCount >= 2 ? "high" : "medium";
  }

  return overflowSeverity(questionCount - questionLimit);
}

function pushViolation(
  violations: ReplyViolation[],
  code: ViolationCode,
  severity: ViolationSeverity,
  evidence: string,
): void {
  violations.push({
    code,
    severity,
    evidence: clipEvidence(evidence),
  });
}

function hasForbiddenMove(
  policy: ReplyPolicy,
  move: ForbiddenMove,
): boolean {
  return policy.forbiddenMoves.includes(move);
}

function collectCountViolations(params: {
  policy: ReplyPolicy;
  sentences: string[];
  sentenceCount: number;
  questionCount: number;
  adviceCount: number;
}): ReplyViolation[] {
  const violations: ReplyViolation[] = [];
  const { policy, sentences, sentenceCount, questionCount, adviceCount } =
    params;

  if (sentenceCount > policy.sentenceBudget.max) {
    pushViolation(
      violations,
      "too_many_sentences",
      overflowSeverity(sentenceCount - policy.sentenceBudget.max),
      sentences.slice(policy.sentenceBudget.max).join(""),
    );
  }

  if (questionCount > policy.questionLimit) {
    pushViolation(
      violations,
      "too_many_questions",
      questionOverflowSeverity(policy.questionLimit, questionCount),
      sentences.filter(isQuestionSentence).join(""),
    );
  }

  if (adviceCount > policy.adviceLimit) {
    const adviceSentences = sentences.filter((sentence) =>
      ADVICE_PATTERN.test(sentence),
    );
    if (policy.adviceLimit === 0) {
      pushViolation(
        violations,
        "forbidden_premature_advice",
        adviceCount >= 2 ? "high" : "medium",
        adviceSentences.join(""),
      );
    } else {
      pushViolation(
        violations,
        "too_many_suggestions",
        overflowSeverity(adviceCount - policy.adviceLimit),
        adviceSentences.join(""),
      );
    }
  }

  return violations;
}

function collectPatternViolations(
  text: string,
  policy: ReplyPolicy,
): ReplyViolation[] {
  const violations: ReplyViolation[] = [];
  const checks: Array<{
    move: ForbiddenMove | null;
    code: ViolationCode;
    severity: ViolationSeverity;
    evidence: string | null;
  }> = [
    {
      move: "expose_internal_labels",
      code: "internal_label_leak",
      severity: "high",
      evidence: firstMatch(text, INTERNAL_LABEL_PATTERN),
    },
    {
      move: "break_immersion",
      code: "breaks_immersion",
      severity: "medium",
      evidence: firstMatch(text, IMMERSION_BREAK_PATTERN),
    },
    {
      move: "lecture",
      code: "forbidden_lecture",
      severity: "medium",
      evidence: firstMatch(text, LECTURE_PATTERN),
    },
    {
      move: "intense_flirt",
      code: "forbidden_intense_flirt",
      severity: "high",
      evidence: firstMatch(text, INTENSE_FLIRT_PATTERN),
    },
    {
      move: "diagnose_user",
      code: "forbidden_diagnosis",
      severity: "high",
      evidence: firstMatch(text, DIAGNOSIS_PATTERN),
    },
    {
      move: "take_sides_aggressively",
      code: "forbidden_aggressive_siding",
      severity: "medium",
      evidence: firstMatch(text, AGGRESSIVE_SIDING_PATTERN),
    },
    {
      move: "pressure_to_disclose",
      code: "forbidden_pressure",
      severity: "medium",
      evidence: firstMatch(text, PRESSURE_PATTERN),
    },
    {
      move: "promise_real_world_action",
      code: "forbidden_real_world_promise",
      severity: "high",
      evidence: firstMatch(text, REAL_WORLD_PROMISE_PATTERN),
    },
  ];

  for (const check of checks) {
    if (check.move && !hasForbiddenMove(policy, check.move)) {
      continue;
    }
    if (check.evidence) {
      pushViolation(violations, check.code, check.severity, check.evidence);
    }
  }

  if (hasForbiddenMove(policy, "over_explain")) {
    const sequence = firstMatch(text, OVER_EXPLAIN_SEQUENCE_PATTERN);
    const causalCount = text.match(OVER_EXPLAIN_CAUSAL_PATTERN)?.length ?? 0;
    if (sequence || causalCount >= 3) {
      pushViolation(
        violations,
        "forbidden_over_explain",
        "low",
        sequence ?? "因为/所以/因此 过多",
      );
    }
  }

  return violations;
}

function scoreViolations(violations: ReplyViolation[]): {
  score: number;
  status: ReplyQualityGuard["status"];
} {
  const ranked = [...violations].sort(
    (left, right) => SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity],
  );
  const score = Math.max(
    0,
    Math.min(
      1,
      1 -
        ranked.reduce(
          (total, violation) => total + SEVERITY_WEIGHT[violation.severity],
          0,
        ),
    ),
  );
  const hasHigh = ranked.some((violation) => violation.severity === "high");
  const hasMedium = ranked.some((violation) => violation.severity === "medium");

  let status: ReplyQualityGuard["status"] = "pass";
  if (hasHigh || score < 0.5) {
    status = "fail";
  } else if (hasMedium || score < 0.8) {
    status = "warn";
  }

  return { score: Number(score.toFixed(2)), status };
}

export function evaluateReplyQuality(params: {
  text: string;
  policy: ReplyPolicy;
}): ReplyQualityGuard {
  try {
    const sentences = splitSentences(params.text);
    const sentenceCount = sentences.length;
    const questionCount = sentences.filter(isQuestionSentence).length;
    const adviceCount = sentences.filter((sentence) =>
      ADVICE_PATTERN.test(sentence),
    ).length;

    const violations = [
      ...collectCountViolations({
        policy: params.policy,
        sentences,
        sentenceCount,
        questionCount,
        adviceCount,
      }),
      ...collectPatternViolations(params.text, params.policy),
    ]
      .sort(
        (left, right) =>
          SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity],
      )
      .slice(0, 12);

    const { score, status } = scoreViolations(violations);

    return ReplyQualityGuardSchema.parse({
      status,
      score,
      sentenceCount,
      questionCount,
      adviceCount,
      violations,
    });
  } catch (error) {
    console.warn("Reply quality evaluation failed; using pass fallback", error);
    return FALLBACK_REPLY_QUALITY;
  }
}

export function serializeReplyQualityMetadata(input: {
  replyPolicy: ReplyPolicy;
  replyQuality: ReplyQualityGuard;
}): string {
  return JSON.stringify({
    replyQualityGuardVersion: REPLY_QUALITY_GUARD_VERSION,
    replyPolicyVersion: REPLY_POLICY_VERSION,
    replyPolicy: input.replyPolicy,
    replyQuality: input.replyQuality,
  });
}
