import { AppError, BizCode, type AppErrorStatus } from "@repo/contracts/common";
import type { MemoryError } from "@repo/contracts/memory";

function createMemoryError(
  message: string,
  status: AppErrorStatus,
  reason: MemoryError["reason"],
): AppError<MemoryError> {
  return new AppError(BizCode.COMMON_NOT_FOUND, message, status, { reason });
}

export function memoryAgentNotFoundError(): AppError<MemoryError> {
  return createMemoryError("Agent was not found", 404, "AGENT_NOT_FOUND");
}

export function memoryNotFoundError(): AppError<MemoryError> {
  return createMemoryError("Memory was not found", 404, "MEMORY_NOT_FOUND");
}
