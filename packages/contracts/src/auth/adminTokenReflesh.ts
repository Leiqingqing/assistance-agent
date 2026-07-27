import { z } from "zod";
import { AdminPasswordLoginResponseSchema } from "./adminPasswordLogin";

export const AdminTokenRefleshRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

export type AdminTokenRefleshRequest = z.infer<typeof AdminTokenRefleshRequestSchema>;

// 登录和刷新都会签发一组新的 token，并返回相同的 admin session 结构。
export const AdminTokenRefleshResponseSchema =
  AdminPasswordLoginResponseSchema;

export type AdminTokenRefleshResponse = z.infer<typeof AdminTokenRefleshResponseSchema>;
