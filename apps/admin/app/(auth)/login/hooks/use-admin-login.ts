"use client";

import { useRouter } from "next/navigation";
import type { AdminPasswordLoginRequest } from "@repo/contracts";
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "@/auth/login-client";

export function useAdminLogin() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (input: AdminPasswordLoginRequest) => loginApi(input),
    onSuccess: () => {
      router.replace("/");
    },
  });

  const onSubmit = async(input: AdminPasswordLoginRequest) => {
    try {
      await mutation.mutateAsync(input);
      return true
    } catch {
      return false
    }
  }
  const error =
    mutation.error instanceof Error
      ? mutation.error.message
      : null
  return {
    error,
    isLogging: mutation.isPending,
    submit: onSubmit,
  };
}
