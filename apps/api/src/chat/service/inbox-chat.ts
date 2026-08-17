import { AppError, BizCode } from "@repo/contracts/common";
import { InboxChatRequestSchema } from "@repo/contracts/chat";
import type { z } from "zod";
import { getApiEnv, type ApiEnvBindings } from "/env";
import { buildTextStreamResponse } from "@/lib/response";

type InboxChatRequest = z.infer<typeof InboxChatRequestSchema>;
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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

function buildMessages(payload: InboxChatRequest): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "你是 AI Agent Web 控制台里的聊天助手。",
        "请基于当前聊天上下文，用简洁、自然的中文回答用户。",
        "如果用户要求起草回复，请直接给出可发送的回复内容。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `聊天主题：${payload.mail.subject}`,
        `发送方：${payload.mail.sender} <${payload.mail.senderEmail}>`,
        `聊天摘要：${payload.mail.teaser}`,
      ].join("\n"),
    },
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

    messages.push({
      role: message.role === "user" ? "user" : "assistant",
      content,
    });
  }

  return messages;
}

function getSseData(event: string): string | undefined {
  const dataLines = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => {
      const value = line.slice("data:".length);
      return value.startsWith(" ") ? value.slice(1) : value;
    });

  return dataLines.length > 0 ? dataLines.join("\n") : undefined;
}

function extractDeltaContent(event: string): string {
  const data = getSseData(event);

  if (!data || data === "[DONE]") {
    return "";
  }

  const payload = JSON.parse(data) as {
    choices?: Array<{ delta?: { content?: unknown } }>;
    error?: { message?: string };
  };

  if (payload.error) {
    throw new Error(payload.error.message ?? "Upstream completion stream failed");
  }

  const content = payload.choices?.[0]?.delta?.content;
  return typeof content === "string" ? content : "";
}

function sseToTextReadableStream(
  source: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = source.getReader();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });

          if (done) {
            if (buffer.trim()) {
              const text = extractDeltaContent(buffer);
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
            controller.close();
            return;
          }

          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";

          for (const event of events) {
            const text = extractDeltaContent(event);
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        }
      } catch (error) {
        console.error("Inbox chat stream failed", error);
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
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

  const baseUrl = (
    env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
  ).replace(/\/+$/, "");
  const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL ?? "deepseek-chat",
      messages: buildMessages(payload),
      stream: true,
    }),
  });

  if (!upstreamResponse.ok) {
    const reason = await upstreamResponse.text();
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "Upstream completion request failed",
      500,
      { reason, upstreamStatus: upstreamResponse.status },
    );
  }

  if (!upstreamResponse.body) {
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "Upstream completion response has no body",
      500,
    );
  }

  return buildTextStreamResponse(
    sseToTextReadableStream(upstreamResponse.body),
  );
}
