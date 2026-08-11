"use client";

import type { RoleStatus } from "@repo/contracts/role";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { useRoles } from "../hooks/use-roles";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusLabels: Record<RoleStatus, string> = {
  active: "启用",
  deleted: "已删除",
  disabled: "停用",
};

const statusClassNames: Record<RoleStatus, string> = {
  active: "bg-primary/10 text-primary",
  deleted: "bg-destructive/10 text-destructive",
  disabled: "bg-muted text-muted-foreground",
};

function RoleListSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="正在加载角色列表">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="space-y-3" key={index}>
          <div className="flex items-center justify-between gap-4">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-6 w-14 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function RoleListCard() {
  const { error, isLoading, retry, roles } = useRoles();

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader>
        <CardTitle>角色列表</CardTitle>
        <CardDescription>
          查看当前管理应用中的全部角色，共 {roles.length} 个
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {isLoading ? (
          <RoleListSkeleton />
        ) : error ? (
          <div className="space-y-4">
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-body text-destructive"
            >
              {error}
            </div>
            <Button variant="outline" onClick={() => void retry()}>
              重新加载
            </Button>
          </div>
        ) : roles.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center">
            <p className="text-body font-medium text-foreground">暂无角色</p>
            <p className="mt-1 text-caption text-muted-foreground">
              使用上方表单创建第一个角色
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {roles.map((role) => (
              <article className="py-5 first:pt-0 last:pb-0" key={role.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-body font-semibold text-foreground">
                      {role.name}
                    </h2>
                    <code className="mt-1 block text-caption text-muted-foreground">
                      {role.code}
                    </code>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-caption font-medium ${statusClassNames[role.status]}`}
                  >
                    {statusLabels[role.status]}
                  </span>
                </div>
                <p className="mt-3 text-body text-muted-foreground">
                  {role.description || "暂无描述"}
                </p>
                <p className="mt-3 text-caption text-muted-foreground">
                  创建于 {dateFormatter.format(new Date(role.createdAtMs))}
                </p>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
