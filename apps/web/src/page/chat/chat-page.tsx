"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ScrollArea } from "@repo/ui/scroll-area";
import { Separator } from "@repo/ui/separator";
import { Inbox, Search, Sparkles } from "lucide-react";
import { ChatPanel } from "./chat-panel";
import {
  inboxConversations,
  type InboxConversation,
} from "./inbox-conversations";

function ConversationRow({
  active,
  conversation,
  onSelect,
}: {
  active: boolean;
  conversation: InboxConversation;
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
          {conversation.mail.sender.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <strong className="truncate text-body font-semibold text-foreground">
            {conversation.mail.sender}
          </strong>
          {conversation.unread ? (
            <Badge
              aria-label="未读"
              className="size-2 shrink-0 border-0 bg-blush-500 p-0"
            />
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-body text-foreground">
          {conversation.mail.subject}
        </span>
        <span className="mt-1 block truncate text-caption text-muted-foreground">
          {conversation.preview}
        </span>
      </span>
      <time className="pt-0.5 text-caption text-muted-foreground">
        {conversation.time}
      </time>
    </Button>
  );
}

export default function ChatPage() {
  const [selectedId, setSelectedId] = useState(inboxConversations[0].id);
  const [query, setQuery] = useState("");
  const selectedConversation =
    inboxConversations.find((conversation) => conversation.id === selectedId) ??
    inboxConversations[0];
  const filteredConversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return inboxConversations;
    }

    return inboxConversations.filter((conversation) =>
      [
        conversation.mail.sender,
        conversation.mail.senderEmail,
        conversation.mail.subject,
        conversation.preview,
      ].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [query]);

  return (
    <main className="grid h-svh min-h-[40rem] grid-rows-[17rem_minmax(0,1fr)] overflow-hidden bg-background text-foreground lg:grid-cols-[22rem_minmax(0,1fr)] lg:grid-rows-1">
      <aside className="flex min-h-0 flex-col border-b border-border bg-muted/45 lg:border-r lg:border-b-0">
        <header className="px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">客服工作台</p>
                <p className="text-caption text-muted-foreground">AI Inbox</p>
              </div>
            </div>
            <Badge variant="secondary">
              {inboxConversations.filter((item) => item.unread).length} 未读
            </Badge>
          </div>

          <div className="relative mt-4">
            <Label className="sr-only" htmlFor="conversation-search">
              搜索对话
            </Label>
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="rounded-xl bg-card pl-9"
              id="conversation-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索客户或主题"
              type="search"
              value={query}
            />
          </div>
        </header>
        <Separator />

        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Inbox className="size-4 text-primary" />
            <h2 className="text-body font-semibold">对话记录</h2>
          </div>
          <span className="text-caption text-muted-foreground">
            {filteredConversations.length} 条
          </span>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav aria-label="对话记录" className="space-y-1 px-2 pb-3">
            {filteredConversations.length ? (
              filteredConversations.map((conversation) => (
                <ConversationRow
                  active={conversation.id === selectedConversation.id}
                  conversation={conversation}
                  key={conversation.id}
                  onSelect={() => setSelectedId(conversation.id)}
                />
              ))
            ) : (
              <p className="px-4 py-8 text-center text-body text-muted-foreground">
                没有匹配的对话
              </p>
            )}
          </nav>
        </ScrollArea>
      </aside>

      <ChatPanel
        conversation={selectedConversation}
        key={selectedConversation.id}
      />
    </main>
  );
}
