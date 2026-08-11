"use client";

import type { CreateRoleRequest } from "@repo/contracts/role";
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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateRole } from "../hooks/use-roles";

type CreateRoleFormValues = Omit<CreateRoleRequest, "applicationId">;

export function CreateRoleCard() {
  const [isCreated, setIsCreated] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset: resetForm,
  } = useForm<CreateRoleFormValues>({
    defaultValues: {
      code: "",
      description: "",
      name: "",
    },
  });
  const { create, error, isCreating, reset: resetMutation } = useCreateRole();

  const submit = async (values: CreateRoleFormValues) => {
    setIsCreated(false);
    resetMutation();

    try {
      await create({
        ...values,
        description: values.description?.trim() || null,
      });
      resetForm();
      setIsCreated(true);
    } catch {
      setIsCreated(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>新增角色</CardTitle>
        <CardDescription>
          创建一个可分配给管理员的新角色
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5 sm:grid-cols-2"
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          <div className="space-y-2">
            <Label htmlFor="role-code">角色编码</Label>
            <Input
              id="role-code"
              autoComplete="off"
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? "role-code-error" : undefined}
              disabled={isCreating}
              placeholder="content_editor"
              {...register("code", {
                required: "请输入角色编码",
                maxLength: {
                  value: 64,
                  message: "角色编码不能超过 64 个字符",
                },
                pattern: {
                  value: /^[a-z][a-z0-9_]*$/,
                  message: "请使用小写字母开头，仅包含小写字母、数字和下划线",
                },
              })}
            />
            {errors.code && (
              <p id="role-code-error" className="text-caption text-destructive">
                {errors.code.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-name">角色名称</Label>
            <Input
              id="role-name"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "role-name-error" : undefined}
              disabled={isCreating}
              placeholder="内容编辑"
              {...register("name", {
                required: "请输入角色名称",
                maxLength: {
                  value: 100,
                  message: "角色名称不能超过 100 个字符",
                },
              })}
            />
            {errors.name && (
              <p id="role-name-error" className="text-caption text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="role-description">角色描述（可选）</Label>
            <textarea
              id="role-description"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "role-description-error" : undefined
              }
              className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-body text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isCreating}
              placeholder="简要说明该角色的职责与权限范围"
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "角色描述不能超过 500 个字符",
                },
              })}
            />
            {errors.description && (
              <p
                id="role-description-error"
                className="text-caption text-destructive"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-body text-destructive sm:col-span-2"
            >
              {error}
            </div>
          )}
          {isCreated && (
            <div
              role="status"
              className="rounded-lg bg-primary/10 px-3 py-2 text-body text-primary sm:col-span-2"
            >
              角色创建成功
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "创建中..." : "创建角色"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
