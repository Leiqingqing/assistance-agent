"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { TextStreamChatTransport } from "ai";
import { Mail, RotateCcw, Sparkles } from "lucide-react";
import { StickToBottom } from "use-stick-to-bottom";
import { getInboxChatUrl } from "@/api/chat";
import { readClientSession } from "@/auth/client-sessions";
import { ChatComposer } from "./component/chat-composer";
import { ChatEmptyState } from "./component/chat-empty-state";
import {
  ChatLoadingBubble,
  ChatMessage,
} from "./component/chat-message";
import { ScrollToBottomButton } from "./component/scroll-to-bottom-button";
import type { InboxConversation } from "./inbox-conversations";

export function ChatPanel({
  conversation,
}: {
  conversation: InboxConversation;
}) {
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: getInboxChatUrl(),
        prepareSendMessagesRequest: ({ messages }) => {
          const session = readClientSession();

          return {
            body: {
              messages,
              mail: conversation.mail,
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
    [conversation.mail],
  );
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
    id: conversation.id,
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
            <Mail className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-foreground">
              {conversation.mail.subject}
            </h1>
            <p className="truncate text-caption text-muted-foreground">
              {conversation.mail.sender} · {conversation.mail.senderEmail}
            </p>
          </div>
        </div>
        <Badge
          className="hidden bg-muted text-muted-foreground sm:flex"
          variant="outline"
        >
          <Sparkles className="size-3.5 text-primary" />
          AI 客服助手
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
            <ChatEmptyState
              onSelectSuggestion={(suggestion) =>
                void submitPrompt(suggestion)
              }
            />
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

          {isWaitingForAssistantText ? (
            <ChatLoadingBubble />
          ) : null}

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
