import { getSafetySystemInstruction } from "@/chat/service/turn-planning/evaluate-conversation-safety";
import { getIntentSystemInstruction } from "@/chat/service/turn-planning/nodes/detect-intent";
import { getEmotionSystemInstruction } from "@/chat/service/turn-planning/nodes/route-emotion";
import { getReplyPolicySystemInstruction } from "@/chat/service/turn-planning/policies/reply-policy";
import type {
  BuildChatMessagesInput,
  ChatCompletionMessage,
} from "@/chat/types";

export function buildChatMessages(
  input: BuildChatMessagesInput,
): ChatCompletionMessage[] {
  const {
    agent,
    conversation,
    memories,
    history,
    currentUserContent,
    intent,
    emotion,
    emotionRoute,
    replyPolicy,
    safety,
  } = input;
  const messages: ChatCompletionMessage[] = [
    {
      role: "system",
      content: [
        agent.defaultPrompt || "你是 AI Agent Web 控制台里的聊天陪伴助手。",
        `你的名字是：${agent.name}`,
        agent.headline ? `角色定位：${agent.headline}` : "",
        agent.description ? `角色描述：${agent.description}` : "",
        agent.storyBackground ? `故事背景：${agent.storyBackground}` : "",
        agent.personalityPrompt ? `性格设定：${agent.personalityPrompt}` : "",
        agent.tonePrompt ? `表达语气：${agent.tonePrompt}` : "",
        agent.guardrailsPrompt ? `行为边界：${agent.guardrailsPrompt}` : "",
        getSafetySystemInstruction(safety),
        getIntentSystemInstruction(intent),
        getEmotionSystemInstruction(emotion, emotionRoute),
        getReplyPolicySystemInstruction(replyPolicy),
        memories.length > 0
          ? [
              "以下是用户与该 Agent 的长期记忆，请优先尊重：",
              ...memories.map(
                (memory) =>
                  `- [${memory.type} / 重要度 ${memory.importance}] ${memory.content}`,
              ),
            ].join("\n")
          : "",
        conversation.summary ? `此前对话摘要：${conversation.summary}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  for (const message of history) {
    messages.push(message);
  }

  messages.push({ role: "user", content: currentUserContent });
  return messages;
}
