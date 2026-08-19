"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { TextStreamChatTransport, type UIMessage } from "ai";
import { Bot, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { StickToBottom } from "use-stick-to-bottom";
import {
  getAgentConversation,
  getInboxChatUrl,
  type AgentCompanion,
  type AgentConversation,
} from "@/api/chat";
import { readClientSession } from "@/auth/client-sessions";
import { ChatComposer } from "./component/chat-composer";
import { ChatLoadingBubble, ChatMessage } from "./component/chat-message";
import { ScrollToBottomButton } from "./component/scroll-to-bottom-button";

function toInitialMessages(conversation: AgentConversation): UIMessage[] {
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
  agent: AgentCompanion;
  conversation: AgentConversation;
}) {
  const [input, setInput] = useState("");
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
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
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

  const submitPrompt = async (text: string) => {
    const value = text.trim();
    if (!value || isRunning) {
      return;
    }

    setInput("");
    await sendMessage({ text: value });
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
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
      <Separator />

      <StickToBottom
        className="relative min-h-0 flex-1 overflow-y-auto bg-background"
        initial="instant"
        resize="smooth"
      >
        <StickToBottom.Content className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
          {messages.length === 0 ? (
            <p className="my-auto text-center text-body text-muted-foreground">
              向 {agent.name} 发送第一条消息吧。
            </p>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                isStreaming={
                  status === "streaming" && index === messages.length - 1
                }
                key={message.id}
                message={message}
              />
            ))
          )}

          {isWaitingForAssistantText ? <ChatLoadingBubble /> : null}

          {error ? (
            <Card
              className="border-destructive/35 bg-destructive/10 text-destructive shadow-none"
              role="alert"
            >
              <CardContent className="p-4">
                <p>消息发送失败，请确认 API 子站已启动并允许当前 Web 来源。</p>
                <Button
                  className="mt-2 h-auto p-0 text-destructive"
                  onClick={() => void regenerate()}
                  size="sm"
                  variant="ghost"
                >
                  <RotateCcw className="size-3.5" />
                  重试
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </StickToBottom.Content>
        <ScrollToBottomButton />
      </StickToBottom>

      <Separator />
      <ChatComposer
        input={input}
        isRunning={isRunning}
        onInputChange={setInput}
        onStop={stop}
        onSubmit={() => void submitPrompt(input)}
      />
    </section>
  );
}

export function ChatPanel({ agent }: { agent: AgentCompanion }) {
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
