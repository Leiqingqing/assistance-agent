import { InboxChatRequestSchema } from "@repo/contracts/chat";
import { Hono } from "hono";
import type { ApiEnvBindings } from "/env";
import { handleInboxChat } from "@/chat/service/inbox-chat";
import { validate } from "@/lib/validator";

export const chatRoutes = new Hono<{ Bindings: ApiEnvBindings }>().post(
  "/inbox",
  validate("json", InboxChatRequestSchema),
  async (c) => {
    const req = c.req.valid("json");
    return handleInboxChat(c.env, req);
  },
);
