import Link from "next/link";
import type { AgentGroupChat } from "@repo/contracts/group-chat";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ArrowRight, MessageCircle, Users } from "lucide-react";

function formatActivityTime(value: number): string {
  const now = new Date();
  const date = new Date(value);

  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function GroupChatCard({ groupChat }: { groupChat: AgentGroupChat }) {
  const activeMembers = groupChat.members.filter(
    (member) => member.status === "active",
  );
  const activityAt = groupChat.lastMessageAtMs ?? groupChat.createdAtMs;
  const latestMessage = groupChat.latestMessage;
  const messagePreview = latestMessage
    ? `${latestMessage.agentName ? `${latestMessage.agentName}：` : ""}${latestMessage.content}`
    : "群聊已创建，开始第一轮讨论吧。";

  return (
    <article className="group flex min-h-64 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-70 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-title">{groupChat.title}</h2>
            <p className="mt-1 text-caption text-muted-foreground">
              最近活跃于 {formatActivityTime(activityAt)}
            </p>
          </div>
          <Badge className="shrink-0" variant="secondary">
            <MessageCircle className="size-3.5" />
            {groupChat.messageCount}
          </Badge>
        </div>

        <p className="mt-5 line-clamp-2 min-h-12 text-body text-content-body">
          {messagePreview}
        </p>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center">
            <div className="flex -space-x-2">
              {activeMembers.slice(0, 4).map((member, index) => (
                <Avatar
                  className="size-9 rounded-xl border-2 border-card"
                  key={member.id}
                  style={{ zIndex: 4 - index }}
                  title={member.name}
                >
                  <AvatarFallback className="rounded-xl bg-muted text-caption">
                    {member.name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="ml-3 truncate text-caption text-muted-foreground">
              {activeMembers.map((member) => member.name).join("、")}
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-caption text-muted-foreground">
            <Users className="size-3.5" />
            {activeMembers.length}
          </span>
        </div>

        <div className="mt-auto pt-6">
          <Button asChild className="w-full rounded-xl" variant="outline">
            <Link href={`/group-chat/${encodeURIComponent(groupChat.id)}`}>
              进入群聊
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
