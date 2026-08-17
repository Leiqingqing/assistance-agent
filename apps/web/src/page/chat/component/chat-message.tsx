"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import type { UIMessage } from "ai";
import { Bot } from "lucide-react";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";

const streamdownPlugins = { cjk, code, math, mermaid };
const CHARACTER_INTERVAL_MS = 18;
const TYPEWRITER_CHARS_PER_STEP = 1;

const characterSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function splitTextCharacters(text: string) {
  if (characterSegmenter) {
    return Array.from(
      characterSegmenter.segment(text),
      ({ segment }) => segment,
    );
  }

  return Array.from(text);
}

export function ChatMessage({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  const textParts = message.parts.filter((part) => part.type === "text");
  const fullText = textParts.map((part) => part.text).join("");
  const fullCharacters = useMemo(
    () => splitTextCharacters(fullText),
    [fullText],
  );
  const [visibleText, setVisibleText] = useState(
    message.role === "assistant" && isStreaming
      ? fullCharacters.slice(0, TYPEWRITER_CHARS_PER_STEP).join("")
      : fullText,
  );

  useEffect(() => {
    if (message.role !== "assistant") {
      return;
    }

    if (!fullText.startsWith(visibleText)) {
      setVisibleText(
        fullCharacters.slice(0, TYPEWRITER_CHARS_PER_STEP).join(""),
      );
      return;
    }

    const visibleCharacterCount = splitTextCharacters(visibleText).length;
    if (visibleCharacterCount >= fullCharacters.length) {
      return;
    }

    if (visibleCharacterCount === 0) {
      setVisibleText(
        fullCharacters.slice(0, TYPEWRITER_CHARS_PER_STEP).join(""),
      );
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisibleText(
        fullCharacters
          .slice(0, visibleCharacterCount + TYPEWRITER_CHARS_PER_STEP)
          .join(""),
      );
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

  if (!fullText) {
    return null;
  }

  const isAnimating = isStreaming || visibleText !== fullText;

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
          isAnimating={isAnimating}
          mode={isAnimating ? "streaming" : "static"}
          plugins={streamdownPlugins}
        >
          {visibleText}
        </Streamdown>
      </div>
    </div>
  );
}

export function ChatLoadingBubble() {
  return (
    <div className="flex max-w-[min(48rem,94%)] items-start gap-3">
      <Avatar className="mt-1 size-8 rounded-xl">
        <AvatarFallback className="rounded-xl bg-secondary text-secondary-foreground">
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>
      <span
        aria-label="AI 正在生成回复"
        className="inline-flex min-h-12 items-center gap-1 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-xs"
        role="status"
      >
        <i className="size-1.5 animate-bounce rounded-full bg-primary" />
        <i className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
        <i className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
      </span>
    </div>
  );
}
