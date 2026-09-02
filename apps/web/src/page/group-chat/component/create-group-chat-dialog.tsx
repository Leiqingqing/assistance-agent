"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { AgentCompanion } from "@repo/contracts/chat";
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
import { Label } from "@repo/ui/label";
import { Bot, Check, LoaderCircle, Search, Users, X } from "lucide-react";

const MAX_MEMBERS = 6;

export function CreateGroupChatDialog({
  agents,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  agents: readonly AgentCompanion[];
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: { title: string; agentIds: string[] }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const filteredAgents = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return agents;
    }

    return agents.filter((agent) =>
      [agent.name, agent.headline, agent.description].some((value) =>
        value?.toLowerCase().includes(keyword),
      ),
    );
  }, [agents, query]);

  function toggleAgent(agentId: string) {
    setSelectedIds((current) => {
      if (current.includes(agentId)) {
        return current.filter((id) => id !== agentId);
      }
      return current.length < MAX_MEMBERS ? [...current, agentId] : current;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || selectedIds.length === 0) {
      return;
    }

    try {
      await onSubmit({ title: title.trim(), agentIds: selectedIds });
    } catch {
      // Mutation state is rendered by the parent dialog.
    }
  }

  return (
    <div
      aria-labelledby="create-group-chat-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/25 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <Card className="my-6 w-full max-w-2xl overflow-hidden shadow-lg">
        <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle id="create-group-chat-title">创建群聊</CardTitle>
            <CardDescription className="mt-1">
              为群聊命名，并选择 1–{MAX_MEMBERS} 位 Agent 参与。
            </CardDescription>
          </div>
          <Button
            aria-label="关闭创建群聊"
            className="shrink-0"
            disabled={busy}
            onClick={onCancel}
            size="icon"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form
            className="grid gap-5"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="group-chat-title">群聊名称</Label>
                <span className="text-caption text-muted-foreground">
                  {title.length}/120
                </span>
              </div>
              <Input
                autoFocus
                disabled={busy}
                id="group-chat-title"
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：旅行计划讨论组"
                required
                value={title}
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="group-chat-agent-search">选择 Agent</Label>
                <Badge variant="secondary">
                  <Users className="size-3.5" />
                  已选 {selectedIds.length}/{MAX_MEMBERS}
                </Badge>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  disabled={busy}
                  id="group-chat-agent-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索 Agent"
                  type="search"
                  value={query}
                />
              </div>

              <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {filteredAgents.map((agent) => {
                  const selected = selectedIds.includes(agent.id);
                  const disabled =
                    busy || (!selected && selectedIds.length >= MAX_MEMBERS);

                  return (
                    <button
                      aria-pressed={selected}
                      className={[
                        "grid min-h-20 grid-cols-[2.5rem_minmax(0,1fr)_1.5rem] items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        selected
                          ? "border-primary bg-secondary/45"
                          : "border-border bg-background hover:bg-muted",
                      ].join(" ")}
                      disabled={disabled}
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      type="button"
                    >
                      <Avatar className="rounded-xl">
                        <AvatarFallback
                          className={
                            selected
                              ? "rounded-xl bg-primary text-primary-foreground"
                              : "rounded-xl"
                          }
                        >
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
                      <span
                        className={[
                          "grid size-5 place-items-center rounded-full border",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input",
                        ].join(" ")}
                      >
                        {selected ? <Check className="size-3.5" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredAgents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-body text-muted-foreground">
                  没有匹配的 Agent
                </p>
              ) : null}
            </div>

            {error ? (
              <p
                className="rounded-xl bg-destructive/10 px-3 py-2 text-body text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                disabled={busy}
                onClick={onCancel}
                type="button"
                variant="outline"
              >
                取消
              </Button>
              <Button
                disabled={busy || !title.trim() || selectedIds.length === 0}
                type="submit"
              >
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Users className="size-4" />
                )}
                {busy ? "创建中…" : "创建并进入"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
