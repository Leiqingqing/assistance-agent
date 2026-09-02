"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CreateAgentGroupChatRequest } from "@repo/contracts/group-chat";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  ArrowLeft,
  LoaderCircle,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { CreateGroupChatDialog } from "./component/create-group-chat-dialog";
import { GroupChatCard } from "./component/group-chat-card";
import {
  useAvailableGroupChatAgentsQuery,
  useCreateGroupChatMutation,
  useGroupChatsQuery,
} from "./hooks/use-group-chat";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。";
}

export default function GroupChatPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const groupChatsQuery = useGroupChatsQuery();
  const agentsQuery = useAvailableGroupChatAgentsQuery();
  const createMutation = useCreateGroupChatMutation();
  const groupChats = useMemo(
    () => groupChatsQuery.data ?? [],
    [groupChatsQuery.data],
  );
  const agents = agentsQuery.data ?? [];
  const filteredGroupChats = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return groupChats;
    }

    return groupChats.filter((groupChat) =>
      [
        groupChat.title,
        groupChat.summary,
        groupChat.latestMessage?.content,
        ...groupChat.members.map((member) => member.name),
      ].some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [groupChats, query]);
  const totalMembers = new Set(
    groupChats.flatMap((groupChat) =>
      groupChat.members
        .filter((member) => member.status === "active")
        .map((member) => member.agentId),
    ),
  ).size;

  async function submitCreateGroupChat(request: CreateAgentGroupChatRequest) {
    const groupChat = await createMutation.mutateAsync(request);
    setShowCreateDialog(false);
    router.push(`/group-chat/${encodeURIComponent(groupChat.id)}`);
  }

  function openCreateDialog() {
    createMutation.reset();
    setShowCreateDialog(true);
  }

  return (
    <main className="min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="overflow-hidden rounded-3xl border border-border bg-card shadow-md">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-caption uppercase text-primary">
                    Agent Group Chats
                  </p>
                  <h1 className="text-display">群聊空间</h1>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-body-lg text-muted-foreground">
                邀请多位 Agent 加入同一个话题，从不同视角一起分析、讨论和协作。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/chat">
                  <ArrowLeft className="size-4" />
                  单聊
                </Link>
              </Button>
              <Button
                disabled={
                  agentsQuery.isPending ||
                  agentsQuery.isError ||
                  agents.length === 0
                }
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                新建群聊
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-xs">
            <p className="text-caption text-muted-foreground">群聊数量</p>
            <p className="mt-1 text-title">{groupChats.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-xs">
            <p className="text-caption text-muted-foreground">参与 Agent</p>
            <p className="mt-1 text-title">{totalMembers}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-xs">
            <p className="text-caption text-muted-foreground">累计消息</p>
            <p className="mt-1 text-title">
              {groupChats.reduce(
                (total, groupChat) => total + groupChat.messageCount,
                0,
              )}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Label className="sr-only" htmlFor="group-chat-search">
              搜索群聊
            </Label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="rounded-xl bg-background pl-9"
              id="group-chat-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索群聊、消息或 Agent"
              type="search"
              value={query}
            />
          </div>
          <Badge className="self-start sm:self-auto" variant="outline">
            <MessageCircle className="size-3.5" />
            {filteredGroupChats.length} 个群聊
          </Badge>
        </section>

        {agentsQuery.isError ? (
          <p
            className="rounded-xl bg-destructive/10 px-4 py-3 text-body text-destructive"
            role="alert"
          >
            Agent 列表加载失败，暂时无法创建群聊。
          </p>
        ) : null}

        {groupChatsQuery.isPending ? (
          <div className="grid min-h-80 place-items-center text-muted-foreground">
            <p className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载群聊…
            </p>
          </div>
        ) : groupChatsQuery.isError ? (
          <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <div>
              <p className="font-semibold">群聊列表加载失败</p>
              <p className="mt-1 text-body text-muted-foreground">
                请确认登录状态和 API 服务后重试。
              </p>
              <Button
                className="mt-4"
                onClick={() => void groupChatsQuery.refetch()}
                size="sm"
                variant="outline"
              >
                <RotateCcw className="size-3.5" />
                重试
              </Button>
            </div>
          </div>
        ) : filteredGroupChats.length > 0 ? (
          <section
            aria-label="群聊列表"
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredGroupChats.map((groupChat) => (
              <GroupChatCard groupChat={groupChat} key={groupChat.id} />
            ))}
          </section>
        ) : groupChats.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <div className="max-w-sm">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <Sparkles className="size-6" />
              </div>
              <h2 className="mt-5 text-title">创建第一个群聊</h2>
              <p className="mt-2 text-body text-muted-foreground">
                选择几位擅长不同领域的 Agent，围绕一个主题共同讨论。
              </p>
              <Button
                className="mt-5"
                disabled={
                  agentsQuery.isPending ||
                  agentsQuery.isError ||
                  agents.length === 0
                }
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                新建群聊
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-card p-8 text-center text-body text-muted-foreground">
            没有匹配的群聊，换个关键词试试。
          </div>
        )}
      </div>

      {showCreateDialog ? (
        <CreateGroupChatDialog
          agents={agents}
          busy={createMutation.isPending}
          error={
            createMutation.isError
              ? getErrorMessage(createMutation.error)
              : null
          }
          onCancel={() => setShowCreateDialog(false)}
          onSubmit={submitCreateGroupChat}
        />
      ) : null}
    </main>
  );
}
