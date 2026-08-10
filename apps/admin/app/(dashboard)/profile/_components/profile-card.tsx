"use client";

import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { useAdminProfile } from "../hooks/use-admin-profile";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function ProfileCardSkeleton() {
  return (
    <Card className="overflow-hidden shadow-lg" aria-label="正在加载管理员资料">
      <CardHeader className="animate-pulse space-y-4">
        <div className="size-20 rounded-full bg-muted" />
        <div className="h-7 w-36 rounded bg-muted" />
        <div className="h-5 w-52 rounded bg-muted" />
      </CardHeader>
      <Separator />
      <CardContent className="grid animate-pulse gap-5 pt-6 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="space-y-2" key={index}>
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-5 w-32 rounded bg-muted" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ProfileCard() {
  const { error, isLoading, profile, retry } = useAdminProfile();

  if (isLoading) {
    return <ProfileCardSkeleton />;
  }

  if (error || !profile) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>资料加载失败</CardTitle>
          <CardDescription>{error ?? "暂时无法获取管理员资料"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void retry()}>重新加载</Button>
        </CardContent>
      </Card>
    );
  }

  const details = [
    { label: "管理员 ID", value: profile.id },
    { label: "角色", value: profile.role },
    { label: "所属部门", value: profile.department },
    { label: "手机号", value: profile.phone },
    { label: "最近登录", value: formatDate(profile.lastLoginAt) },
    { label: "账号创建时间", value: formatDate(profile.createdAt) },
  ];

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="bg-primary/5 sm:flex-row sm:items-center sm:gap-5 sm:space-y-0">
        <div
          aria-hidden="true"
          className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-title text-primary-foreground shadow-sm"
        >
          {profile.name.slice(0, 1)}
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{profile.name}</CardTitle>
            <span className="rounded-full bg-accent px-2.5 py-1 text-caption text-accent-foreground">
              {profile.status === "active" ? "账号正常" : "账号停用"}
            </span>
          </div>
          <CardDescription>{profile.email}</CardDescription>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="grid gap-x-10 gap-y-6 pt-6 sm:grid-cols-2">
        {details.map((detail) => (
          <div className="space-y-1" key={detail.label}>
            <p className="text-caption text-muted-foreground">{detail.label}</p>
            <p className="text-body font-medium text-foreground">
              {detail.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
