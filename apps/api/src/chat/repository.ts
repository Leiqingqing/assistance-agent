import { and, desc, eq, lt } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  agentConversationMessages,
  agentConversations,
  userAgentCompanions,
} from "@/db/schema";

export async function doesUserOwnAgent(
  db: Db,
  userId: string,
  agentId: string,
): Promise<boolean> {
  const [agent] = await db
    .select({ id: userAgentCompanions.id })
    .from(userAgentCompanions)
    .where(
      and(
        eq(userAgentCompanions.id, agentId),
        eq(userAgentCompanions.userId, userId),
      ),
    )
    .limit(1);

  return agent !== undefined;
}

export async function findConversation(
  db: Db,
  userId: string,
  agentId: string,
) {
  const [conversation] = await db
    .select()
    .from(agentConversations)
    .where(
      and(
        eq(agentConversations.userId, userId),
        eq(agentConversations.agentId, agentId),
      ),
    )
    .limit(1);

  return conversation ?? null;
}

export async function findOrCreateConversation(
  db: Db,
  input: {
    id: string;
    userId: string;
    agentId: string;
    nowMs: number;
  },
) {
  const existing = await findConversation(db, input.userId, input.agentId);

  if (existing !== null) {
    return existing;
  }

  await db
    .insert(agentConversations)
    .values({
      id: input.id,
      userId: input.userId,
      agentId: input.agentId,
      createdAtMs: input.nowMs,
      updatedAtMs: input.nowMs,
    })
    .onConflictDoNothing();

  const conversation = await findConversation(db, input.userId, input.agentId);

  if (conversation === null) {
    throw new Error("Failed to create agent conversation");
  }

  return conversation;
}

export async function listConversationMessages(
  db: Db,
  input: {
    conversationId: string;
    userId: string;
    agentId: string;
    limit: number;
    cursor?: number;
  },
) {
  const ownershipFilter = and(
    eq(agentConversationMessages.conversationId, input.conversationId),
    eq(agentConversationMessages.userId, input.userId),
    eq(agentConversationMessages.agentId, input.agentId),
  );

  return db
    .select()
    .from(agentConversationMessages)
    .where(
      input.cursor === undefined
        ? ownershipFilter
        : and(
            ownershipFilter,
            lt(agentConversationMessages.createdAtMs, input.cursor),
          ),
    )
    .orderBy(
      desc(agentConversationMessages.createdAtMs),
      desc(agentConversationMessages.id),
    )
    .limit(input.limit);
}
