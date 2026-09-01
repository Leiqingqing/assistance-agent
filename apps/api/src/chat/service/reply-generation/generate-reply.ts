import { AppError, BizCode } from "@repo/contracts/common";

import type { ParsedApiEnvBindings } from "/env";
import { DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL } from "@/ai/chat-model";
import { buildChatMessages } from "@/chat/service/reply-generation/build-messages";
import { sseToTextReadableStream } from "@/chat/service/reply-generation/stream-response";
import type { BuildChatMessagesInput } from "@/chat/types";
import {
  buildImmediateTextStream,
  buildTextStreamResponse,
} from "@/lib/response";

type OnReplyComplete = (content: string) => Promise<void>;

export function buildImmediateReplyResponse(
  content: string,
  onComplete: OnReplyComplete,
): Response {
  return buildTextStreamResponse(buildImmediateTextStream(content, onComplete));
}

export async function generateReplyResponse(
  env: ParsedApiEnvBindings,
  input: BuildChatMessagesInput,
  onComplete: OnReplyComplete,
): Promise<Response> {
  if (!env.DEEPSEEK_API_KEY?.trim()) {
    throw new AppError(
      BizCode.SYSTEM_INTERNAL_ERROR,
      "DeepSeek API key is not configured",
      500,
      { reason: "DEEPSEEK_API_KEY is missing" },
    );
  }

  const baseUrl = (env.DEEPSEEK_BASE_URL ?? DEFAULT_AI_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const model = env.DEEPSEEK_MODEL ?? DEFAULT_AI_MODEL;
  const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: buildChatMessages(input),
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
    sseToTextReadableStream(upstreamResponse.body, onComplete),
  );
}
