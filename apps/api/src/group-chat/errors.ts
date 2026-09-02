import { AppError, BizCode, type AppErrorStatus } from "@repo/contracts/common";

type AgentGroupChatError = {
  reason:
    | "AGENT_NOT_FOUND"
    | "DUPLICATE_AGENTS"
    | "GROUP_CHAT_NOT_FOUND"
    | "GROUP_CHAT_HAS_NO_ACTIVE_AGENTS"
    | "GROUP_CHAT_AGENT_ALREADY_ACTIVE"
    | "GROUP_CHAT_AGENT_NOT_ACTIVE"
    | "GROUP_CHAT_AGENT_LIMIT_REACHED";
};

function createAgentGroupChatError(
  code: (typeof BizCode)[keyof typeof BizCode],
  message: string,
  status: AppErrorStatus,
  reason: AgentGroupChatError["reason"],
) {
  return new AppError<AgentGroupChatError>(code, message, status, { reason });
}

export function groupChatAgentNotFoundError() {
  return createAgentGroupChatError(
    BizCode.COMMON_NOT_FOUND,
    "One or more agents were not found",
    404,
    "AGENT_NOT_FOUND",
  );
}

export function duplicateGroupChatAgentsError() {
  return createAgentGroupChatError(
    BizCode.COMMON_INVALID_REQUEST,
    "Each agent can only be selected once",
    400,
    "DUPLICATE_AGENTS",
  );
}

export function groupChatNotFoundError() {
  return createAgentGroupChatError(
    BizCode.COMMON_NOT_FOUND,
    "Group chat was not found",
    404,
    "GROUP_CHAT_NOT_FOUND",
  );
}

export function groupChatHasNoActiveAgentsError() {
  return createAgentGroupChatError(
    BizCode.BIZ_RULE_VIOLATION,
    "Group chat has no active agents",
    409,
    "GROUP_CHAT_HAS_NO_ACTIVE_AGENTS",
  );
}

export function groupChatAgentAlreadyActiveError() {
  return createAgentGroupChatError(
    BizCode.BIZ_RULE_VIOLATION,
    "Agent is already an active member of the group chat",
    409,
    "GROUP_CHAT_AGENT_ALREADY_ACTIVE",
  );
}

export function groupChatAgentNotActiveError() {
  return createAgentGroupChatError(
    BizCode.COMMON_NOT_FOUND,
    "Agent is not an active member of the group chat",
    404,
    "GROUP_CHAT_AGENT_NOT_ACTIVE",
  );
}

export function groupChatAgentLimitReachedError() {
  return createAgentGroupChatError(
    BizCode.BIZ_RULE_VIOLATION,
    "Group chat has reached the maximum number of active agents",
    409,
    "GROUP_CHAT_AGENT_LIMIT_REACHED",
  );
}
