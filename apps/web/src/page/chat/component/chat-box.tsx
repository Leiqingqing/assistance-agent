"use client";

import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import type { UIMessage } from "ai";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { StickToBottom, type StickToBottomContext } from "use-stick-to-bottom";
import { ChatComposer } from "./chat-composer";
import { ChatLoadingBubble, ChatMessage } from "./chat-message";
import { ScrollToBottomButton } from "./scroll-to-bottom-button";

type MessageRenderContext = {
  isStreaming: boolean;
};

export type ChatBoxProps = {
  header: ReactNode;
  footer?: ReactNode;
  messages: UIMessage[];
  input: string;
  isRunning: boolean;
  isStreaming: boolean;
  canStop?: boolean;
  isWaitingForReply?: boolean;
  canLoadEarlier?: boolean;
  emptyContent?: ReactNode;
  error?: Error | null;
  composerPlaceholder?: string;
  composerDisclaimer?: ReactNode;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onRetry?: () => void;
  onLoadEarlier?: () => Promise<void>;
  renderMessage?: (
    message: UIMessage,
    index: number,
    context: MessageRenderContext,
  ) => ReactNode;
  loadingContent?: ReactNode;
};

export function ChatBox({
  header,
  footer,
  messages,
  input,
  isRunning,
  isStreaming,
  canStop = true,
  isWaitingForReply = false,
  canLoadEarlier = false,
  emptyContent,
  error,
  composerPlaceholder,
  composerDisclaimer,
  onInputChange,
  onSubmit,
  onStop,
  onRetry,
  onLoadEarlier,
  renderMessage,
  loadingContent,
}: ChatBoxProps) {
  const [isAtTop, setIsAtTop] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [earlierMessagesError, setEarlierMessagesError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomContextRef = useRef<StickToBottomContext | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const scrollContainer =
        stickToBottomContextRef.current?.scrollRef.current;

      if (scrollContainer instanceof HTMLDivElement) {
        scrollContainerRef.current = scrollContainer;
        setIsAtTop(scrollContainer.scrollTop <= 1);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const loadEarlierMessages = async () => {
    if (!onLoadEarlier || !canLoadEarlier || isLoadingEarlier) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const previousScrollHeight = scrollContainer?.scrollHeight ?? 0;
    const previousScrollTop = scrollContainer?.scrollTop ?? 0;

    setIsLoadingEarlier(true);
    setEarlierMessagesError(false);

    try {
      await onLoadEarlier();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop =
              previousScrollTop +
              (scrollContainer.scrollHeight - previousScrollHeight);
          }
        });
      });
    } catch {
      setEarlierMessagesError(true);
    } finally {
      setIsLoadingEarlier(false);
    }
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
      {header}
      <Separator />

      <StickToBottom
        className="relative min-h-0 flex-1 overflow-y-auto bg-background"
        contextRef={stickToBottomContextRef}
        initial="instant"
        onScroll={(event) => {
          scrollContainerRef.current = event.currentTarget;
          setIsAtTop(event.currentTarget.scrollTop <= 1);
        }}
        resize="smooth"
      >
        <StickToBottom.Content className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
          {isAtTop && canLoadEarlier && onLoadEarlier ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                disabled={isLoadingEarlier}
                onClick={() => void loadEarlierMessages()}
                size="sm"
                variant="outline"
              >
                {isLoadingEarlier ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : null}
                查看更早消息
              </Button>
              {earlierMessagesError ? (
                <p className="text-caption text-destructive">
                  更早消息加载失败，请重试。
                </p>
              ) : null}
            </div>
          ) : null}

          {messages.length === 0
            ? (emptyContent ?? (
                <p className="my-auto text-center text-body text-muted-foreground">
                  发送第一条消息吧。
                </p>
              ))
            : messages.map((message, index) =>
                renderMessage ? (
                  <Fragment key={message.id}>
                    {renderMessage(message, index, {
                      isStreaming: isStreaming && index === messages.length - 1,
                    })}
                  </Fragment>
                ) : (
                  <ChatMessage
                    isStreaming={isStreaming && index === messages.length - 1}
                    key={message.id}
                    message={message}
                  />
                ),
              )}

          {isWaitingForReply ? (loadingContent ?? <ChatLoadingBubble />) : null}

          {error ? (
            <Card
              className="border-destructive/35 bg-destructive/10 text-destructive shadow-none"
              role="alert"
            >
              <CardContent className="p-4">
                <p>消息发送失败，请确认服务状态后重试。</p>
                {onRetry ? (
                  <Button
                    className="mt-2 h-auto p-0 text-destructive"
                    onClick={onRetry}
                    size="sm"
                    variant="ghost"
                  >
                    <RotateCcw className="size-3.5" />
                    重试
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </StickToBottom.Content>
        <ScrollToBottomButton />
      </StickToBottom>

      <Separator />
      {footer ?? (
        <ChatComposer
          canStop={canStop}
          disclaimer={composerDisclaimer}
          input={input}
          isRunning={isRunning}
          onInputChange={onInputChange}
          onStop={onStop}
          onSubmit={onSubmit}
          placeholder={composerPlaceholder}
        />
      )}
    </section>
  );
}
