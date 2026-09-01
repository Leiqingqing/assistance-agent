import z from "zod";

export const ConversationRelationshipStageSchema = z.object({
    stage: z.enum([
      'new_connection',
      'warming_up',
      'comfortable_chat',
      'trusted_companion',
      'close_bond',
      'repairing',
      'boundary_sensitive',
      'dependency_watch',
    ]),
    displayName: z.string().trim().min(1).max(80),
    closenessScore: z.number().int().min(0).max(100),
    trustLevel: z.enum(['low', 'medium', 'high']),
    stability: z.enum(['new', 'warming', 'stable', 'deepening', 'fragile', 'repairing']),
    boundaryMode: z.enum(['open', 'warm', 'careful', 'firm']),
    intimacyPermission: z.enum(['low', 'medium', 'high']),
    pacing: z.enum(['slow_down', 'hold', 'advance_gently', 'repair_first']),
    riskSignals: z.array(z.enum([
      'low_history',
      'dependency_risk',
      'boundary_testing',
      'conflict',
      'pulling_away',
      'sexual_boundary',
      'emotional_volatility',
    ])).max(5),
    relationshipGuidance: z.string().trim().max(700),
  })
  
  export type ConversationRelationshipStage = z.infer<typeof ConversationRelationshipStageSchema>