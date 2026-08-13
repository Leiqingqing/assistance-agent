"use client";

import type { WebPasswordLoginRequest } from "@repo/contracts/auth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { loginApi } from "@/auth/login-client";

export function useWebLogin() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (input: WebPasswordLoginRequest) => loginApi(input),
    onSuccess: () => {
      router.replace("/chat");
    },
  });

  async function submit(input: WebPasswordLoginRequest): Promise<boolean> {
    try {
      await mutation.mutateAsync(input);
      return true;
    } catch {
      return false;
    }
  }

  return {
    error:
      mutation.error instanceof Error ? mutation.error.message : null,
    isLogging: mutation.isPending,
    submit,
  };
}
