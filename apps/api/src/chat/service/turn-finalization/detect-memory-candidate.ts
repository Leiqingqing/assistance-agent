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
import {
  AgentMemoryCandidateSchema,
  type AgentMemoryCandidate,
} from "@/chat/schema/memory";
import type { ChatHistoryMessage, ChatMemory } from "@/chat/types";

type DetectMemoryCandidateInput = {
  userText: string;
  activeMemories: ChatMemory[];
  recentMessages: ChatHistoryMessage[];
};

const memoryCandidatePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "你是 AI 电子伴侣聊天产品的长期记忆候选判断器。",
      "你的任务不是抽取记忆，也不是回复用户，而是判断本轮对话是否值得进入长期记忆抽取流程。",
      "只有稳定、未来多轮对话仍然有用的信息才应该进入抽取：用户偏好、边界禁忌、关系目标、对 Agent 的互动风格要求、重要事实、稳定身份资料。",
      "以下内容通常不要进入抽取：普通寒暄、一次性情绪、临时状态、纯粹感谢、表情语气、Agent 自己编造的信息、已经存在的重复记忆、危险或不应保存的信息。",
      "如果用户明确要求“记住/以后/不要/别再/我喜欢/我不喜欢/我的习惯/我的边界”，通常应判断为候选。",
      "如果只是用户当下难过、生气、累，除非它表达了稳定偏好、重要事件或长期边界，否则不要进入长期记忆。",
      "输出必须是可被 LangChain 结构化解析的 JSON 对象。",
      "判断规则：",
      "- 只能提取用户明确表达的事实，不得补充、推断或改写出新的事实。",
      "- candidateFacts 最多三个，每条只写一个简洁、自足的用户事实，避免保留无关聊天上下文。",
      "- shouldExtract=true 时，category 必须属于六个适合类别，stability 必须是 stable 或 likely_stable，candidateFacts 必须非空。",
      "- 信息临时、含糊、重复、不安全或置信度不足时，shouldExtract=false，candidateFacts 返回空数组。",
      "- importance 使用 0-5：普通偏好 3，明确边界或关系目标 4，关键长期事实 4-5。",
      "- 必须严格返回符合指定 schema 的 JSON，不得增加字段、返回 Markdown 或解释。",
      "",
      "category 可选值：preference | boundary | relationship_goal | conversation_style | important_fact | identity_profile | temporary_emotion | small_talk | assistant_generated | duplicate | unsafe | unclear",
      "stability 可选值：stable | likely_stable | temporary | unclear",
      "",
      "返回格式示例：",
      `{{`,
      `  "shouldExtract": true,`,
      `  "confidence": 0.92,`,
      `  "category": "conversation_style",`,
      `  "stability": "stable",`,
      `  "importance": 4,`,
      `  "reason": "用户明确提出长期适用的回复风格偏好。",`,
      `  "candidateFacts": ["用户希望回复轻松一点，并且少讲道理。"]`,
      `}}`,
    ].join("\n"),
  ],
  [
    "human",
    [
      "已有长期记忆：",
      "{activeMemories}",
      "",
      "最近对话（仅用于确认指代和信息来源）：",
      "{recentMessages}",
      "",
      "本轮用户输入：",
      "{userText}",
    ].join("\n"),
  ],
]);

const MemoryCandidateModelOutputSchema =
  AgentMemoryCandidateSchema.partial().extend({
    candidateFacts: z
      .union([
        z.array(z.string().trim().min(1).max(120)).max(3),
        z.string().trim().min(1).max(120),
      ])
      .optional(),
  });

type MemoryCandidateModelOutput = z.infer<
  typeof MemoryCandidateModelOutputSchema
>;

const REJECTED_MEMORY_CANDIDATE: AgentMemoryCandidate = {
  shouldExtract: false,
  confidence: 0,
  category: "unclear",
  stability: "unclear",
  importance: 0,
  reason: "未发现明确且稳定的长期记忆候选。",
  candidateFacts: [],
};

const ACCEPTED_CATEGORIES = new Set<AgentMemoryCandidate["category"]>([
  "preference",
  "boundary",
  "relationship_goal",
  "conversation_style",
  "important_fact",
  "identity_profile",
]);

const SMALL_TALK_PATTERN =
  /^(?:好(?:的)?|嗯+|哦+|哈+|哈哈+|嘿+|嗨+|早安|早上好|晚安|谢谢(?:你)?|多谢|你真好|拜拜|再见)[呀啊哦呢嘛吧～~!！。,.，\s]*$/i;
const UNSAFE_MEMORY_PATTERN =
  /(?:密码|口令|验证码|api[\s_-]*key|access[\s_-]*token|secret)\s*(?:是|为|[:：=])?\s*[a-z0-9_./+=-]{4,}|\b(?:sk|pk)-[a-z0-9_-]{12,}\b|\b\d{17}[\dXx]\b|\b\d{16,19}\b|\b1[3-9]\d{9}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i;
const ASSISTANT_ATTRIBUTION_PATTERN =
  /^(?:你|Agent)(?:刚才|之前|上次)?(?:说|觉得|认为|猜|推测)/i;
const TEMPORARY_EMOTION_PATTERN =
  /(?:今天|今晚|刚刚|刚才|现在|此刻|这会儿|有点|突然).{0,12}(?:烦|困|累|难过|伤心|焦虑|生气|开心|紧张|委屈|无聊)/;
const TEMPORARY_STATE_PATTERN =
  /(?:刚|刚刚|刚才|现在|正在|这会儿|马上).{0,16}(?:吃|喝|走|路上|开车|坐车|上班|下班|睡|洗澡|忙|到家)/;
const CONVERSATION_STYLE_PATTERN =
  /(?:回复|说话|聊天|语气|风格|回答).{0,12}(?:轻松|简短|短一点|温柔|直接|少讲道理|别讲道理|少追问|不要追问|别追问)|(?:不要|别|少).{0,8}(?:连续)?追问/;
const BOUNDARY_PATTERN =
  /(?:不要|别|不许|请勿).{0,16}(?:叫我|称呼我|回复我|说教|开玩笑|提起|聊|问)|(?:不舒服|不想聊|不愿意聊|不接受).{0,12}(?:话题|称呼|回复|方式)?/;
const RELATIONSHIP_GOAL_PATTERN =
  /(?:希望|想让|想要).{0,8}(?:你|Agent).{0,16}(?:陪|陪伴|支持|倾听|督促|关系)|(?:我们的关系|和你的关系).{0,16}(?:推进|保持|发展)/i;
const PREFERENCE_PATTERN =
  /(?:我|本人).{0,6}(?:喜欢|不喜欢|偏爱|讨厌|热爱|最爱|习惯)|(?:我的偏好|我的爱好|我通常|我一直)/;
const IMPORTANT_FACT_PATTERN =
  /(?:我的)?生日|(?:我|本人).{0,8}(?:住在|来自|搬到|定居|计划|打算|目标是)|(?:我的|我).{0,8}(?:家人|父母|孩子|伴侣|丈夫|妻子|男朋友|女朋友)/;
const IDENTITY_PROFILE_PATTERN =
  /(?:我|本人).{0,8}(?:是|做|从事|学习|读|专业是).{0,16}(?:工程师|程序员|设计师|教师|老师|医生|学生|研究生|本科|专业|行业|工作)|(?:我的职业|我的专业|我的研究方向|我的长期兴趣)/;
const EXPLICIT_MEMORY_PATTERN = /(?:请)?(?:记住|记得).{0,24}(?:我|我的)/;

function normalizeForComparison(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/^(?:用户|我)(?:明确)?/, "")
    .replace(/[\s，。！？、,.!?；;：:"“”'‘’（）()[\]{}]/g, "");
}

function isDuplicateFact(fact: string, memories: ChatMemory[]): boolean {
  const normalizedFact = normalizeForComparison(fact);

  if (!normalizedFact) {
    return false;
  }

  return memories.some((memory) => {
    const normalizedMemory = normalizeForComparison(memory.content);
    return (
      normalizedMemory === normalizedFact ||
      (Math.min(normalizedMemory.length, normalizedFact.length) >= 8 &&
        (normalizedMemory.includes(normalizedFact) ||
          normalizedFact.includes(normalizedMemory)))
    );
  });
}

function buildRegexFallback(
  userText: string,
  activeMemories: ChatMemory[],
): AgentMemoryCandidate {
  const content = userText.normalize("NFKC").replace(/\s+/g, " ").trim();

  if (!content) {
    return REJECTED_MEMORY_CANDIDATE;
  }

  if (UNSAFE_MEMORY_PATTERN.test(content)) {
    return {
      ...REJECTED_MEMORY_CANDIDATE,
      confidence: 0.95,
      category: "unsafe",
      reason: "正则兜底检测到疑似敏感隐私或凭证。",
    };
  }

  if (SMALL_TALK_PATTERN.test(content)) {
    return {
      ...REJECTED_MEMORY_CANDIDATE,
      confidence: 0.9,
      category: "small_talk",
      stability: "temporary",
      reason: "正则兜底判断为普通寒暄或纯感谢。",
    };
  }

  if (ASSISTANT_ATTRIBUTION_PATTERN.test(content)) {
    return {
      ...REJECTED_MEMORY_CANDIDATE,
      confidence: 0.8,
      category: "assistant_generated",
      reason: "正则兜底判断该信息来自 Agent 的说法而非用户自述。",
    };
  }

  if (
    TEMPORARY_EMOTION_PATTERN.test(content) ||
    TEMPORARY_STATE_PATTERN.test(content)
  ) {
    return {
      ...REJECTED_MEMORY_CANDIDATE,
      confidence: 0.8,
      category: "temporary_emotion",
      stability: "temporary",
      reason: "正则兜底判断为一次性情绪或临时状态。",
    };
  }

  const matchedCategory: AgentMemoryCandidate["category"] | null =
    CONVERSATION_STYLE_PATTERN.test(content)
      ? "conversation_style"
      : BOUNDARY_PATTERN.test(content)
        ? "boundary"
        : RELATIONSHIP_GOAL_PATTERN.test(content)
          ? "relationship_goal"
          : PREFERENCE_PATTERN.test(content)
            ? "preference"
            : IMPORTANT_FACT_PATTERN.test(content)
              ? "important_fact"
              : IDENTITY_PROFILE_PATTERN.test(content)
                ? "identity_profile"
                : EXPLICIT_MEMORY_PATTERN.test(content)
                  ? "important_fact"
                  : null;

  if (matchedCategory === null) {
    return REJECTED_MEMORY_CANDIDATE;
  }

  if (isDuplicateFact(content, activeMemories)) {
    return {
      ...REJECTED_MEMORY_CANDIDATE,
      confidence: 0.85,
      category: "duplicate",
      reason: "正则兜底发现候选内容与已有长期记忆重复。",
    };
  }

  const importance =
    matchedCategory === "boundary" ||
    matchedCategory === "relationship_goal" ||
    matchedCategory === "important_fact"
      ? 4
      : 3;

  return {
    shouldExtract: true,
    confidence: 0.72,
    category: matchedCategory,
    stability:
      matchedCategory === "important_fact" ||
      matchedCategory === "identity_profile"
        ? "likely_stable"
        : "stable",
    importance,
    reason: "模型筛选不可用，正则兜底识别到明确的长期信息模式。",
    candidateFacts: [content.slice(0, 120)],
  };
}

function repairMemoryCandidateModelOutput(
  output: MemoryCandidateModelOutput,
): AgentMemoryCandidate {
  const rawFacts =
    output.candidateFacts === undefined
      ? []
      : Array.isArray(output.candidateFacts)
        ? output.candidateFacts
        : [output.candidateFacts];
  const candidateFacts = Array.from(
    new Set(rawFacts.map((fact) => fact.trim()).filter(Boolean)),
  ).slice(0, 3);

  return AgentMemoryCandidateSchema.parse({
    ...REJECTED_MEMORY_CANDIDATE,
    ...output,
    confidence: Math.min(1, Math.max(0, output.confidence ?? 0)),
    importance: Math.min(5, Math.max(0, Math.round(output.importance ?? 0))),
    reason:
      output.reason?.trim().slice(0, 300) || REJECTED_MEMORY_CANDIDATE.reason,
    candidateFacts,
  });
}

function normalizeMemoryCandidate(
  candidate: AgentMemoryCandidate,
  activeMemories: ChatMemory[],
): AgentMemoryCandidate {
  const candidateFacts = candidate.candidateFacts
    .map((fact) => fact.trim())
    .filter(Boolean)
    .filter((fact) => !isDuplicateFact(fact, activeMemories))
    .slice(0, 3);
  const hasAcceptedCategory = ACCEPTED_CATEGORIES.has(candidate.category);
  const hasStableInformation =
    candidate.stability === "stable" || candidate.stability === "likely_stable";
  const shouldExtract =
    candidate.shouldExtract &&
    hasAcceptedCategory &&
    hasStableInformation &&
    candidate.confidence >= 0.55 &&
    candidate.importance >= 2 &&
    candidateFacts.length > 0;

  if (!shouldExtract) {
    return AgentMemoryCandidateSchema.parse({
      ...candidate,
      shouldExtract: false,
      candidateFacts: [],
    });
  }

  return AgentMemoryCandidateSchema.parse({
    ...candidate,
    shouldExtract: true,
    candidateFacts,
  });
}

async function invokeMemoryCandidateAnalysis(
  model: ChatOpenAI,
  method: StructuredOutputMethod,
  input: DetectMemoryCandidateInput,
): Promise<AgentMemoryCandidate> {
  const structuredModel = model.withStructuredOutput(
    MemoryCandidateModelOutputSchema,
    {
      method,
      name: "memory_candidate",
    },
  );
  const chain = memoryCandidatePrompt.pipe(structuredModel);
  const output = await chain.invoke({
    activeMemories: formatActiveMemories(input.activeMemories),
    recentMessages: formatRecentMessages(input.recentMessages),
    userText: input.userText,
  });

  return normalizeMemoryCandidate(
    repairMemoryCandidateModelOutput(output),
    input.activeMemories,
  );
}

export async function detectMemoryCandidate(
  env: ParsedApiEnvBindings,
  input: DetectMemoryCandidateInput,
): Promise<AgentMemoryCandidate> {
  const { baseURL, modelName } = getAiModelIdentity(env);
  const model = createChatModel(env);
  return invokeStructuredOutputWithFallback({
    cacheKey: `${baseURL}|${modelName}`,
    operation: "memory candidate",
    invoke: (method) => invokeMemoryCandidateAnalysis(model, method, input),
    fallback: buildRegexFallback(input.userText, input.activeMemories),
  });
}
