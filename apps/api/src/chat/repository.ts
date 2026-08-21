import { and, desc, eq, lt, ne, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  agentConversationMessages,
  agentConversations,
  agentMemories,
  userAgentCompanions,
} from "@/db/schema";

export async function findOwnedAgent(db: Db, userId: string, agentId: string) {
  const [agent] = await db
    .select()
    .from(userAgentCompanions)
    .where(
      and(
        eq(userAgentCompanions.id, agentId),
        eq(userAgentCompanions.userId, userId),
      ),
    )
    .limit(1);

  return agent ?? null;
}

export async function listOwnedAgents(db: Db, userId: string) {
  return db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      description: userAgentCompanions.description,
      openingMessage: userAgentCompanions.openingMessage,
      imageKey: userAgentCompanions.imageKey,
      lastAssistantMessage: userAgentCompanions.lastAssistantMessage,
      lastAssistantMessageAtMs: userAgentCompanions.lastAssistantMessageAtMs,
    })
    .from(userAgentCompanions)
    .where(
      and(
        eq(userAgentCompanions.userId, userId),
        eq(userAgentCompanions.status, "published"),
      ),
    )
    .orderBy(
      desc(userAgentCompanions.lastAssistantMessageAtMs),
      desc(userAgentCompanions.updatedAtMs),
    );
}

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

export async function findOwnedConversationById(
  db: Db,
  userId: string,
  conversationId: string,
) {
  const [conversation] = await db
    .select()
    .from(agentConversations)
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    )
    .limit(1);

  return conversation ?? null;
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

export async function listRecentCompletedMessages(
  db: Db,
  input: {
    conversationId: string;
    userId: string;
    agentId: string;
    excludeMessageId?: string;
    limit: number;
  },
) {
  const filters = [
    eq(agentConversationMessages.conversationId, input.conversationId),
    eq(agentConversationMessages.userId, input.userId),
    eq(agentConversationMessages.agentId, input.agentId),
    eq(agentConversationMessages.status, "completed"),
  ];

  if (input.excludeMessageId !== undefined) {
    filters.push(ne(agentConversationMessages.id, input.excludeMessageId));
  }

  return db
    .select()
    .from(agentConversationMessages)
    .where(and(...filters))
    .orderBy(
      desc(agentConversationMessages.createdAtMs),
      desc(agentConversationMessages.id),
    )
    .limit(input.limit);
}

export async function listActiveMemories(
  db: Db,
  input: {
    userId: string;
    agentId: string;
    limit: number;
  },
) {
  return db
    .select()
    .from(agentMemories)
    .where(
      and(
        eq(agentMemories.userId, input.userId),
        eq(agentMemories.agentId, input.agentId),
        eq(agentMemories.status, "active"),
      ),
    )
    .orderBy(desc(agentMemories.importance), desc(agentMemories.updatedAtMs))
    .limit(input.limit);
}

export async function saveUserMessage(
  db: Db,
  input: {
    id: string;
    conversationId: string;
    userId: string;
    agentId: string;
    content: string;
    metadataJson?: string | null;
    nowMs: number;
  },
): Promise<void> {
  await db.batch([
    db.insert(agentConversationMessages).values({
      id: input.id,
      conversationId: input.conversationId,
      userId: input.userId,
      agentId: input.agentId,
      role: "user",
      content: input.content,
      status: "completed",
      metadataJson: input.metadataJson ?? null,
      createdAtMs: input.nowMs,
    }),
    db
      .update(agentConversations)
      .set({
        messageCount: sql`${agentConversations.messageCount} + 1`,
        lastMessageAtMs: input.nowMs,
        updatedAtMs: input.nowMs,
      })
      .where(
        and(
          eq(agentConversations.id, input.conversationId),
          eq(agentConversations.userId, input.userId),
          eq(agentConversations.agentId, input.agentId),
        ),
      ),
  ]);
}

export async function findMemoryByContent(
  db: Db,
  input: {
    userId: string;
    agentId: string;
    content: string;
  },
) {
  const [memory] = await db
    .select({ id: agentMemories.id })
    .from(agentMemories)
    .where(
      and(
        eq(agentMemories.userId, input.userId),
        eq(agentMemories.agentId, input.agentId),
        eq(agentMemories.content, input.content),
      ),
    )
    .limit(1);

  return memory ?? null;
}

export async function persistAssistantTurn(
  db: Db,
  input: {
    id: string;
    conversationId: string;
    userId: string;
    agentId: string;
    assistantContent: string;
    summary: string;
    memory: {
      id: string;
      type: string;
      content: string;
      importance: number;
      sourceMessageId: string;
    } | null;
    nowMs: number;
  },
): Promise<void> {
  const assistantInsert = db.insert(agentConversationMessages).values({
    id: input.id,
    conversationId: input.conversationId,
    userId: input.userId,
    agentId: input.agentId,
    role: "assistant",
    content: input.assistantContent,
    status: "completed",
    createdAtMs: input.nowMs,
  });
  const conversationUpdate = db
    .update(agentConversations)
    .set({
      summary: input.summary,
      messageCount: sql`${agentConversations.messageCount} + 1`,
      lastMessageAtMs: input.nowMs,
      updatedAtMs: input.nowMs,
    })
    .where(
      and(
        eq(agentConversations.id, input.conversationId),
        eq(agentConversations.userId, input.userId),
        eq(agentConversations.agentId, input.agentId),
      ),
    );
  const companionUpdate = db
    .update(userAgentCompanions)
    .set({
      lastAssistantMessage: input.assistantContent,
      lastAssistantMessageAtMs: input.nowMs,
      updatedAtMs: input.nowMs,
    })
    .where(
      and(
        eq(userAgentCompanions.id, input.agentId),
        eq(userAgentCompanions.userId, input.userId),
      ),
    );

  if (input.memory === null) {
    await db.batch([assistantInsert, conversationUpdate, companionUpdate]);
    return;
  }

  await db.batch([
    assistantInsert,
    conversationUpdate,
    companionUpdate,
    db.insert(agentMemories).values({
      id: input.memory.id,
      userId: input.userId,
      agentId: input.agentId,
      type: input.memory.type,
      content: input.memory.content,
      importance: input.memory.importance,
      status: "active",
      sourceMessageId: input.memory.sourceMessageId,
      createdAtMs: input.nowMs,
      updatedAtMs: input.nowMs,
    }),
  ]);
}
