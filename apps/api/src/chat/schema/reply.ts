import z from "zod";

export const ReplyQualityGuardSchema = z.object({
    status: z.enum(['pass', 'warn', 'fail']),
    score: z.number().min(0).max(1),
    sentenceCount: z.number().int().min(0),
    questionCount: z.number().int().min(0),
    adviceCount: z.number().int().min(0),
    violations: z.array(z.object({
      code: z.enum([
        'too_many_sentences',
        'too_many_questions',
        'too_many_suggestions',
        'internal_label_leak',
        'breaks_immersion',
        'forbidden_lecture',
        'forbidden_over_explain',
        'forbidden_premature_advice',
        'forbidden_intense_flirt',
        'forbidden_diagnosis',
        'forbidden_aggressive_siding',
        'forbidden_pressure',
        'forbidden_real_world_promise',
      ]),
      severity: z.enum(['low', 'medium', 'high']),
      evidence: z.string().trim().max(160),
    })).max(12),
  })

  export type ReplyQualityGuard = z.infer<typeof ReplyQualityGuardSchema>;

  export const ReplyPolicySchema = z.object({
    policy: z.enum([
      'quiet_presence',
      'warm_companion',
      'deep_empathy',
      'playful_flirt',
      'calm_boundary',
      'relationship_repair',
      'gentle_clarify',
      'practical_support',
      'roleplay_flow',
      'memory_ack',
    ]),
    sentenceBudget: z.object({
      min: z.number().int().min(1).max(8),
      max: z.number().int().min(1).max(8),
    }),
    rhythm: z.enum(['still', 'soft', 'natural', 'lively', 'focused']),
    openingMove: z.enum([
      'acknowledge',
      'comfort',
      'mirror',
      'apologize',
      'play',
      'answer',
      'clarify',
      'set_boundary',
    ]),
    allowedMoves: z.array(z.enum([
      'validate_feeling',
      'mirror_emotion',
      'offer_presence',
      'ask_one_question',
      'give_one_suggestion',
      'give_two_suggestions',
      'light_tease',
      'use_pet_name',
      'repair_misunderstanding',
      'continue_roleplay',
      'acknowledge_memory',
      'set_soft_boundary',
    ])).max(6),
    forbiddenMoves: z.array(z.enum([
      'lecture',
      'over_explain',
      'multiple_questions',
      'premature_advice',
      'intense_flirt',
      'diagnose_user',
      'take_sides_aggressively',
      'pressure_to_disclose',
      'promise_real_world_action',
      'expose_internal_labels',
      'break_immersion',
    ])).max(12),
    questionLimit: z.number().int().min(0).max(2),
    adviceLimit: z.number().int().min(0).max(3),
    intimacyLevel: z.enum(['low', 'medium', 'high']),
    styleGuidance: z.string().trim().max(700),
  })
  
  export type ReplyPolicy = z.infer<typeof ReplyPolicySchema>