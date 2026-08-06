"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { AdminPasswordLoginRequest } from "@repo/contracts";
import { loginApi } from "@/auth/login-client";

export function useAdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const login = useCallback(
    async (input: AdminPasswordLoginRequest) => {
      setError(null);
      setIsPending(true);

      try {
        await loginApi(input);
        router.replace("/");
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : "登录失败，请稍后重试",
        );
      } finally {
        setIsPending(false);
      }
    },
    [router],
  );

  return { error, isPending, login };
}
