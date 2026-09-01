import { ChatOpenAI } from "@langchain/openai";

import type { ParsedApiEnvBindings } from "/env";

export const DEFAULT_AI_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_AI_MODEL = "deepseek-chat";
export const DEFAULT_STRUCTURED_OUTPUT_TIMEOUT_MS = 8_000;

export type AiModelIdentity = {
  baseURL: string;
  modelName: string;
};

export function getAiModelIdentity(env: ParsedApiEnvBindings): AiModelIdentity {
  return {
    baseURL: env.DEEPSEEK_BASE_URL ?? DEFAULT_AI_BASE_URL,
    modelName: env.DEEPSEEK_MODEL ?? DEFAULT_AI_MODEL,
  };
}

export function createChatModel(
  env: ParsedApiEnvBindings,
  options: {
    temperature?: number;
    timeout?: number;
    maxRetries?: number;
  } = {},
): ChatOpenAI {
  const { baseURL, modelName } = getAiModelIdentity(env);

  return new ChatOpenAI({
    apiKey: env.DEEPSEEK_API_KEY,
    model: modelName,
    temperature: options.temperature ?? 0,
    maxRetries: options.maxRetries ?? 0,
    modelKwargs: {
      thinking: { type: "disabled" },
    },
    timeout: options.timeout ?? DEFAULT_STRUCTURED_OUTPUT_TIMEOUT_MS,
    configuration: {
      baseURL,
    },
    reasoning: { effort: "none" },
    zdrEnabled: true,
  });
}
