import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "登录 | Assistance Agent Admin",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-20 size-80 rounded-full bg-accent/40 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-body font-medium text-primary">
            Assistance Agent
          </p>
          <h1 className="text-title text-foreground">管理后台</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>欢迎登录</CardTitle>
            <CardDescription>请输入管理员账号信息以继续</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}