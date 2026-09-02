"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { AgentCompanion } from "@repo/contracts/chat";
import type {
  AgentGroupChat,
  AgentGroupChatDetailResponse,
  AgentGroupChatMember,
  AgentGroupChatMessage,
} from "@repo/contracts/group-chat";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import {
  ArrowLeft,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { listAgentCompanions } from "@/api/chat";
import {
  addGroupChatAgent,
  getEarlierGroupChatMessages,
  getGroupChat,
  removeGroupChatAgent,
  sendGroupChatMessage,
} from "@/api/group-chat";
import { ChatBox } from "@/page/chat/component/chat-box";
import { GroupChatMessage } from "./component/group-chat-message";
import { ManageGroupChatMembersDialog } from "./component/manage-group-chat-members-dialog";

function toUiMessage(message: AgentGroupChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.senderType === "user" ? "user" : "assistant",
    parts: [{ type: "text", text: message.content }],
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "成员操作失败，请稍后重试。";
}

function LoadedGroupChat({ detail }: { detail: AgentGroupChatDetailResponse }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState(detail.messages);
  const [nextCursor, setNextCursor] = useState(detail.nextCursor);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [activeMembers, setActiveMembers] = useState<AgentGroupChatMember[]>(
    () =>
      detail.groupChat.members.filter((member) => member.status === "active"),
  );
  const [sendError, setSendError] = useState<Error | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const activeControllerRef = useRef<AbortController | null>(null);
  const optimisticMessageIdRef = useRef<string | null>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const agentsQuery = useQuery({
    queryKey: ["agent-companions"],
    queryFn: listAgentCompanions,
  });
  const addAgentMutation = useMutation({
    mutationFn: (agentId: string) =>
      addGroupChatAgent(detail.groupChat.id, { agentId }),
    onSuccess: (groupChat) => {
      syncGroupChat(groupChat);
    },
  });
  const removeAgentMutation = useMutation({
    mutationFn: (agentId: string) =>
      removeGroupChatAgent(detail.groupChat.id, agentId),
    onSuccess: (result) => {
      if (result.dissolved) {
        setShowMemberDialog(false);
        queryClient.setQueryData<AgentGroupChat[]>(["group-chats"], (current) =>
          current?.filter((groupChat) => groupChat.id !== detail.groupChat.id),
        );
        queryClient.removeQueries({
          queryKey: ["group-chat", detail.groupChat.id],
        });
        router.push("/group-chat");
        return;
      }

      markAgentRemoved(result.agentId);
      void queryClient.invalidateQueries({ queryKey: ["group-chats"] });
      void queryClient.invalidateQueries({
        queryKey: ["group-chat", detail.groupChat.id],
      });
    },
  });
  const messagesById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );
  const uiMessages = useMemo(() => messages.map(toUiMessage), [messages]);

  useEffect(
    () => () => {
      activeControllerRef.current?.abort();
    },
    [],
  );

  async function loadEarlierMessages() {
    if (!nextCursor) {
      return;
    }

    const earlier = await getEarlierGroupChatMessages(
      detail.groupChat.id,
      nextCursor,
    );
    setMessages((current) => {
      const currentIds = new Set(current.map((message) => message.id));
      return [
        ...earlier.messages.filter((message) => !currentIds.has(message.id)),
        ...current,
      ];
    });
    setNextCursor(earlier.nextCursor);
  }

  async function submitMessage(text: string) {
    const value = text.trim();
    if (!value || isSending) {
      return;
    }

    const controller = new AbortController();
    const optimisticMessageId = `pending-${Date.now()}`;
    const latestTurnIndex = messages.reduce(
      (latest, message) => Math.max(latest, message.turnIndex),
      -1,
    );
    const optimisticMessage: AgentGroupChatMessage = {
      id: optimisticMessageId,
      groupChatId: detail.groupChat.id,
      senderType: "user",
      agentId: null,
      agentName: null,
      agentImageKey: null,
      content: value,
      status: "completed",
      turnIndex: latestTurnIndex + 1,
      createdAtMs: Date.now(),
    };

    activeControllerRef.current = controller;
    optimisticMessageIdRef.current = optimisticMessageId;
    pendingMessageRef.current = value;
    setInput("");
    setSendError(null);
    setFailedMessage(null);
    setIsSending(true);
    setMessages((current) => [...current, optimisticMessage]);

    try {
      const result = await sendGroupChatMessage(
        { groupChatId: detail.groupChat.id, message: value },
        controller.signal,
      );

      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticMessageId),
        result.userMessage,
        ...result.agentMessages,
      ]);
      queryClient.setQueryData<AgentGroupChatDetailResponse>(
        ["group-chat", detail.groupChat.id],
        (current) =>
          current
            ? {
                ...current,
                groupChat: result.groupChat,
                messages: [
                  ...current.messages,
                  result.userMessage,
                  ...result.agentMessages,
                ],
              }
            : current,
      );
      queryClient.setQueryData<AgentGroupChat[]>(["group-chats"], (current) =>
        current
          ? [
              result.groupChat,
              ...current.filter(
                (groupChat) => groupChat.id !== result.groupChat.id,
              ),
            ]
          : current,
      );
    } catch (error) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessageId),
      );

      if (!controller.signal.aborted) {
        setInput(value);
        setFailedMessage(value);
        setSendError(
          error instanceof Error ? error : new Error("消息发送失败"),
        );
      }
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
        optimisticMessageIdRef.current = null;
        pendingMessageRef.current = null;
        setIsSending(false);
      }
    }
  }

  function stopSending() {
    const optimisticMessageId = optimisticMessageIdRef.current;
    const pendingMessage = pendingMessageRef.current;

    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    optimisticMessageIdRef.current = null;
    pendingMessageRef.current = null;
    setIsSending(false);
    if (optimisticMessageId) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessageId),
      );
    }
    if (pendingMessage) {
      setInput(pendingMessage);
    }
  }

  function syncGroupChat(groupChat: AgentGroupChat) {
    setActiveMembers(
      groupChat.members.filter((member) => member.status === "active"),
    );
    queryClient.setQueryData<AgentGroupChatDetailResponse>(
      ["group-chat", detail.groupChat.id],
      (current) => (current ? { ...current, groupChat } : current),
    );
    queryClient.setQueryData<AgentGroupChat[]>(["group-chats"], (current) =>
      current?.map((item) => (item.id === groupChat.id ? groupChat : item)),
    );
  }

  function markAgentRemoved(agentId: string) {
    setActiveMembers((current) =>
      current.filter((member) => member.agentId !== agentId),
    );
    const removeFromGroupChat = (
      groupChat: AgentGroupChat,
    ): AgentGroupChat => ({
      ...groupChat,
      members: groupChat.members.map((member) =>
        member.agentId === agentId
          ? { ...member, status: "removed" as const }
          : member,
      ),
    });
    queryClient.setQueryData<AgentGroupChatDetailResponse>(
      ["group-chat", detail.groupChat.id],
      (current) =>
        current
          ? {
              ...current,
              groupChat: removeFromGroupChat(current.groupChat),
            }
          : current,
    );
    queryClient.setQueryData<AgentGroupChat[]>(["group-chats"], (current) =>
      current?.map((groupChat) =>
        groupChat.id === detail.groupChat.id
          ? removeFromGroupChat(groupChat)
          : groupChat,
      ),
    );
  }

  async function addAgent(agent: AgentCompanion) {
    removeAgentMutation.reset();
    try {
      await addAgentMutation.mutateAsync(agent.id);
    } catch {
      // Mutation error is rendered in the member dialog.
    }
  }

  async function removeAgent(agentId: string) {
    addAgentMutation.reset();
    try {
      await removeAgentMutation.mutateAsync(agentId);
    } catch {
      // Mutation error is rendered in the member dialog.
    }
  }

  function openMemberDialog() {
    addAgentMutation.reset();
    removeAgentMutation.reset();
    setShowMemberDialog(true);
  }

  return (
    <main className="flex h-svh min-h-[40rem] flex-col overflow-hidden bg-background text-foreground">
      <ChatBox
        canLoadEarlier={Boolean(nextCursor)}
        canStop={false}
        emptyContent={
          <div className="my-auto text-center">
            <MessageCircle className="mx-auto size-8 text-primary" />
            <p className="mt-3 font-semibold">群聊还没有消息</p>
            <p className="mt-1 text-body text-muted-foreground">
              发送第一条消息，邀请 Agent 开始讨论。
            </p>
          </div>
        }
        header={
          <header className="flex min-h-20 items-center justify-between gap-4 bg-card px-4 py-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                aria-label="返回群聊列表"
                asChild
                className="shrink-0"
                size="icon"
                variant="ghost"
              >
                <Link href="/group-chat">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Users className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate font-semibold">
                  {detail.groupChat.title}
                </h1>
                <p className="truncate text-caption text-muted-foreground">
                  {activeMembers.map((member) => member.name).join("、")}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden -space-x-2 sm:flex">
                {activeMembers.slice(0, 4).map((member) => (
                  <Avatar
                    className="size-8 rounded-xl border-2 border-card"
                    key={member.id}
                    title={member.name}
                  >
                    <AvatarFallback className="rounded-xl bg-secondary text-caption text-secondary-foreground">
                      {member.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Badge variant="outline">
                <Users className="size-3.5" />
                {activeMembers.length} 位
              </Badge>
              <Button
                aria-label="添加或移除群聊 Agent"
                className="rounded-xl"
                onClick={openMemberDialog}
                size="icon"
                title="管理群聊成员"
                variant="outline"
              >
                <UserRoundPlus className="size-4" />
              </Button>
            </div>
          </header>
        }
        input={input}
        isRunning={isSending}
        isStreaming={false}
        isWaitingForReply={isSending}
        messages={uiMessages}
        onInputChange={setInput}
        onLoadEarlier={loadEarlierMessages}
        onRetry={() => void submitMessage(failedMessage ?? input)}
        onStop={stopSending}
        onSubmit={() => void submitMessage(input)}
        renderMessage={(message) => {
          const groupMessage = messagesById.get(message.id);
          return groupMessage ? (
            <GroupChatMessage message={groupMessage} />
          ) : null;
        }}
        error={sendError}
        composerDisclaimer="每次发送将由当前群聊中的一位 Agent 回复。"
        composerPlaceholder="输入群聊消息，Enter 发送，Shift + Enter 换行"
      />

      {showMemberDialog ? (
        <ManageGroupChatMembersDialog
          agents={agentsQuery.data ?? []}
          agentsError={agentsQuery.isError}
          agentsLoading={agentsQuery.isPending}
          busyAction={
            addAgentMutation.isPending
              ? {
                  type: "add",
                  agentId: addAgentMutation.variables,
                }
              : removeAgentMutation.isPending
                ? {
                    type: "remove",
                    agentId: removeAgentMutation.variables,
                  }
                : null
          }
          error={
            addAgentMutation.isError
              ? getErrorMessage(addAgentMutation.error)
              : removeAgentMutation.isError
                ? getErrorMessage(removeAgentMutation.error)
                : null
          }
          members={activeMembers}
          onAdd={addAgent}
          onClose={() => setShowMemberDialog(false)}
          onDissolve={removeAgent}
          onRemove={removeAgent}
        />
      ) : null}
    </main>
  );
}

export default function GroupChatDetailPage() {
  const params = useParams<{ groupChatId: string }>();
  const groupChatId = params.groupChatId;
  const groupChatQuery = useQuery({
    queryKey: ["group-chat", groupChatId],
    queryFn: () => getGroupChat(groupChatId),
    enabled: Boolean(groupChatId),
  });

  if (groupChatQuery.isPending) {
    return (
      <main className="grid min-h-svh place-items-center bg-background text-muted-foreground">
        <p className="flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" />
          正在加载群聊…
        </p>
      </main>
    );
  }

  if (groupChatQuery.isError) {
    return (
      <main className="grid min-h-svh place-items-center bg-background p-6 text-center">
        <div>
          <p className="font-semibold">群聊加载失败</p>
          <p className="mt-1 text-body text-muted-foreground">
            群聊可能已删除，或当前服务暂不可用。
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/group-chat">
                <ArrowLeft className="size-4" />
                返回列表
              </Link>
            </Button>
            <Button onClick={() => void groupChatQuery.refetch()}>
              <RotateCcw className="size-4" />
              重试
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <LoadedGroupChat
      detail={groupChatQuery.data}
      key={groupChatQuery.data.groupChat.id}
    />
  );
}
