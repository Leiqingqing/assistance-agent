import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { CreateRoleCard } from "./_components/create-role-card";
import { RoleListCard } from "./_components/role-list-card";

export const metadata: Metadata = {
  title: "角色管理 | Assistance Agent Admin",
};

export default function RolePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-20 size-80 rounded-full bg-accent/40 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-4xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-body font-medium text-primary">
              Assistance Agent
            </p>
            <h1 className="text-title text-foreground">角色管理</h1>
            <p className="mt-2 text-body text-muted-foreground">
              创建角色并查看当前管理应用的角色信息
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">返回首页</Link>
          </Button>
        </header>

        <div className="space-y-6">
          <CreateRoleCard />
          <RoleListCard />
        </div>
      </div>
    </main>
  );
}
