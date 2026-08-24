import z from "zod";

export const AgentCompanionSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    headline: z.string().nullable(),
    description: z.string().nullable(),
    openingMessage: z.string().nullable(),
    imageKey: z.string().nullable(),
    lastAssistantMessage: z.string().nullable(),
    lastAssistantMessageAtMs: z.number().int().nonnegative().nullable(),
  });
  export type AgentCompanion = z.infer<typeof AgentCompanionSchema>;
  
  export const AgentCompanionListResponseSchema = z.object({
    agents: z.array(AgentCompanionSchema),
  });
  export type AgentCompanionListResponse = z.infer<typeof AgentCompanionListResponseSchema>;

  export const CompanionIntentPrimarySchema = z.enum([
    'casual_chat',
    'emotional_support',
    'relationship_advice',
    'romantic_flirt',
    'companionship_presence',
    'roleplay',
    'life_sharing',
    'memory_update',
    'preference_setting',
    'agent_feedback',
    'conversation_repair',
    'date_or_activity_planning',
    'creative_request',
    'meta_question',
    'unclear',
  ])
  export type CompanionIntentPrimary = z.infer<typeof CompanionIntentPrimarySchema>;
  
  export const ConversationIntentSchema = z.object({
    primary: CompanionIntentPrimarySchema,
    secondary: z.array(CompanionIntentPrimarySchema).max(3),
    confidence: z.number().min(0).max(1),
    userNeed: z.enum([
      'be_heard',
      'be_comforted',
      'get_advice',
      'get_reply_draft',
      'play_along',
      'feel_connected',
      'set_boundary',
      'update_memory',
      'adjust_agent',
      'unknown',
    ]),
    requestedAgentAction: z.enum([
      'answer_directly',
      'comfort_first',
      'ask_follow_up',
      'draft_message',
      'analyze_situation',
      'roleplay_response',
      'remember_fact',
      'adjust_style',
      'repair_misunderstanding',
      'continue_topic',
    ]),
    relationshipSignal: z.enum([
      'neutral',
      'warming_up',
      'seeking_closeness',
      'testing_boundary',
      'feeling_hurt',
      'pulling_away',
      'dependency_risk',
      'conflict',
    ]),
    replyExpectation: z.object({
      depth: z.enum(['short', 'medium', 'deep']),
      warmth: z.enum(['low', 'medium', 'high']),
      directness: z.enum(['gentle', 'balanced', 'direct']),
      shouldAskQuestion: z.boolean(),
    }),
    shouldClarify: z.boolean(),
    clarifyingQuestion: z.string().trim().max(200).nullable(),
    promptGuidance: z.string().trim().max(600),
  })
  export type ConversationIntent = z.infer<typeof ConversationIntentSchema>;

 export const ConversationEmotionSchema = z.object({
    primaryEmotion: z.enum([
      'neutral',
      'happy',
      'tired',
      'lonely',
      'sad',
      'anxious',
      'angry',
      'jealous',
      'embarrassed',
      'affectionate',
      'playful',
      'confused',
      'disappointed',
      'stressed',
      'hurt',
    ]),
    secondaryEmotions: z.array(z.string().trim().min(1).max(40)).max(3),
    intensity: z.number().min(0).max(1),
    valence: z.enum(['positive', 'neutral', 'negative', 'mixed']),
    arousal: z.enum(['low', 'medium', 'high']),
    needsComfort: z.boolean(),
    needsDeescalation: z.boolean(),
    needsClarification: z.boolean(),
    emotionalCue: z.string().trim().max(300),
    replyTone: z.enum([
      'light',
      'warm',
      'soft',
      'playful',
      'calm',
      'serious',
      'reassuring',
      'apologetic',
    ]),
  })
  export type ConversationEmotion = z.infer<typeof ConversationEmotionSchema>;

  export const EmotionRouteSchema = z.object({
    route: z.enum([
      'light_companion',
      'warm_comfort',
      'deep_comfort',
      'playful_flirt',
      'calm_deescalation',
      'relationship_repair',
      'gentle_clarification',
      'practical_support',
      'quiet_presence',
    ]),
    responseLength: z.enum(['very_short', 'short', 'medium', 'long']),
    shouldAskQuestion: z.boolean(),
    shouldGiveAdvice: z.boolean(),
    shouldUsePetName: z.boolean(),
    shouldMirrorEmotion: z.boolean(),
    routeGuidance: z.string().trim().max(600),
  })
  export type EmotionRoute = z.infer<typeof EmotionRouteSchema>;

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