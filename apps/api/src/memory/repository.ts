import { and, desc, eq, ne } from "drizzle-orm";
import type { MemoryStatus } from "@repo/contracts/memory";
import type { Db } from "@/db/client";
import { agentMemories, userAgentCompanions } from "@/db/schema";
import type { CreateMemoryRecordInput, UpdateMemoryRecordInput } from "./types";

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

export async function createMemoryRecord(
  db: Db,
  input: CreateMemoryRecordInput,
) {
  const [memory] = await db
    .insert(agentMemories)
    .values({
      id: input.id,
      userId: input.userId,
      agentId: input.agentId,
      type: input.type,
      content: input.content,
      importance: input.importance,
      status: "active",
      createdAtMs: input.nowMs,
      updatedAtMs: input.nowMs,
    })
    .returning();

  return memory;
}

export async function findOwnedMemoryById(
  db: Db,
  userId: string,
  memoryId: string,
) {
  const [memory] = await db
    .select()
    .from(agentMemories)
    .where(
      and(
        eq(agentMemories.id, memoryId),
        eq(agentMemories.userId, userId),
        ne(agentMemories.status, "deleted"),
      ),
    )
    .limit(1);

  return memory ?? null;
}

export async function listOwnedMemoryRecords(
  db: Db,
  userId: string,
  agentId: string,
  status?: Exclude<MemoryStatus, "deleted">,
) {
  return db
    .select()
    .from(agentMemories)
    .where(
      and(
        eq(agentMemories.userId, userId),
        eq(agentMemories.agentId, agentId),
        status === undefined
          ? ne(agentMemories.status, "deleted")
          : eq(agentMemories.status, status),
      ),
    )
    .orderBy(desc(agentMemories.importance), desc(agentMemories.updatedAtMs));
}

export async function updateOwnedMemoryRecord(
  db: Db,
  userId: string,
  memoryId: string,
  input: UpdateMemoryRecordInput,
) {
  const [memory] = await db
    .update(agentMemories)
    .set(input)
    .where(
      and(
        eq(agentMemories.id, memoryId),
        eq(agentMemories.userId, userId),
        ne(agentMemories.status, "deleted"),
      ),
    )
    .returning();

  return memory ?? null;
}

export async function softDeleteOwnedMemoryRecord(
  db: Db,
  userId: string,
  memoryId: string,
  nowMs: number,
) {
  const [memory] = await db
    .update(agentMemories)
    .set({ status: "deleted", updatedAtMs: nowMs })
    .where(
      and(
        eq(agentMemories.id, memoryId),
        eq(agentMemories.userId, userId),
        ne(agentMemories.status, "deleted"),
      ),
    )
    .returning();

  return memory ?? null;
}
