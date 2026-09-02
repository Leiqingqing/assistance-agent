import { and, asc, desc, eq, inArray, lt, notExists, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  agentGroupChatMembers,
  agentGroupChatMessages,
  agentGroupChats,
  userAgentCompanions,
} from "@/db/schema";

export async function listOwnedAgentsByIds(
  db: Db,
  userId: string,
  agentIds: string[],
) {
  return db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      imageKey: userAgentCompanions.imageKey,
    })
    .from(userAgentCompanions)
    .where(
      and(
        eq(userAgentCompanions.userId, userId),
        inArray(userAgentCompanions.id, agentIds),
      ),
    );
}

export async function createGroupChatRecord(
  db: Db,
  input: {
    id: string;
    userId: string;
    title: string;
    nowMs: number;
    members: Array<{
      id: string;
      agentId: string;
      displayOrder: number;
    }>;
  },
): Promise<void> {
  await db.batch([
    db.insert(agentGroupChats).values({
      id: input.id,
      userId: input.userId,
      title: input.title,
      summary: null,
      messageCount: 0,
      lastMessageAtMs: null,
      createdAtMs: input.nowMs,
      updatedAtMs: input.nowMs,
    }),
    db.insert(agentGroupChatMembers).values(
      input.members.map((member) => ({
        ...member,
        groupChatId: input.id,
        userId: input.userId,
        status: "active" as const,
        joinedAtMs: input.nowMs,
        removedAtMs: null,
      })),
    ),
  ]);
}

export async function findOwnedGroupChatRecord(
  db: Db,
  userId: string,
  groupChatId: string,
) {
  const [groupChat] = await db
    .select()
    .from(agentGroupChats)
    .where(
      and(
        eq(agentGroupChats.id, groupChatId),
        eq(agentGroupChats.userId, userId),
      ),
    )
    .limit(1);

  return groupChat ?? null;
}

export async function listOwnedGroupChatRecords(db: Db, userId: string) {
  return db
    .select()
    .from(agentGroupChats)
    .where(eq(agentGroupChats.userId, userId))
    .orderBy(
      desc(agentGroupChats.updatedAtMs),
      desc(agentGroupChats.createdAtMs),
    );
}

export async function listGroupChatMemberRecords(
  db: Db,
  userId: string,
  groupChatIds: string[],
) {
  if (groupChatIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: agentGroupChatMembers.id,
      groupChatId: agentGroupChatMembers.groupChatId,
      agentId: agentGroupChatMembers.agentId,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      imageKey: userAgentCompanions.imageKey,
      status: agentGroupChatMembers.status,
      displayOrder: agentGroupChatMembers.displayOrder,
      joinedAtMs: agentGroupChatMembers.joinedAtMs,
    })
    .from(agentGroupChatMembers)
    .innerJoin(
      userAgentCompanions,
      and(
        eq(agentGroupChatMembers.agentId, userAgentCompanions.id),
        eq(userAgentCompanions.userId, userId),
      ),
    )
    .where(
      and(
        eq(agentGroupChatMembers.userId, userId),
        inArray(agentGroupChatMembers.groupChatId, groupChatIds),
      ),
    )
    .orderBy(
      asc(agentGroupChatMembers.groupChatId),
      asc(agentGroupChatMembers.displayOrder),
    );
}

export async function listActiveGroupChatAgents(
  db: Db,
  userId: string,
  groupChatId: string,
) {
  return db
    .select({
      id: userAgentCompanions.id,
      name: userAgentCompanions.name,
      headline: userAgentCompanions.headline,
      description: userAgentCompanions.description,
      storyBackground: userAgentCompanions.storyBackground,
      personalityPrompt: userAgentCompanions.personalityPrompt,
      tonePrompt: userAgentCompanions.tonePrompt,
      guardrailsPrompt: userAgentCompanions.guardrailsPrompt,
      defaultPrompt: userAgentCompanions.defaultPrompt,
      imageKey: userAgentCompanions.imageKey,
      displayOrder: agentGroupChatMembers.displayOrder,
    })
    .from(agentGroupChatMembers)
    .innerJoin(
      userAgentCompanions,
      and(
        eq(agentGroupChatMembers.agentId, userAgentCompanions.id),
        eq(userAgentCompanions.userId, userId),
      ),
    )
    .where(
      and(
        eq(agentGroupChatMembers.groupChatId, groupChatId),
        eq(agentGroupChatMembers.userId, userId),
        eq(agentGroupChatMembers.status, "active"),
      ),
    )
    .orderBy(asc(agentGroupChatMembers.displayOrder));
}

export async function saveGroupChatMemberRecord(
  db: Db,
  input: {
    id: string;
    existingMemberId?: string;
    groupChatId: string;
    userId: string;
    agentId: string;
    displayOrder: number;
    nowMs: number;
  },
): Promise<void> {
  const groupChatUpdate = db
    .update(agentGroupChats)
    .set({ updatedAtMs: input.nowMs })
    .where(
      and(
        eq(agentGroupChats.id, input.groupChatId),
        eq(agentGroupChats.userId, input.userId),
      ),
    );

  if (input.existingMemberId !== undefined) {
    await db.batch([
      db
        .update(agentGroupChatMembers)
        .set({
          status: "active",
          displayOrder: input.displayOrder,
          joinedAtMs: input.nowMs,
          removedAtMs: null,
        })
        .where(
          and(
            eq(agentGroupChatMembers.id, input.existingMemberId),
            eq(agentGroupChatMembers.groupChatId, input.groupChatId),
            eq(agentGroupChatMembers.userId, input.userId),
            eq(agentGroupChatMembers.agentId, input.agentId),
          ),
        ),
      groupChatUpdate,
    ]);
    return;
  }

  await db.batch([
    db.insert(agentGroupChatMembers).values({
      id: input.id,
      groupChatId: input.groupChatId,
      userId: input.userId,
      agentId: input.agentId,
      displayOrder: input.displayOrder,
      status: "active",
      joinedAtMs: input.nowMs,
      removedAtMs: null,
    }),
    groupChatUpdate,
  ]);
}

export async function removeActiveGroupChatMemberRecord(
  db: Db,
  input: {
    groupChatId: string;
    userId: string;
    agentId: string;
    nowMs: number;
  },
) {
  const [removedMembers, deletedGroupChats] = await db.batch([
    db
      .update(agentGroupChatMembers)
      .set({
        status: "removed",
        removedAtMs: input.nowMs,
      })
      .where(
        and(
          eq(agentGroupChatMembers.groupChatId, input.groupChatId),
          eq(agentGroupChatMembers.userId, input.userId),
          eq(agentGroupChatMembers.agentId, input.agentId),
          eq(agentGroupChatMembers.status, "active"),
        ),
      )
      .returning({ id: agentGroupChatMembers.id }),
    db
      .delete(agentGroupChats)
      .where(
        and(
          eq(agentGroupChats.id, input.groupChatId),
          eq(agentGroupChats.userId, input.userId),
          notExists(
            db
              .select({ id: agentGroupChatMembers.id })
              .from(agentGroupChatMembers)
              .where(
                and(
                  eq(agentGroupChatMembers.groupChatId, agentGroupChats.id),
                  eq(agentGroupChatMembers.userId, input.userId),
                  eq(agentGroupChatMembers.status, "active"),
                ),
              ),
          ),
        ),
      )
      .returning({ id: agentGroupChats.id }),
    db
      .update(agentGroupChats)
      .set({ updatedAtMs: input.nowMs })
      .where(
        and(
          eq(agentGroupChats.id, input.groupChatId),
          eq(agentGroupChats.userId, input.userId),
        ),
      ),
  ]);

  return {
    removedMember: removedMembers[0] ?? null,
    dissolved: deletedGroupChats.length > 0,
  };
}

export async function listLatestGroupChatMessageRecords(
  db: Db,
  userId: string,
  groupChatIds: string[],
) {
  if (groupChatIds.length === 0) {
    return [];
  }

  const rankedMessages = db
    .select({
      id: agentGroupChatMessages.id,
      groupChatId: agentGroupChatMessages.groupChatId,
      senderType: agentGroupChatMessages.senderType,
      agentId: agentGroupChatMessages.agentId,
      content: agentGroupChatMessages.content,
      status: agentGroupChatMessages.status,
      turnIndex: agentGroupChatMessages.turnIndex,
      createdAtMs: agentGroupChatMessages.createdAtMs,
      rowNumber: sql<number>`row_number() over (
          partition by ${agentGroupChatMessages.groupChatId}
          order by ${agentGroupChatMessages.createdAtMs} desc, ${agentGroupChatMessages.id} desc
        )`.as("row_number"),
    })
    .from(agentGroupChatMessages)
    .where(
      and(
        eq(agentGroupChatMessages.userId, userId),
        inArray(agentGroupChatMessages.groupChatId, groupChatIds),
      ),
    )
    .as("ranked_group_chat_messages");

  return db
    .select({
      id: rankedMessages.id,
      groupChatId: rankedMessages.groupChatId,
      senderType: rankedMessages.senderType,
      agentId: rankedMessages.agentId,
      agentName: userAgentCompanions.name,
      agentImageKey: userAgentCompanions.imageKey,
      content: rankedMessages.content,
      status: rankedMessages.status,
      turnIndex: rankedMessages.turnIndex,
      createdAtMs: rankedMessages.createdAtMs,
    })
    .from(rankedMessages)
    .leftJoin(
      userAgentCompanions,
      and(
        eq(rankedMessages.agentId, userAgentCompanions.id),
        eq(userAgentCompanions.userId, userId),
      ),
    )
    .where(eq(rankedMessages.rowNumber, 1));
}

export async function listGroupChatMessageRecords(
  db: Db,
  input: {
    groupChatId: string;
    userId: string;
    limit: number;
    cursor?: number;
  },
) {
  const ownershipFilter = and(
    eq(agentGroupChatMessages.groupChatId, input.groupChatId),
    eq(agentGroupChatMessages.userId, input.userId),
  );

  return db
    .select({
      id: agentGroupChatMessages.id,
      groupChatId: agentGroupChatMessages.groupChatId,
      senderType: agentGroupChatMessages.senderType,
      agentId: agentGroupChatMessages.agentId,
      agentName: userAgentCompanions.name,
      agentImageKey: userAgentCompanions.imageKey,
      content: agentGroupChatMessages.content,
      status: agentGroupChatMessages.status,
      turnIndex: agentGroupChatMessages.turnIndex,
      createdAtMs: agentGroupChatMessages.createdAtMs,
    })
    .from(agentGroupChatMessages)
    .leftJoin(
      userAgentCompanions,
      and(
        eq(agentGroupChatMessages.agentId, userAgentCompanions.id),
        eq(userAgentCompanions.userId, input.userId),
      ),
    )
    .where(
      input.cursor === undefined
        ? ownershipFilter
        : and(
            ownershipFilter,
            lt(agentGroupChatMessages.createdAtMs, input.cursor),
          ),
    )
    .orderBy(
      desc(agentGroupChatMessages.createdAtMs),
      desc(agentGroupChatMessages.id),
    )
    .limit(input.limit);
}

export async function saveGroupChatTurn(
  db: Db,
  input: {
    groupChatId: string;
    userId: string;
    agentId: string;
    userMessageId: string;
    agentMessageId: string;
    userContent: string;
    agentContent: string;
    turnIndex: number;
    userMessageAtMs: number;
    agentMessageAtMs: number;
  },
): Promise<void> {
  await db.batch([
    db.insert(agentGroupChatMessages).values({
      id: input.userMessageId,
      groupChatId: input.groupChatId,
      userId: input.userId,
      senderType: "user",
      agentId: null,
      content: input.userContent,
      status: "completed",
      turnIndex: input.turnIndex,
      metadataJson: null,
      createdAtMs: input.userMessageAtMs,
    }),
    db.insert(agentGroupChatMessages).values({
      id: input.agentMessageId,
      groupChatId: input.groupChatId,
      userId: input.userId,
      senderType: "agent",
      agentId: input.agentId,
      content: input.agentContent,
      status: "completed",
      turnIndex: input.turnIndex,
      metadataJson: null,
      createdAtMs: input.agentMessageAtMs,
    }),
    db
      .update(agentGroupChats)
      .set({
        messageCount: sql`${agentGroupChats.messageCount} + 2`,
        lastMessageAtMs: input.agentMessageAtMs,
        updatedAtMs: input.agentMessageAtMs,
      })
      .where(
        and(
          eq(agentGroupChats.id, input.groupChatId),
          eq(agentGroupChats.userId, input.userId),
        ),
      ),
  ]);
}

export async function deleteOwnedGroupChatRecord(
  db: Db,
  userId: string,
  groupChatId: string,
) {
  const [deletedGroupChat] = await db
    .delete(agentGroupChats)
    .where(
      and(
        eq(agentGroupChats.id, groupChatId),
        eq(agentGroupChats.userId, userId),
      ),
    )
    .returning({ id: agentGroupChats.id });

  return deletedGroupChat ?? null;
}
