import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { AppError, BizCode } from "@repo/contracts/common";
import { InboxChatRequestSchema } from "@repo/contracts/chat";
import type { z } from "zod";
import { getApiEnv, type ApiEnvBindings } from "/env";
import { buildTextStreamResponse } from "@/lib/response";

type InboxChatRequest = z.infer<typeof InboxChatRequestSchema>;

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

function buildMessages(payload: InboxChatRequest): BaseMessage[] {
  const messages: BaseMessage[] = [
    new SystemMessage(
      [
        "你是 AI Agent Web 控制台里的聊天助手。",
        "请基于当前聊天上下文，用简洁、自然的中文回答用户。",
        "如果用户要求起草回复，请直接给出可发送的回复内容。",
      ].join("\n"),
    ),
    new HumanMessage(
      [
        `聊天主题：${payload.mail.subject}`,
        `发送方：${payload.mail.sender} <${payload.mail.senderEmail}>`,
        `聊天摘要：${payload.mail.teaser}`,
      ].join("\n"),
    ),
  ];

  for (const message of payload.messages) {
    const content = message.parts
      .map(extractText)
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!content) {
      continue;
    }

    messages.push(
      message.role === "user"
        ? new HumanMessage(content)
        : new AIMessage(content),
    );
  }

  return messages;
}

function toTextReadableStream(
  source: AsyncIterable<{ content: unknown }>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = source[Symbol.asyncIterator]();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          const { done, value } = await iterator.next();

          if (done) {
            controller.close();
            return;
          }

          const text = extractText(value.content);
          if (text) {
            controller.enqueue(encoder.encode(text));
            return;
          }
        }
      } catch (error) {
        console.error("Inbox chat stream failed", error);
        controller.error(error);
      }
    },
    async cancel(reason) {
      await iterator.return?.(reason);
    },
  });
}

export async function handleInboxChat(
  envBindings: ApiEnvBindings,
  payload: InboxChatRequest,
): Promise<Response> {
  const env = getApiEnv(envBindings);

  if (!env.DEEPSEEK_API_KEY?.trim()) {
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "DeepSeek API key is not configured",
      500,
      { reason: "DEEPSEEK_API_KEY is missing" },
    );
  }

  const model = new ChatOpenAI({
    apiKey: env.DEEPSEEK_API_KEY,
    model: env.DEEPSEEK_MODEL ?? "deepseek-chat",
    streaming: true,
    configuration: {
      baseURL: env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    },
  });

  const stream = await model.stream(buildMessages(payload));
  return buildTextStreamResponse(toTextReadableStream(stream));
}
