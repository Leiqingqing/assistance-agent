import type { MemoryStatus } from "@repo/contracts/memory";

export interface CreateMemoryRecordInput {
  id: string;
  userId: string;
  agentId: string;
  type: string;
  content: string;
  importance: number;
  nowMs: number;
}

export interface UpdateMemoryRecordInput {
  type?: string;
  content?: string;
  importance?: number;
  status?: Exclude<MemoryStatus, "deleted">;
  updatedAtMs: number;
}
