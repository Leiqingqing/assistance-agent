import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { AppError, BizCode } from "@repo/contracts/common";
import {
  SendAgentGroupChatMessageResponseSchema,
  type SendAgentGroupChatMessageRequest,
} from "@repo/contracts/group-chat";
import type { Context } from "hono";
import { uuidv7 } from "uuidv7";
import {
  getApiEnv,
  type ApiEnvBindings,
  type ParsedApiEnvBindings,
} from "/env";
import { createChatModel } from "@/ai/chat-model";
import type { AuthVariables } from "@/auth/require-user";
import { getDb } from "@/db/client";
import { GROUP_CHAT_MESSAGE_PAGE_SIZE } from "../constants";
import {
  groupChatHasNoActiveAgentsError,
  groupChatNotFoundError,
} from "../errors";
import {
  findOwnedGroupChatRecord,
  listActiveGroupChatAgents,
  listGroupChatMemberRecords,
  listGroupChatMessageRecords,
  saveGroupChatTurn,
} from "../repository";

type ActiveGroupChatAgent = Awaited<
  ReturnType<typeof listActiveGroupChatAgents>
>[number];

function extractText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join("\n");
  }

  if (typeof value !== "object" || value === null) {
    return "";
  }

  const record = value as Record<string, unknown>;

  if (typeof record.text === "string") {
    return record.text;
  }

  return extractText(record.content);
}

function buildSystemPrompt(
  agent: ActiveGroupChatAgent,
  agents: ActiveGroupChatAgent[],
  summary: string | null,
) {
  return [
    agent.defaultPrompt || "你是群聊中的 AI 陪伴助手。",
    `你的名字是：${agent.name}`,
    `当前群聊成员：${agents.map((member) => member.name).join("、")}`,
    "当前由你代表群聊中的 Agent 回复用户。不要代替其他 Agent 发言。",
    agent.headline ? `角色定位：${agent.headline}` : "",
    agent.description ? `角色描述：${agent.description}` : "",
    agent.storyBackground ? `故事背景：${agent.storyBackground}` : "",
    agent.personalityPrompt ? `性格设定：${agent.personalityPrompt}` : "",
    agent.tonePrompt ? `表达语气：${agent.tonePrompt}` : "",
    agent.guardrailsPrompt ? `行为边界：${agent.guardrailsPrompt}` : "",
    summary ? `此前群聊摘要：${summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildModelMessages(
  agent: ActiveGroupChatAgent,
  agents: ActiveGroupChatAgent[],
  summary: string | null,
  history: Awaited<ReturnType<typeof listGroupChatMessageRecords>>,
  userContent: string,
): BaseMessage[] {
  const messages: BaseMessage[] = [
    new SystemMessage(buildSystemPrompt(agent, agents, summary)),
  ];

  for (const message of history) {
    if (message.senderType === "user") {
      messages.push(new HumanMessage(message.content));
    } else if (message.senderType === "agent") {
      messages.push(
        new AIMessage(
          message.agentName
            ? `${message.agentName}：${message.content}`
            : message.content,
        ),
      );
    } else {
      messages.push(new SystemMessage(message.content));
    }
  }

  messages.push(new HumanMessage(userContent));
  return messages;
}

function requireAiApiKey(env: ParsedApiEnvBindings) {
  if (!env.DEEPSEEK_API_KEY?.trim()) {
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "DeepSeek API key is not configured",
      500,
      { reason: "DEEPSEEK_API_KEY is missing" },
    );
  }
}

export async function handleSendGroupChatMessage(
  context: Context<{
    Bindings: ApiEnvBindings;
    Variables: AuthVariables;
  }>,
  request: SendAgentGroupChatMessageRequest,
) {
  const env = getApiEnv(context.env);
  requireAiApiKey(env);

  const db = getDb(context.env.DB);
  const userId = context.get("userId");
  const groupChat = await findOwnedGroupChatRecord(
    db,
    userId,
    request.groupChatId,
  );

  if (groupChat === null) {
    throw groupChatNotFoundError();
  }

  const [agents, members, recentRecords] = await Promise.all([
    listActiveGroupChatAgents(db, userId, groupChat.id),
    listGroupChatMemberRecords(db, userId, [groupChat.id]),
    listGroupChatMessageRecords(db, {
      groupChatId: groupChat.id,
      userId,
      limit: GROUP_CHAT_MESSAGE_PAGE_SIZE,
    }),
  ]);
  const replyingAgent = agents[0];

  if (replyingAgent === undefined) {
    throw groupChatHasNoActiveAgentsError();
  }

  const userMessageId = uuidv7();
  const userMessageAtMs = Date.now();
  const turnIndex = (recentRecords[0]?.turnIndex ?? -1) + 1;
  const modelMessages = buildModelMessages(
    replyingAgent,
    agents,
    groupChat.summary,
    [...recentRecords].reverse(),
    request.message,
  );
  const model = createChatModel(env, {
    temperature: 0.7,
    timeout: 30_000,
    maxRetries: 1,
  });
  const result = await model.invoke(modelMessages);
  const agentContent = extractText(result.content).trim();

  if (!agentContent) {
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "Agent returned an empty response",
      500,
    );
  }

  const agentMessageId = uuidv7();
  const agentMessageAtMs = Math.max(Date.now(), userMessageAtMs + 1);

  await saveGroupChatTurn(db, {
    groupChatId: groupChat.id,
    userId,
    agentId: replyingAgent.id,
    userMessageId,
    agentMessageId,
    userContent: request.message,
    agentContent,
    turnIndex,
    userMessageAtMs,
    agentMessageAtMs,
  });

  const userMessage = {
    id: userMessageId,
    groupChatId: groupChat.id,
    senderType: "user",
    agentId: null,
    agentName: null,
    agentImageKey: null,
    content: request.message,
    status: "completed",
    turnIndex,
    createdAtMs: userMessageAtMs,
  };
  const agentMessage = {
    id: agentMessageId,
    groupChatId: groupChat.id,
    senderType: "agent",
    agentId: replyingAgent.id,
    agentName: replyingAgent.name,
    agentImageKey: replyingAgent.imageKey,
    content: agentContent,
    status: "completed",
    turnIndex,
    createdAtMs: agentMessageAtMs,
  };

  return SendAgentGroupChatMessageResponseSchema.parse({
    userMessage,
    agentMessages: [agentMessage],
    groupChat: {
      id: groupChat.id,
      title: groupChat.title,
      summary: groupChat.summary,
      messageCount: groupChat.messageCount + 2,
      lastMessageAtMs: agentMessageAtMs,
      createdAtMs: groupChat.createdAtMs,
      updatedAtMs: agentMessageAtMs,
      members,
      latestMessage: agentMessage,
    },
  });
}
