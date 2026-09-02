"use client";

import { useEffect, useRef } from "react";
import type {
  AgentGroupChat,
  AgentGroupChatDetailResponse,
  AgentGroupChatMessage,
  CreateAgentGroupChatRequest,
  RemoveAgentGroupChatResponse,
} from "@repo/contracts/group-chat";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { nanoid } from "nanoid";
import {
  addGroupChatAgent,
  createGroupChat,
  getEarlierGroupChatMessages,
  getGroupChat,
  listGroupChats,
  removeGroupChatAgent,
  sendGroupChatMessage,
} from "@/api/group-chat";
import { listAgentCompanions } from "@/api/chat";

export const groupChatsQueryKey = ["group-chats"] as const;
export const groupChatQueryKey = (groupChatId: string) =>
  ["group-chat", groupChatId] as const;

export function useAvailableGroupChatAgentsQuery() {
  return useQuery({
    queryKey: ["agent-companions"],
    queryFn: listAgentCompanions,
  });
}

export function useGroupChatsQuery() {
  return useQuery({
    queryKey: groupChatsQueryKey,
    queryFn: listGroupChats,
  });
}

export function useGroupChatQuery(groupChatId: string) {
  return useQuery({
    queryKey: groupChatQueryKey(groupChatId),
    queryFn: () => getGroupChat(groupChatId),
    enabled: Boolean(groupChatId),
  });
}

export function useCreateGroupChatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAgentGroupChatRequest) =>
      createGroupChat(request),
    onSuccess: (groupChat) => {
      queryClient.setQueryData<AgentGroupChat[]>(
        groupChatsQueryKey,
        (current) => [
          groupChat,
          ...(current ?? []).filter((item) => item.id !== groupChat.id),
        ],
      );
    },
  });
}

export function useEarlierGroupChatMessagesMutation(groupChatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cursor: string) =>
      getEarlierGroupChatMessages(groupChatId, cursor),
    onSuccess: (result) => {
      queryClient.setQueryData<AgentGroupChatDetailResponse>(
        groupChatQueryKey(groupChatId),
        (current) => {
          if (!current) {
            return result;
          }

          const currentIds = new Set(
            current.messages.map((message) => message.id),
          );

          return {
            ...current,
            messages: [
              ...result.messages.filter(
                (message) => !currentIds.has(message.id),
              ),
              ...current.messages,
            ],
            nextCursor: result.nextCursor,
          };
        },
      );
    },
  });
}

function updateGroupChatInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  groupChat: AgentGroupChat,
) {
  queryClient.setQueryData<AgentGroupChatDetailResponse>(
    groupChatQueryKey(groupChat.id),
    (current) => (current ? { ...current, groupChat } : current),
  );
  queryClient.setQueryData<AgentGroupChat[]>(groupChatsQueryKey, (current) =>
    current?.map((item) => (item.id === groupChat.id ? groupChat : item)),
  );
}

export function useAddGroupChatAgentMutation(groupChatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) =>
      addGroupChatAgent(groupChatId, { agentId }),
    onSuccess: (groupChat) => {
      updateGroupChatInCaches(queryClient, groupChat);
    },
  });
}

function markAgentRemoved(
  groupChat: AgentGroupChat,
  agentId: string,
): AgentGroupChat {
  return {
    ...groupChat,
    members: groupChat.members.map((member) =>
      member.agentId === agentId
        ? { ...member, status: "removed" as const }
        : member,
    ),
  };
}

export function useRemoveGroupChatAgentMutation(groupChatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) =>
      removeGroupChatAgent(groupChatId, agentId),
    onSuccess: async (result: RemoveAgentGroupChatResponse) => {
      if (result.dissolved) {
        queryClient.setQueryData<AgentGroupChat[]>(
          groupChatsQueryKey,
          (current) =>
            current?.filter((groupChat) => groupChat.id !== groupChatId),
        );
        queryClient.removeQueries({
          queryKey: groupChatQueryKey(groupChatId),
        });
        return;
      }

      queryClient.setQueryData<AgentGroupChatDetailResponse>(
        groupChatQueryKey(groupChatId),
        (current) =>
          current
            ? {
                ...current,
                groupChat: markAgentRemoved(
                  current.groupChat,
                  result.agentId,
                ),
              }
            : current,
      );
      queryClient.setQueryData<AgentGroupChat[]>(
        groupChatsQueryKey,
        (current) =>
          current?.map((groupChat) =>
            groupChat.id === groupChatId
              ? markAgentRemoved(groupChat, result.agentId)
              : groupChat,
          ),
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupChatsQueryKey }),
        queryClient.invalidateQueries({
          queryKey: groupChatQueryKey(groupChatId),
        }),
      ]);
    },
  });
}

type SendGroupChatMessageVariables = {
  message: string;
  controller: AbortController;
};

type SendGroupChatMessageContext = {
  optimisticMessageId: string;
};

type MessageRollback = {
  message: string;
  error: unknown;
  cancelled: boolean;
};

export function useSendGroupChatMessageMutation(
  groupChatId: string,
  onMessageRollback: (rollback: MessageRollback) => void,
) {
  const queryClient = useQueryClient();
  const activeControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      activeControllerRef.current?.abort();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: ({ message, controller }: SendGroupChatMessageVariables) =>
      sendGroupChatMessage(
        { groupChatId, message },
        controller.signal,
      ),
    onMutate: async ({
      message,
    }): Promise<SendGroupChatMessageContext> => {
      await queryClient.cancelQueries({
        queryKey: groupChatQueryKey(groupChatId),
      });

      const optimisticMessageId = `pending-${nanoid()}`;
      queryClient.setQueryData<AgentGroupChatDetailResponse>(
        groupChatQueryKey(groupChatId),
        (current) => {
          if (!current) {
            return current;
          }

          const latestTurnIndex = current.messages.reduce(
            (latest, currentMessage) =>
              Math.max(latest, currentMessage.turnIndex),
            -1,
          );
          const optimisticMessage: AgentGroupChatMessage = {
            id: optimisticMessageId,
            groupChatId,
            senderType: "user",
            agentId: null,
            agentName: null,
            agentImageKey: null,
            content: message,
            status: "completed",
            turnIndex: latestTurnIndex + 1,
            createdAtMs: Date.now(),
          };

          return {
            ...current,
            messages: [...current.messages, optimisticMessage],
          };
        },
      );

      return { optimisticMessageId };
    },
    onSuccess: (result, _variables, context) => {
      queryClient.setQueryData<AgentGroupChatDetailResponse>(
        groupChatQueryKey(groupChatId),
        (current) => {
          if (!current) {
            return current;
          }

          const confirmedMessages = [
            result.userMessage,
            ...result.agentMessages,
          ];
          const confirmedIds = new Set(
            confirmedMessages.map((message) => message.id),
          );

          return {
            ...current,
            groupChat: result.groupChat,
            messages: [
              ...current.messages.filter(
                (message) =>
                  message.id !== context.optimisticMessageId &&
                  !confirmedIds.has(message.id),
              ),
              ...confirmedMessages,
            ],
          };
        },
      );
      queryClient.setQueryData<AgentGroupChat[]>(
        groupChatsQueryKey,
        (current) =>
          current
            ? [
                result.groupChat,
                ...current.filter(
                  (groupChat) => groupChat.id !== result.groupChat.id,
                ),
              ]
            : current,
      );
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData<AgentGroupChatDetailResponse>(
          groupChatQueryKey(groupChatId),
          (current) =>
            current
              ? {
                  ...current,
                  messages: current.messages.filter(
                    (message) =>
                      message.id !== context.optimisticMessageId,
                  ),
                }
              : current,
        );
      }

      if (mountedRef.current) {
        onMessageRollback({
          message: variables.message,
          error,
          cancelled: variables.controller.signal.aborted,
        });
      }
    },
    onSettled: (_data, _error, variables) => {
      if (activeControllerRef.current === variables.controller) {
        activeControllerRef.current = null;
      }
    },
  });

  function sendMessage(message: string): boolean {
    const value = message.trim();
    if (!value || activeControllerRef.current || mutation.isPending) {
      return false;
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;
    mutation.mutate({ message: value, controller });
    return true;
  }

  function stopSending() {
    activeControllerRef.current?.abort();
  }

  return {
    ...mutation,
    sendMessage,
    stopSending,
  };
}
