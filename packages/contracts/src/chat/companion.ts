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