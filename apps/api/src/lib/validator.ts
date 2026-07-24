import { zValidator as zv } from '@hono/zod-validator'
import type { ZodSchema } from 'zod'
import type { ValidationTargets } from 'hono'

// 封装：所有接口用同一个错误格式
export const validate = <T extends ZodSchema>(
  target: keyof ValidationTargets,
  schema: T,
) => zv(target, schema, (result, c) => {
  if (!result.success) {
    return c.json({
      ok: false,
      code: 'VALIDATION_ERROR',
      errors: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    }, 400)
  }
})