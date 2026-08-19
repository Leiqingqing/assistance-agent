import {
  CreateMemoryRequestSchema,
  ListMemoriesQuerySchema,
  MemoryParamsSchema,
  UpdateMemoryRequestSchema,
} from "@repo/contracts/memory";
import { buildSuccess, createMeta } from "@repo/contracts/common";
import { Hono } from "hono";
import type { ApiEnvBindings } from "/env";
import { requireUser, type AuthVariables } from "@/auth/require-user";
import { validate } from "@/lib/validator";
import { handleCreateMemory } from "@/memory/service/create-memory";
import { handleDeleteMemory } from "@/memory/service/delete-memory";
import { handleGetMemory } from "@/memory/service/get-memory";
import { handleListMemories } from "@/memory/service/list-memories";
import { handleUpdateMemory } from "@/memory/service/update-memory";

export const memoryRoutes = new Hono<{
  Bindings: ApiEnvBindings;
  Variables: AuthVariables;
}>()
  .use(requireUser)
  .post("/", validate("json", CreateMemoryRequestSchema), async (c) => {
    const memory = await handleCreateMemory(c, c.req.valid("json"));
    return c.json(buildSuccess(createMeta(), memory), 201);
  })
  .get("/", validate("query", ListMemoriesQuerySchema), async (c) => {
    const result = await handleListMemories(c, c.req.valid("query"));
    return c.json(buildSuccess(createMeta(), result));
  })
  .get("/:memoryId", validate("param", MemoryParamsSchema), async (c) => {
    const memory = await handleGetMemory(c, c.req.valid("param").memoryId);
    return c.json(buildSuccess(createMeta(), memory));
  })
  .patch(
    "/:memoryId",
    validate("param", MemoryParamsSchema),
    validate("json", UpdateMemoryRequestSchema),
    async (c) => {
      const memory = await handleUpdateMemory(
        c,
        c.req.valid("param").memoryId,
        c.req.valid("json"),
      );
      return c.json(buildSuccess(createMeta(), memory));
    },
  )
  .delete("/:memoryId", validate("param", MemoryParamsSchema), async (c) => {
    const memory = await handleDeleteMemory(c, c.req.valid("param").memoryId);
    return c.json(buildSuccess(createMeta(), memory));
  });
