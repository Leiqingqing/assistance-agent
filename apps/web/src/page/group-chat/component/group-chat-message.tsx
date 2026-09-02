import type { AgentGroupChatMessage } from "@repo/contracts/group-chat";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Bot, Info } from "lucide-react";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";

const streamdownPlugins = { cjk, code, math, mermaid };

function formatMessageTime(value: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function GroupChatMessage({
  message,
}: {
  message: AgentGroupChatMessage;
}) {
  if (message.senderType === "system") {
    return (
      <p className="mx-auto flex max-w-xl items-center gap-2 rounded-full bg-muted px-4 py-2 text-center text-caption text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        {message.content}
      </p>
    );
  }

  if (message.senderType === "user") {
    return (
      <div className="ml-auto max-w-[min(42rem,88%)]">
        <div className="rounded-2xl rounded-br-md bg-primary px-4 py-3 text-body text-primary-foreground shadow-xs">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <time className="mt-1 block text-right text-caption text-muted-foreground">
          {formatMessageTime(message.createdAtMs)}
        </time>
      </div>
    );
  }

  return (
    <div className="flex max-w-[min(48rem,94%)] items-start gap-3">
      <Avatar className="mt-1 size-8 rounded-xl">
        <AvatarFallback className="rounded-xl bg-secondary text-secondary-foreground">
          {message.agentName?.slice(0, 1) ?? <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-caption">
          <strong className="text-foreground">
            {message.agentName ?? "Agent"}
          </strong>
          <time className="text-muted-foreground">
            {formatMessageTime(message.createdAtMs)}
          </time>
        </div>
        <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 text-body text-content-body shadow-xs">
          <Streamdown
            className="chat-markdown"
            controls
            mode="static"
            plugins={streamdownPlugins}
          >
            {message.content}
          </Streamdown>
        </div>
      </div>
    </div>
  );
}
