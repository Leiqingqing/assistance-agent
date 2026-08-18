import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  status: text("status").notNull(),
  deletedAtMs: integer("deleted_at_ms"),
});

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["active", "disabled", "deleted"],
  }).notNull(),
  createdAtMs: integer("created_at_ms").notNull(),
  updatedAtMs: integer("updated_at_ms").notNull(),
  activeAtMs: integer("active_at_ms").notNull(),
  disableAtMs: integer("disable_at_ms"),
  deletedAtMs: integer("deleted_at_ms"),
});

export const applicationAuthMethods = sqliteTable("application_auth_methods", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull(),
  authMethod: text("auth_method").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull(),
  deletedAtMs: integer("deleted_at_ms"),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  updatedAtMs: integer("updated_at_ms").notNull(),
  deletedAtMs: integer("deleted_at_ms"),
  lastLoginAtMs: integer("last_login_at_ms"),
});

export const userEmails = sqliteTable("user_emails", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  emailNormalized: text("email_normalized").notNull(),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull(),
  isLoginEnabled: integer("is_login_enabled", { mode: "boolean" }).notNull(),
  deletedAtMs: integer("deleted_at_ms"),
});

export const passwordCredentials = sqliteTable("password_credentials", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordAlgo: text("password_algo").notNull(),
  failedAttemptCount: integer("failed_attempt_count").notNull(),
  lockedUntilMs: integer("locked_until_ms"),
  updatedAtMs: integer("updated_at_ms").notNull(),
  disabledAtMs: integer("disabled_at_ms"),
});

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  applicationId: text("application_id").notNull(),
  authMethod: text("auth_method").notNull(),
  passwordCredentialId: text("password_credential_id"),
  loginEmailId: text("login_email_id"),
  createdAtMs: integer("created_at_ms").notNull(),
  lastSeenAtMs: integer("last_seen_at_ms"),
  expiresAtMs: integer("expires_at_ms").notNull(),
  revokedAtMs: integer("revoked_at_ms"),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
});

export const refreshTokens = sqliteTable("refresh_tokens", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  createdAtMs: integer("created_at_ms").notNull(),
  expiresAtMs: integer("expires_at_ms").notNull(),
  usedAtMs: integer("used_at_ms"),
  revokedAtMs: integer("revoked_at_ms"),
  replacedByTokenId: text("replaced_by_token_id"),
  reuseDetectedAtMs: integer("reuse_detected_at_ms"),
});

export const userAgentCompanions = sqliteTable(
  "user_agent_companions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status", {
      enum: ["draft", "published", "archived"],
    }).notNull(),
    createdAtMs: integer("created_at_ms").notNull(),
    updatedAtMs: integer("updated_at_ms").notNull(),
    publishedAtMs: integer("published_at_ms"),
    archivedAtMs: integer("archived_at_ms"),
  },
  (table) => [
    index("idx_user_agent_companions_user_id").on(table.userId),
    index("idx_user_agent_companions_user_status").on(
      table.userId,
      table.status,
    ),
  ],
);

export const agentConversations = sqliteTable(
  "agent_conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
      .notNull()
      .references(() => userAgentCompanions.id, { onDelete: "cascade" }),
    title: text("title"),
    summary: text("summary"),
    messageCount: integer("message_count").notNull().default(0),
    lastMessageAtMs: integer("last_message_at_ms"),
    createdAtMs: integer("created_at_ms").notNull(),
    updatedAtMs: integer("updated_at_ms").notNull(),
  },
  (table) => [
    uniqueIndex("idx_agent_conversations_user_agent_unique").on(
      table.userId,
      table.agentId,
    ),
  ],
);

export const agentConversationMessages = sqliteTable(
  "agent_conversation_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => agentConversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
      .notNull()
      .references(() => userAgentCompanions.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    status: text("status", { enum: ["completed", "failed"] }).notNull(),
    metadataJson: text("metadata_json"),
    createdAtMs: integer("created_at_ms").notNull(),
  },
  (table) => [
    index("idx_agent_conversation_messages_conversation_created").on(
      table.conversationId,
      table.createdAtMs,
    ),
  ],
);

export const agentMemories = sqliteTable("agent_memories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => userAgentCompanions.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  content: text("content").notNull(),
  importance: integer("importance").notNull().default(3),
  status: text("status", {
    enum: ["active", "disabled", "deleted"],
  }).notNull(),
  sourceMessageId: text("source_message_id").references(
    () => agentConversationMessages.id,
    { onDelete: "set null" },
  ),
  createdAtMs: integer("created_at_ms").notNull(),
  updatedAtMs: integer("updated_at_ms").notNull(),
});
