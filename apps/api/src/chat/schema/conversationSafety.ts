import z from "zod";

export const ConversationSafetySchema = z.object({
    safetyLevel: z.enum([
        'safe', // safe：正常聊天
        'caution', // caution：轻度风险，继续回复但要克制
        'redirect', // redirect：需要温和转向
        'block', // block：不能满足用户请求
        'crisis'// crisis：危机支持，例如自伤、自杀、现实危险
    ]),
    category: z.enum([
      'normal',
      'emotional_dependency',
      'manipulation',
      'self_harm',
      'sexual_boundary',
      'privacy',
      'illegal',
      'medical_legal_financial',
      'other',
    ]),
    boundaryAction: z.enum(['continue', 'soft_boundary', 'redirect', 'refuse', 'crisis_support']),
    reason: z.string().trim().max(300),
    responseGuidance: z.string().trim().max(600),
    allowMemoryExtraction: z.boolean(),
})

export type ConversationSafety = z.infer<typeof ConversationSafetySchema>;