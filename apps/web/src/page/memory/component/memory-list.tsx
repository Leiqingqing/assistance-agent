"use client";

import type { Memory } from "@repo/contracts/memory";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import {
  Brain,
  LoaderCircle,
  Pencil,
  RotateCw,
  Trash2,
} from "lucide-react";

function formatTime(value: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function MemoryItem({
  deleting,
  memory,
  onDelete,
  onEdit,
}: {
  deleting: boolean;
  memory: Memory;
  onDelete: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
}) {
  return (
    <Card
      className={
        memory.status === "disabled"
          ? "border-dashed bg-muted/35 opacity-80"
          : "bg-card"
      }
    >
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={memory.status === "active" ? "secondary" : "outline"}>
              {memory.status === "active" ? "已启用" : "已停用"}
            </Badge>
            <Badge variant="outline">{memory.type}</Badge>
            <span
              aria-label={`重要程度 ${memory.importance}`}
              className="text-caption text-primary"
            >
              {"●".repeat(memory.importance)}
              <span className="text-border">
                {"●".repeat(5 - memory.importance)}
              </span>
            </span>
          </div>
          <time className="text-caption text-muted-foreground">
            更新于 {formatTime(memory.updatedAtMs)}
          </time>
        </div>

        <p className="whitespace-pre-wrap text-body leading-7 text-foreground">
          {memory.content}
        </p>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          <Button
            disabled={deleting}
            onClick={() => onEdit(memory)}
            size="sm"
            variant="ghost"
          >
            <Pencil className="size-3.5" />
            编辑
          </Button>
          <Button
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={deleting}
            onClick={() => onDelete(memory)}
            size="sm"
            variant="ghost"
          >
            {deleting ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MemoryList({
  deletingId,
  error,
  isFetching,
  isPending,
  memories,
  onDelete,
  onEdit,
  onRetry,
}: {
  deletingId: string | null;
  error: boolean;
  isFetching: boolean;
  isPending: boolean;
  memories: readonly Memory[];
  onDelete: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
  onRetry: () => void;
}) {
  if (isPending) {
    return (
      <div className="grid min-h-64 place-items-center text-muted-foreground">
        <p className="flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" />
          正在加载记忆…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div>
          <p className="text-body text-muted-foreground">记忆加载失败，请稍后重试。</p>
          <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
            <RotateCw className="size-4" />
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
            <Brain className="size-6" />
          </div>
          <p className="mt-4 font-semibold text-foreground">还没有记忆</p>
          <p className="mt-1 text-body text-muted-foreground">
            点击“新增记忆”，让 Agent 更了解你。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative grid gap-3">
      {isFetching ? (
        <LoaderCircle className="absolute -top-9 right-0 size-4 animate-spin text-muted-foreground" />
      ) : null}
      {memories.map((memory) => (
        <MemoryItem
          deleting={deletingId === memory.id}
          key={memory.id}
          memory={memory}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
