import {
  AddAgentGroupChatRequestSchema,
  AgentGroupChatMemberParamsSchema,
  AgentGroupChatParamsSchema,
  CreateAgentGroupChatRequestSchema,
  SendAgentGroupChatMessageRequestSchema,
} from "@repo/contracts/group-chat";
import { AgentConversationMessagesQuerySchema } from "@repo/contracts/chat";
import { buildSuccess, createMeta } from "@repo/contracts/common";
import { Hono } from "hono";
import type { ApiEnvBindings } from "/env";
import { requireUser, type AuthVariables } from "@/auth/require-user";
import { handleAddGroupChatAgent } from "@/group-chat/service/add-group-chat-agent";
import { handleCreateGroupChat } from "@/group-chat/service/create-group-chat";
import { handleDeleteGroupChat } from "@/group-chat/service/delete-group-chat";
import { handleGetGroupChatMessages } from "@/group-chat/service/get-group-chat-messages";
import { handleGetGroupChat } from "@/group-chat/service/get-group-chat";
import { handleListGroupChats } from "@/group-chat/service/list-group-chats";
import { handleRemoveGroupChatAgent } from "@/group-chat/service/remove-group-chat-agent";
import { handleSendGroupChatMessage } from "@/group-chat/service/send-group-chat-message";
import { validate } from "@/lib/validator";

export const groupChatRoutes = new Hono<{
  Bindings: ApiEnvBindings;
  Variables: AuthVariables;
}>()
  .use(requireUser)
  .post("/", validate("json", CreateAgentGroupChatRequestSchema), async (c) => {
    const result = await handleCreateGroupChat(c, c.req.valid("json"));
    return c.json(buildSuccess(createMeta(), result), 201);
  })
  .post(
    "/:groupChatId/agents",
    validate("param", AgentGroupChatParamsSchema),
    validate("json", AddAgentGroupChatRequestSchema),
    async (c) => {
      const result = await handleAddGroupChatAgent(
        c,
        c.req.valid("param").groupChatId,
        c.req.valid("json"),
      );
      return c.json(buildSuccess(createMeta(), result), 201);
    },
  )
  .post(
    "/messages",
    validate("json", SendAgentGroupChatMessageRequestSchema),
    async (c) => {
      const result = await handleSendGroupChatMessage(c, c.req.valid("json"));
      return c.json(buildSuccess(createMeta(), result));
    },
  )
  .get("/", async (c) => {
    const groupChats = await handleListGroupChats(c);
    return c.json(buildSuccess(createMeta(), groupChats));
  })
  .get(
    "/:groupChatId/messages",
    validate("param", AgentGroupChatParamsSchema),
    validate("query", AgentConversationMessagesQuerySchema),
    async (c) => {
      const result = await handleGetGroupChatMessages(
        c,
        c.req.valid("param").groupChatId,
        c.req.valid("query"),
      );
      return c.json(buildSuccess(createMeta(), result));
    },
  )
  .get(
    "/:groupChatId",
    validate("param", AgentGroupChatParamsSchema),
    async (c) => {
      const result = await handleGetGroupChat(
        c,
        c.req.valid("param").groupChatId,
      );
      return c.json(buildSuccess(createMeta(), result));
    },
  )
  .delete(
    "/:groupChatId/agents/:agentId",
    validate("param", AgentGroupChatMemberParamsSchema),
    async (c) => {
      const { groupChatId, agentId } = c.req.valid("param");
      const result = await handleRemoveGroupChatAgent(c, groupChatId, agentId);
      return c.json(buildSuccess(createMeta(), result));
    },
  )
  .delete(
    "/:groupChatId",
    validate("param", AgentGroupChatParamsSchema),
    async (c) => {
      const result = await handleDeleteGroupChat(
        c,
        c.req.valid("param").groupChatId,
      );
      return c.json(buildSuccess(createMeta(), result));
    },
  );
