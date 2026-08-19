import {
  AgentConversationMessagesQuerySchema,
  AgentConversationParamsSchema,
  InboxChatRequestSchema,
} from "@repo/contracts/chat";
import { buildSuccess, createMeta } from "@repo/contracts/common";
import { Hono } from "hono";
import type { ApiEnvBindings } from "/env";
import { requireUser, type AuthVariables } from "@/auth/require-user";
import { handleGetConversation } from "@/chat/service/get-conversation";
import { handleGetMessages } from "@/chat/service/get-messages";
import { handleInboxChat } from "@/chat/service/inbox-chat";
import { handleListAgents } from "@/chat/service/list-agents";
import { validate } from "@/lib/validator";

export const chatRoutes = new Hono<{
  Bindings: ApiEnvBindings;
  Variables: AuthVariables;
}>().post(
  "/inbox",
  requireUser,
  validate("json", InboxChatRequestSchema),
  async (c) => {
    const req = c.req.valid("json");
    return handleInboxChat(c, req);
  },
);

export const rpcChatRoutes = new Hono<{
  Bindings: ApiEnvBindings;
  Variables: AuthVariables;
}>()
  .get("/inbox", requireUser, async (c) => {
    const result = await handleListAgents(c);
    return c.json(buildSuccess(createMeta(), result));
  })
  .get(
    "/inbox/:agentId/conversation",
    requireUser,
    validate("param", AgentConversationParamsSchema),
    async (c) => {
      const result = await handleGetConversation(
        c,
        c.req.valid("param").agentId,
      );

      return c.json(buildSuccess(createMeta(), result));
    },
  )
  .get(
    "/inbox/:agentId/messages",
    requireUser,
    validate("param", AgentConversationParamsSchema),
    validate("query", AgentConversationMessagesQuerySchema),
    async (c) => {
      const result = await handleGetMessages(
        c,
        c.req.valid("param").agentId,
        c.req.valid("query"),
      );

      return c.json(buildSuccess(createMeta(), result));
    },
  );
