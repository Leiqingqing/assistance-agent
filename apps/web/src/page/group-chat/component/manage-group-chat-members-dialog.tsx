"use client";

import { useMemo, useState } from "react";
import type { AgentCompanion } from "@repo/contracts/chat";
import {
  AGENT_GROUP_CHAT_MAX_AGENTS,
  type AgentGroupChatMember,
} from "@repo/contracts/group-chat";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import {
  AlertTriangle,
  Bot,
  Check,
  LoaderCircle,
  Search,
  Trash2,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";

export function ManageGroupChatMembersDialog({
  agents,
  agentsError,
  agentsLoading,
  busyAction,
  error,
  members,
  onAdd,
  onClose,
  onDissolve,
  onRemove,
}: {
  agents: readonly AgentCompanion[];
  agentsError: boolean;
  agentsLoading: boolean;
  busyAction: {
    type: "add" | "remove";
    agentId: string;
  } | null;
  error: string | null;
  members: readonly AgentGroupChatMember[];
  onAdd: (agent: AgentCompanion) => Promise<void>;
  onClose: () => void;
  onDissolve: (agentId: string) => Promise<void>;
  onRemove: (agentId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [memberToRemove, setMemberToRemove] =
    useState<AgentGroupChatMember | null>(null);
  const activeAgentIds = useMemo(
    () => new Set(members.map((member) => member.agentId)),
    [members],
  );
  const availableAgents = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return agents.filter((agent) => {
      if (activeAgentIds.has(agent.id)) {
        return false;
      }

      return (
        !keyword ||
        [agent.name, agent.headline, agent.description].some((value) =>
          value?.toLowerCase().includes(keyword),
        )
      );
    });
  }, [activeAgentIds, agents, query]);
  const isAtCapacity = members.length >= AGENT_GROUP_CHAT_MAX_AGENTS;
  const busy = busyAction !== null;

  function requestRemove(member: AgentGroupChatMember) {
    if (members.length === 1) {
      setMemberToRemove(member);
      return;
    }

    void onRemove(member.agentId);
  }

  return (
    <>
      <div
        aria-labelledby="manage-group-chat-members-title"
        aria-modal="true"
        className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/25 p-4 backdrop-blur-sm"
        role="dialog"
      >
        <Card className="my-6 w-full max-w-2xl overflow-hidden shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle id="manage-group-chat-members-title">
                管理群聊成员
              </CardTitle>
              <CardDescription className="mt-1">
                添加新的 Agent，或移除当前群聊成员。
              </CardDescription>
            </div>
            <Button
              aria-label="关闭成员管理"
              className="shrink-0"
              disabled={busy}
              onClick={onClose}
              size="icon"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>

          <CardContent className="grid gap-6">
            {error ? (
              <p
                className="rounded-xl bg-destructive/10 px-4 py-3 text-body text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <section className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Users className="size-4 text-primary" />
                  当前成员
                </h2>
                <Badge variant="secondary">
                  {members.length}/{AGENT_GROUP_CHAT_MAX_AGENTS} 位
                </Badge>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {members.map((member) => (
                  <div
                    className="grid min-h-18 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 rounded-2xl border border-border bg-background p-3"
                    key={member.id}
                  >
                    <Avatar className="rounded-xl">
                      <AvatarFallback className="rounded-xl bg-secondary text-secondary-foreground">
                        {member.name.slice(0, 1) || <Bot className="size-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <strong className="block truncate text-body font-semibold">
                        {member.name}
                      </strong>
                      <span className="mt-0.5 block truncate text-caption text-muted-foreground">
                        {member.headline ?? "AI Agent"}
                      </span>
                    </span>
                    <Button
                      aria-label={`移除 ${member.name}`}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      disabled={busy}
                      onClick={() => requestRemove(member)}
                      size="icon"
                      title={
                        members.length === 1
                          ? "移除最后一位 Agent 并解散群聊"
                          : `移除 ${member.name}`
                      }
                      variant="ghost"
                    >
                      {busyAction?.type === "remove" &&
                      busyAction.agentId === member.agentId ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <UserRoundPlus className="size-4 text-primary" />
                  添加 Agent
                </h2>
                {isAtCapacity ? (
                  <span className="text-caption text-muted-foreground">
                    已达到成员上限
                  </span>
                ) : null}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  disabled={
                    agentsLoading || agentsError || isAtCapacity || busy
                  }
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索可添加的 Agent"
                  type="search"
                  value={query}
                />
              </div>

              <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {agentsLoading ? (
                  <p className="col-span-full flex min-h-24 items-center justify-center gap-2 text-body text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    正在加载 Agent…
                  </p>
                ) : agentsError ? (
                  <p
                    className="col-span-full rounded-xl bg-destructive/10 px-4 py-6 text-center text-body text-destructive"
                    role="alert"
                  >
                    Agent 列表加载失败，暂时无法添加成员。
                  </p>
                ) : isAtCapacity ? (
                  <p className="col-span-full rounded-xl border border-dashed border-border px-4 py-7 text-center text-body text-muted-foreground">
                    群聊最多可加入 {AGENT_GROUP_CHAT_MAX_AGENTS} 位 Agent。
                  </p>
                ) : availableAgents.length > 0 ? (
                  availableAgents.map((agent) => (
                    <div
                      className="grid min-h-18 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-background p-3"
                      key={agent.id}
                    >
                      <Avatar className="rounded-xl">
                        <AvatarFallback className="rounded-xl">
                          {agent.name.slice(0, 1) || <Bot className="size-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <strong className="block truncate text-body font-semibold">
                          {agent.name}
                        </strong>
                        <span className="mt-0.5 block truncate text-caption text-muted-foreground">
                          {agent.headline ?? agent.description ?? "AI Agent"}
                        </span>
                      </span>
                      <Button
                        aria-label={`添加 ${agent.name}`}
                        disabled={busy}
                        onClick={() => void onAdd(agent)}
                        size="sm"
                        variant="outline"
                      >
                        {busyAction?.type === "add" &&
                        busyAction.agentId === agent.id ? (
                          <>
                            <LoaderCircle className="size-3.5 animate-spin" />
                            添加中…
                          </>
                        ) : (
                          <>
                            <UserRoundPlus className="size-3.5" />
                            添加
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full rounded-xl border border-dashed border-border px-4 py-7 text-center text-body text-muted-foreground">
                    {query.trim()
                      ? "没有匹配的 Agent"
                      : "所有可用 Agent 都已在群聊中"}
                  </p>
                )}
              </div>
            </section>

            <div className="flex justify-end">
              <Button disabled={busy} onClick={onClose}>
                <Check className="size-4" />
                完成
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {memberToRemove ? (
        <div
          aria-labelledby="dissolve-group-chat-title"
          aria-modal="true"
          className="fixed inset-0 z-[60] grid place-items-center bg-foreground/35 p-4 backdrop-blur-sm"
          role="alertdialog"
        >
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <div className="mb-2 grid size-11 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <CardTitle id="dissolve-group-chat-title">
                确认解散群聊？
              </CardTitle>
              <CardDescription className="pt-1">
                {memberToRemove.name} 是群聊中的最后一位
                Agent。将其移除会同时解散该群聊，且无法撤销。
              </CardDescription>
              {error ? (
                <p
                  className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-body text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="flex justify-end gap-3">
              <Button
                disabled={busy}
                onClick={() => setMemberToRemove(null)}
                variant="outline"
              >
                取消
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={busy}
                onClick={() => void onDissolve(memberToRemove.agentId)}
              >
                {busyAction?.type === "remove" &&
                busyAction.agentId === memberToRemove.agentId ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {busy ? "正在解散…" : "移除并解散"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
