import { AppError, BizCode } from "@repo/contracts/common";

export function agentNotFoundError(): AppError<{ reason: string }> {
  return new AppError(
    BizCode.COMMON_NOT_FOUND,
    "Agent was not found",
    404,
    { reason: "AGENT_NOT_FOUND" },
  );
}

export function conversationNotFoundError(): AppError<{ reason: string }> {
  return new AppError(
    BizCode.COMMON_NOT_FOUND,
    "Conversation was not found",
    404,
    { reason: "CONVERSATION_NOT_FOUND" },
  );
}
