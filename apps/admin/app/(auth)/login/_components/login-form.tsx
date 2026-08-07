"use client";

import type { AdminPasswordLoginRequest } from "@repo/contracts";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useForm } from "react-hook-form";
import { useAdminLogin } from "../hooks/use-admin-login";

export function LoginForm() {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<AdminPasswordLoginRequest>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { error, isLogging, submit } = useAdminLogin();

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          placeholder="admin@example.com"
          disabled={isLogging}
          {...register("email", {
            required: "请输入邮箱",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "请输入有效的邮箱地址",
            },
          })}
        />
        {errors.email && (
          <p id="email-error" className="text-caption text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          placeholder="请输入密码"
          disabled={isLogging}
          {...register("password", {
            required: "请输入密码",
          })}
        />
        {errors.password && (
          <p id="password-error" className="text-caption text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-body text-destructive"
        >
          {error}
        </div>
      )}

      <Button className="w-full" size="lg" type="submit" disabled={isLogging}>
        {isLogging ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
