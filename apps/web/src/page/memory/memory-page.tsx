"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Memory } from "@repo/contracts/memory";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Label } from "@repo/ui/label";
import {
  ArrowLeft,
  Brain,
  LoaderCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { listAgentCompanions } from "@/api/chat";
import {
  useCreateMemoryMutation,
  useDeleteMemoryMutation,
  useMemoriesQuery,
  useUpdateMemoryMutation,
} from "./hooks/use-memories";
import {
  MemoryForm,
  type MemoryFormValues,
} from "./component/memory-form";
import { MemoryList } from "./component/memory-list";

type StatusFilter = "all" | "active" | "disabled";
type EditorState =
  | { mode: "create"; key: number }
  | { mode: "edit"; memory: Memory }
  | null;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。";
}

export default function MemoryPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const agentsQuery = useQuery({
    queryKey: ["agent-companions"],
    queryFn: listAgentCompanions,
  });
  const agents = useMemo(() => agentsQuery.data ?? [], [agentsQuery.data]);
  const selectedAgent =
    agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;
  const memoriesQuery = useMemoriesQuery(
    selectedAgent?.id ?? null,
    statusFilter === "all" ? undefined : statusFilter,
  );
  const createMutation = useCreateMemoryMutation(selectedAgent?.id ?? null);
  const updateMutation = useUpdateMemoryMutation(selectedAgent?.id ?? null);
  const deleteMutation = useDeleteMemoryMutation(selectedAgent?.id ?? null);

  useEffect(() => {
    if (selectedAgentId === null && agents[0]) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  function closeEditor() {
    setEditor(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function selectAgent(agentId: string) {
    setSelectedAgentId(agentId);
    setEditor(null);
    setDeleteError(null);
  }

  async function saveMemory(values: MemoryFormValues) {
    if (!selectedAgent) {
      return;
    }

    if (editor?.mode === "edit") {
      await updateMutation.mutateAsync({
        memoryId: editor.memory.id,
        request: values,
      });
    } else {
      await createMutation.mutateAsync({
        agentId: selectedAgent.id,
        type: values.type,
        content: values.content,
        importance: values.importance,
      });
    }

    closeEditor();
  }

  async function removeMemory(memory: Memory) {
    if (!window.confirm("确定删除这条记忆吗？此操作无法撤销。")) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(memory.id);
      if (editor?.mode === "edit" && editor.memory.id === memory.id) {
        closeEditor();
      }
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    }
  }

  const editorMemory = editor?.mode === "edit" ? editor.memory : null;
  const editorMutation =
    editor?.mode === "edit" ? updateMutation : createMutation;

  return (
    <main className="min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="overflow-hidden rounded-3xl border border-border bg-card shadow-md">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Brain className="size-5" />
                </div>
                <div>
                  <p className="text-caption uppercase text-primary">
                    Personal Memory
                  </p>
                  <h1 className="text-display">记忆管理</h1>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-body-lg text-muted-foreground">
                查看和管理 Agent 记住的信息，让每次对话都延续你的偏好与背景。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/chat">
                  <ArrowLeft className="size-4" />
                  返回聊天
                </Link>
              </Button>
              <Button
                disabled={!selectedAgent}
                onClick={() => {
                  createMutation.reset();
                  setEditor({ mode: "create", key: Date.now() });
                }}
              >
                <Plus className="size-4" />
                新增记忆
              </Button>
            </div>
          </div>
        </header>

        {agentsQuery.isPending ? (
          <div className="grid min-h-80 place-items-center text-muted-foreground">
            <p className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载 Agent…
            </p>
          </div>
        ) : agentsQuery.isError ? (
          <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            Agent 列表加载失败，请确认登录状态和 API 服务。
          </div>
        ) : agents.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <div>
              <Sparkles className="mx-auto size-8 text-primary" />
              <p className="mt-4 font-semibold">还没有可管理的 Agent</p>
              <p className="mt-1 text-body text-muted-foreground">
                创建 Agent 后即可为它管理记忆。
              </p>
            </div>
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-2">
                <Label htmlFor="memory-agent">当前 Agent</Label>
                <select
                  className="h-10 min-w-64 rounded-lg border border-input bg-background px-3 text-body shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="memory-agent"
                  onChange={(event) => selectAgent(event.target.value)}
                  value={selectedAgent?.id ?? ""}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-caption text-muted-foreground">
                  状态筛选
                </span>
                {(
                  [
                    ["all", "全部"],
                    ["active", "已启用"],
                    ["disabled", "已停用"],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    size="sm"
                    variant={statusFilter === value ? "secondary" : "ghost"}
                  >
                    {label}
                  </Button>
                ))}
                <Badge variant="outline">
                  {memoriesQuery.data?.length ?? 0} 条
                </Badge>
              </div>
            </section>

            {deleteError ? (
              <p
                className="rounded-xl bg-destructive/10 px-4 py-3 text-body text-destructive"
                role="alert"
              >
                {deleteError}
              </p>
            ) : null}

            <section
              className={
                editor
                  ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start"
                  : "grid"
              }
            >
              <div>
                <MemoryList
                  deletingId={
                    deleteMutation.isPending
                      ? (deleteMutation.variables ?? null)
                      : null
                  }
                  error={memoriesQuery.isError}
                  isFetching={memoriesQuery.isFetching}
                  isPending={memoriesQuery.isPending}
                  memories={memoriesQuery.data ?? []}
                  onDelete={(memory) => void removeMemory(memory)}
                  onEdit={(memory) => {
                    updateMutation.reset();
                    setEditor({ mode: "edit", memory });
                  }}
                  onRetry={() => void memoriesQuery.refetch()}
                />
              </div>

              {editor ? (
                <MemoryForm
                  busy={editorMutation.isPending}
                  error={
                    editorMutation.isError
                      ? getErrorMessage(editorMutation.error)
                      : null
                  }
                  key={
                    editor.mode === "edit"
                      ? editor.memory.id
                      : `create-${editor.key}`
                  }
                  memory={editorMemory}
                  onCancel={closeEditor}
                  onSubmit={saveMemory}
                />
              ) : null}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
