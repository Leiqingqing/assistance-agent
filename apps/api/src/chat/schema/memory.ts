import { z } from "zod";

export const AgentMemoryCandidateSchema = z.object({
  shouldExtract: z.boolean(),
  confidence: z.number().min(0).max(1),
  category: z.enum([
    "preference",
    "boundary",
    "relationship_goal",
    "conversation_style",
    "important_fact",
    "identity_profile",
    "temporary_emotion",
    "small_talk",
    "assistant_generated",
    "duplicate",
    "unsafe",
    "unclear",
  ]),
  stability: z.enum(["stable", "likely_stable", "temporary", "unclear"]),
  importance: z.number().int().min(0).max(5),
  reason: z.string().trim().max(300),
  candidateFacts: z.array(z.string().trim().min(1).max(120)).max(3),
});

export type AgentMemoryCandidate = z.infer<typeof AgentMemoryCandidateSchema>;
