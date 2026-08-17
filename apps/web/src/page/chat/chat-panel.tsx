"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
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
import { Separator } from "@repo/ui/separator";
import { Textarea } from "@repo/ui/textarea";
import { TextStreamChatTransport, type UIMessage } from "ai";
import {
  ArrowDown,
  Bot,
  CircleStop,
  Mail,
  RotateCcw,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { getInboxChatUrl } from "@/api/chat";
import { readClientSession } from "@/auth/client-sessions";
import type { InboxConversation } from "./inbox-conversations";

const streamdownPlugins = { cjk, code, math, mermaid };
const CHARACTER_INTERVAL_MS = 18;

const suggestions = [
  "帮我概括客户的诉求",
  "起草一封礼貌的回复",
  "给出下一步处理建议",
] as const;

function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) {
    return null;
  }

  return (
    <Button
      aria-label="滚动到最新消息"
      className="absolute bottom-4 left-1/2 z-10 size-9 -translate-x-1/2 rounded-full bg-card"
      onClick={() => scrollToBottom()}
      size="icon"
      variant="outline"
    >
      <ArrowDown className="size-4" />
    </Button>
  );
}

function MessageContent({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  const textParts = message.parts.filter((part) => part.type === "text");
  const fullText = textParts.map((part) => part.text).join("");
  const fullCharacters = useMemo(() => Array.from(fullText), [fullText]);
  const [visibleText, setVisibleText] = useState(
    message.role === "assistant" && isStreaming ? "" : fullText,
  );

  useEffect(() => {
    if (message.role !== "assistant") {
      return;
    }

    if (!fullText.startsWith(visibleText)) {
      setVisibleText("");
      return;
    }

    const visibleCharacterCount = Array.from(visibleText).length;
    if (visibleCharacterCount >= fullCharacters.length) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisibleText(fullCharacters.slice(0, visibleCharacterCount + 1).join(""));
    }, CHARACTER_INTERVAL_MS);

    return () => window.clearTimeout(timeout);
  }, [fullCharacters, fullText, message.role, visibleText]);

  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[min(42rem,88%)] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-body text-primary-foreground shadow-xs">
        {textParts.map((part, index) => (
          <p className="whitespace-pre-wrap" key={`${message.id}-${index}`}>
            {part.text}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="flex max-w-[min(48rem,94%)] items-start gap-3">
      <Avatar className="mt-1 size-8 rounded-xl">
        <AvatarFallback className="rounded-xl bg-secondary text-secondary-foreground">
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 text-body text-content-body shadow-xs">
        <Streamdown
          animated
          className="chat-markdown"
          controls
          isAnimating={isStreaming || visibleText !== fullText}
          mode={isStreaming || visibleText !== fullText ? "streaming" : "static"}
          plugins={streamdownPlugins}
        >
          {visibleText}
        </Streamdown>
      </div>
    </div>
  );
}

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitPrompt(input);
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
            <Card className="my-auto w-full bg-card/80">
              <CardHeader className="items-center text-center">
                <Avatar className="size-14 rounded-2xl shadow-sm">
                  <AvatarFallback className="rounded-2xl bg-secondary text-secondary-foreground">
                    <Sparkles className="size-6" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle>如何协助处理这条消息？</CardTitle>
                <CardDescription className="max-w-xl">
                  我已获得当前邮件的主题、发送方与摘要，可以帮你整理诉求、分析问题或起草回复。
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    className="rounded-full"
                    key={suggestion}
                    onClick={() => void submitPrompt(suggestion)}
                    size="sm"
                    variant="outline"
                  >
                    {suggestion}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : (
            messages.map((message, index) => (
              <MessageContent
                isStreaming={
                  status === "streaming" && index === messages.length - 1
                }
                key={message.id}
                message={message}
              />
            ))
          )}

          {isWaitingForAssistantText ? (
            <div className="flex items-center gap-3 text-body text-muted-foreground">
              <Avatar className="size-8 rounded-xl">
                <AvatarFallback className="rounded-xl bg-secondary text-secondary-foreground">
                  <Bot className="size-4" />
                </AvatarFallback>
              </Avatar>
              <span className="inline-flex items-center gap-1">
                <i className="size-1.5 animate-bounce rounded-full bg-primary" />
                <i className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                <i className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
              </span>
            </div>
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
      <footer className="bg-card p-3 sm:px-6 sm:py-4">
        <form
          className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-input bg-background p-2 shadow-sm transition-shadow focus-within:border-ring focus-within:shadow-focus"
          onSubmit={handleSubmit}
        >
          <Textarea
            aria-label="输入消息"
            className="max-h-36 min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:ring-0"
            disabled={isRunning}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitPrompt(input);
              }
            }}
            placeholder="输入消息，Enter 发送，Shift + Enter 换行"
            rows={1}
            value={input}
          />
          {isRunning ? (
            <Button
              aria-label="停止生成"
              className="shrink-0 rounded-xl"
              onClick={stop}
              size="icon"
              type="button"
              variant="outline"
            >
              <CircleStop className="size-4" />
            </Button>
          ) : (
            <Button
              aria-label="发送消息"
              className="shrink-0 rounded-xl"
              disabled={!input.trim()}
              size="icon"
              type="submit"
            >
              <SendHorizontal className="size-4" />
            </Button>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-4xl text-center text-caption text-muted-foreground">
          AI 生成内容可能有误，请在发送给客户前核对。
        </p>
      </footer>
    </section>
  );
}
