import z from "zod";

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