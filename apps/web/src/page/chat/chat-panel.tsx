"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type {
  AgentCompanionListResponse,
  AgentConversationResponse,
} from "@repo/contracts";
import { useQuery } from "@tanstack/react-query";
import { TextStreamChatTransport, type UIMessage } from "ai";
import { Bot, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import {
  getAgentConversation,
  getEarlierAgentMessages,
  getInboxChatUrl,
} from "@/api/chat";
import { readClientSession } from "@/auth/client-sessions";
import { ChatBox } from "./component/chat-box";

function toInitialMessages(
  conversation: AgentConversationResponse,
): UIMessage[] {
  if (conversation.messages.length > 0) {
    return conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      parts: [{ type: "text", text: message.content }],
    }));
  }

  return conversation.openingMessage
    ? [
        {
          id: `opening-${conversation.conversationId}`,
          role: "assistant",
          parts: [{ type: "text", text: conversation.openingMessage }],
        },
      ]
    : [];
}

function LoadedChatPanel({
  agent,
  conversation,
}: {
  agent: AgentCompanionListResponse["agents"][number];
  conversation: AgentConversationResponse;
}) {
  const [input, setInput] = useState("");
  const [nextCursor, setNextCursor] = useState(conversation.nextCursor);
  const initialMessages = useMemo(
    () => toInitialMessages(conversation),
    [conversation],
  );
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: getInboxChatUrl(),
        prepareSendMessagesRequest: ({ messages }) => {
          const session = readClientSession();

          return {
            body: {
              conversationId: conversation.conversationId,
              messages: messages.slice(-20),
            },
            headers:
              session === null
                ? undefined
                : {
                    Authorization: `${session.tokenType} ${session.accessToken}`,
                  },
          };
        },
      }),
    [conversation.conversationId],
  );
  const {
    error,
    messages,
    regenerate,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    id: conversation.conversationId,
    messages: initialMessages,
    transport,
  });
  const isRunning = status === "submitted" || status === "streaming";
  const latestMessage = messages.at(-1);
  const latestAssistantText =
    latestMessage?.role === "assistant"
      ? latestMessage.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("")
      : "";
  const isWaitingForAssistantText = isRunning && !latestAssistantText;

  const loadEarlierMessages = async () => {
    if (!nextCursor) {
      return;
    }

    const earlierConversation = await getEarlierAgentMessages(
      agent.id,
      nextCursor,
    );
    const earlierMessages = toInitialMessages(earlierConversation);

    setMessages((currentMessages) => {
      const currentIds = new Set(currentMessages.map((message) => message.id));
      return [
        ...earlierMessages.filter((message) => !currentIds.has(message.id)),
        ...currentMessages,
      ];
    });
    setNextCursor(earlierConversation.nextCursor);
  };

  const submitPrompt = async (text: string) => {
    const value = text.trim();
    if (!value || isRunning) {
      return;
    }

    setInput("");
    await sendMessage({ text: value });
  };

  return (
    <ChatBox
      canLoadEarlier={Boolean(nextCursor)}
      emptyContent={
        <p className="my-auto text-center text-body text-muted-foreground">
          向 {agent.name} 发送第一条消息吧。
        </p>
      }
      error={error}
      header={
        <header className="flex min-h-20 items-center justify-between gap-4 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Bot className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-semibold text-foreground">
                {agent.name}
              </h1>
              <p className="truncate text-caption text-muted-foreground">
                {agent.headline ?? agent.description ?? "AI 陪伴助手"}
              </p>
            </div>
          </div>
          <Badge
            className="hidden bg-muted text-muted-foreground sm:flex"
            variant="outline"
          >
            <Sparkles className="size-3.5 text-primary" />
            AI Agent
          </Badge>
        </header>
      }
      input={input}
      isRunning={isRunning}
      isStreaming={status === "streaming"}
      isWaitingForReply={isWaitingForAssistantText}
      messages={messages}
      onInputChange={setInput}
      onLoadEarlier={loadEarlierMessages}
      onRetry={() => void regenerate()}
      onStop={stop}
      onSubmit={() => void submitPrompt(input)}
    />
  );
}

export function ChatPanel({
  agent,
}: {
  agent: AgentCompanionListResponse["agents"][number];
}) {
  const conversationQuery = useQuery({
    queryKey: ["agent-conversation", agent.id],
    queryFn: () => getAgentConversation(agent.id),
  });

  if (conversationQuery.isPending) {
    return (
      <section className="grid min-h-0 place-items-center bg-card text-muted-foreground">
        <p className="flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" />
          正在加载对话…
        </p>
      </section>
    );
  }

  if (conversationQuery.isError) {
    return (
      <section className="grid min-h-0 place-items-center bg-card px-6 text-center text-muted-foreground">
        <div>
          <p>对话加载失败。</p>
          <Button
            className="mt-3"
            onClick={() => void conversationQuery.refetch()}
            size="sm"
            variant="outline"
          >
            <RotateCcw className="size-3.5" />
            重试
          </Button>
        </div>
      </section>
    );
  }

  return (
    <LoadedChatPanel
      agent={agent}
      conversation={conversationQuery.data}
      key={conversationQuery.data.conversationId}
    />
  );
}
