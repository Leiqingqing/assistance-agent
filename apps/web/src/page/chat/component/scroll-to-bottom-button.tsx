"use client";

import { Button } from "@repo/ui/button";
import { ArrowDown } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";

export function ScrollToBottomButton() {
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
