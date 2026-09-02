"use client";

import type { FormEvent, ReactNode } from "react";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import { CircleStop, LoaderCircle, SendHorizontal } from "lucide-react";

export function ChatComposer({
  canStop = true,
  disclaimer = "AI 生成内容可能有误，请在发送给客户前核对。",
  input,
  isRunning,
  onInputChange,
  onStop,
  onSubmit,
  placeholder = "输入消息，Enter 发送，Shift + Enter 换行",
}: {
  canStop?: boolean;
  disclaimer?: ReactNode;
  input: string;
  isRunning: boolean;
  onInputChange: (value: string) => void;
  onStop: () => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <footer className="bg-card p-3 sm:px-6 sm:py-4">
      <form
        className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-input bg-background p-2 shadow-sm transition-shadow focus-within:border-ring focus-within:shadow-focus"
        onSubmit={handleSubmit}
      >
        <Textarea
          aria-label="输入消息"
          className="max-h-36 min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:ring-0"
          disabled={isRunning}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          value={input}
        />
        {isRunning ? (
          <Button
            aria-label={canStop ? "停止生成" : "正在等待回复"}
            className="shrink-0 rounded-xl"
            disabled={!canStop}
            onClick={onStop}
            size="icon"
            type="button"
            variant="outline"
          >
            {canStop ? (
              <CircleStop className="size-4" />
            ) : (
              <LoaderCircle className="size-4 animate-spin" />
            )}
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
      {disclaimer ? (
        <p className="mx-auto mt-2 max-w-4xl text-center text-caption text-muted-foreground">
          {disclaimer}
        </p>
      ) : null}
    </footer>
  );
}
