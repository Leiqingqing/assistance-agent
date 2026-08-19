"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ScrollArea } from "@repo/ui/scroll-area";
import { Separator } from "@repo/ui/separator";
import { Bot, Brain, Search, Sparkles } from "lucide-react";
import type { AgentCompanion } from "@/api/chat";

function formatLastMessageTime(value: number | null): string {
  if (value === null) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(value);
}

function AgentRow({
  active,
  agent,
  onSelect,
}: {
  active: boolean;
  agent: AgentCompanion;
  onSelect: () => void;
}) {
  return (
    <Button
      className={[
        "group relative grid h-auto w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border p-3 text-left whitespace-normal",
        active
          ? "border-primary/55 bg-secondary/55 shadow-xs"
          : "border-transparent hover:border-border hover:bg-card",
      ].join(" ")}
      onClick={onSelect}
      variant="ghost"
    >
      <Avatar className="rounded-xl">
        <AvatarFallback
          className={[
            "rounded-xl",
            active
              ? "bg-primary text-primary-foreground"
              : "group-hover:bg-secondary group-hover:text-secondary-foreground",
          ].join(" ")}
        >
          {agent.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <strong className="block truncate text-body font-semibold text-foreground">
          {agent.name}
        </strong>
        <span className="mt-0.5 block truncate text-body text-foreground">
          {agent.headline ?? "AI 陪伴助手"}
        </span>
        <span className="mt-1 block truncate text-caption text-muted-foreground">
          {agent.lastAssistantMessage ??
            agent.openingMessage ??
            agent.description ??
            "开始一段新对话"}
        </span>
      </span>
      <time className="pt-0.5 text-caption text-muted-foreground">
        {formatLastMessageTime(agent.lastAssistantMessageAtMs)}
      </time>
    </Button>
  );
}

export function AgentSidebar({
  agents,
  selectedId,
  onSelect,
}: {
  agents: readonly AgentCompanion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filteredAgents = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return agents;
    }

    return agents.filter((agent) =>
      [
        agent.name,
        agent.headline,
        agent.description,
        agent.lastAssistantMessage,
      ].some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [agents, query]);

  return (
    <aside className="flex min-h-0 flex-col border-b border-border bg-muted/45 lg:border-r lg:border-b-0">
      <header className="px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">我的 Agent</p>
              <p className="text-caption text-muted-foreground">
                AI Companions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{agents.length} 位</Badge>
            <Button
              aria-label="管理记忆"
              asChild
              className="rounded-xl"
              size="icon"
              variant="ghost"
            >
              <Link href="/memory" title="管理记忆">
                <Brain className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-4">
          <Label className="sr-only" htmlFor="conversation-search">
            搜索 Agent
          </Label>
          <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-xl bg-card pl-9"
            id="conversation-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 Agent"
            type="search"
            value={query}
          />
        </div>
      </header>
      <Separator />

      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          <h2 className="text-body font-semibold">Agent 列表</h2>
        </div>
        <span className="text-caption text-muted-foreground">
          {filteredAgents.length} 位
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Agent 列表" className="space-y-1 px-2 pb-3">
          {filteredAgents.length ? (
            filteredAgents.map((agent) => (
              <AgentRow
                active={agent.id === selectedId}
                agent={agent}
                key={agent.id}
                onSelect={() => onSelect(agent.id)}
              />
            ))
          ) : (
            <p className="px-4 py-8 text-center text-body text-muted-foreground">
              没有匹配的 Agent
            </p>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
