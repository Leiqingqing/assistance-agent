import { z } from 'zod'
import { TimestampsSchema } from '../common'
// ========== 主 schema（数据库形态，含所有字段）==========
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user'),
  avatar: z.string().url().nullable(),
}).merge(TimestampsSchema)

export type User = z.infer<typeof UserSchema>

// ========== 派生 1：对外返回的公开用户（安全白名单）==========
export const PublicUserSchema = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  createdAt: true,
})
export type PublicUser = z.infer<typeof PublicUserSchema>

// ========== 派生 2：注册请求体（去掉生成字段）==========
export const RegisterBodySchema = UserSchema.pick({
  name: true,
  email: true,
  password: true,
})
export type RegisterBody = z.infer<typeof RegisterBodySchema>
export type RegisterBodyInput = z.input<typeof RegisterBodySchema>

// ========== 派生 3：登录请求体 ==========
export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
})
export type LoginBody = z.infer<typeof LoginBodySchema>

// ========== 派生 4：更新请求体（部分字段可选，ID 通过 URL 传）==========
export const UpdateUserBodySchema = UserSchema
  .pick({ name: true, avatar: true })
  .partial()
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>

// ========== 派生 5：改密接口 ==========
export const ChangePasswordBodySchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
}).refine(d => d.oldPassword !== d.newPassword, {
  message: '新密码不能与旧密码相同',
  path: ['newPassword'],
})
export type ChangePasswordBody = z.infer<typeof ChangePasswordBodySchema>