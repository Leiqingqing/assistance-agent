"use client";

import { useState, type FormEvent } from "react";
import type { Memory } from "@repo/contracts/memory";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { LoaderCircle, Save, X } from "lucide-react";

export interface MemoryFormValues {
  type: string;
  content: string;
  importance: number;
  status: "active" | "disabled";
}

export function MemoryForm({
  busy,
  error,
  memory,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  error: string | null;
  memory: Memory | null;
  onCancel: () => void;
  onSubmit: (values: MemoryFormValues) => Promise<void>;
}) {
  const [type, setType] = useState(memory?.type ?? "");
  const [content, setContent] = useState(memory?.content ?? "");
  const [importance, setImportance] = useState(memory?.importance ?? 3);
  const [status, setStatus] = useState<"active" | "disabled">(
    memory?.status === "disabled" ? "disabled" : "active",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onSubmit({
        type: type.trim(),
        content: content.trim(),
        importance,
        status,
      });
    } catch {
      // Mutation state is rendered by the parent form.
    }
  }

  return (
    <Card className="sticky top-6 overflow-hidden shadow-md">
      <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
      <CardHeader>
        <CardTitle>{memory ? "编辑记忆" : "新增记忆"}</CardTitle>
        <CardDescription>
          {memory
            ? "调整记忆内容、重要程度或启用状态。"
            : "为当前 Agent 添加一条需要长期保留的信息。"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="memory-type">类型</Label>
            <Input
              autoFocus
              disabled={busy}
              id="memory-type"
              maxLength={64}
              onChange={(event) => setType(event.target.value)}
              placeholder="例如：偏好、背景、目标"
              required
              value={type}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="memory-content">记忆内容</Label>
              <span className="text-caption text-muted-foreground">
                {content.length}/4000
              </span>
            </div>
            <Textarea
              className="min-h-36 resize-y"
              disabled={busy}
              id="memory-content"
              maxLength={4000}
              onChange={(event) => setContent(event.target.value)}
              placeholder="输入希望 Agent 记住的内容"
              required
              value={content}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="memory-importance">重要程度</Label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-body shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                disabled={busy}
                id="memory-importance"
                onChange={(event) => setImportance(Number(event.target.value))}
                value={importance}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 1 ? "· 一般" : value === 5 ? "· 重要" : ""}
                  </option>
                ))}
              </select>
            </div>

            {memory ? (
              <div className="grid gap-2">
                <Label htmlFor="memory-status">状态</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-body shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  disabled={busy}
                  id="memory-status"
                  onChange={(event) =>
                    setStatus(event.target.value as "active" | "disabled")
                  }
                  value={status}
                >
                  <option value="active">已启用</option>
                  <option value="disabled">已停用</option>
                </select>
              </div>
            ) : null}
          </div>

          {error ? (
            <p
              className="rounded-xl bg-destructive/10 px-3 py-2 text-body text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              disabled={busy}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              <X className="size-4" />
              取消
            </Button>
            <Button
              disabled={busy || !type.trim() || !content.trim()}
              type="submit"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {busy ? "保存中…" : "保存"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
