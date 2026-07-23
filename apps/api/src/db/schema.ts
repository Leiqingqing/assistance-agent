import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const refreshTokenStatuses = [
  "active",
  "used",
  "revoked",
  "compromised",
] as const;

export type RefreshTokenStatus = (typeof refreshTokenStatuses)[number];

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  status: text("status").notNull(),
  deletedAtMs: integer("deleted_at_ms"),
});

export const applicationAuthMethods = sqliteTable(
  "application_auth_methods",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id").notNull(),
    authMethod: text("auth_method").notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull(),
    deletedAtMs: integer("deleted_at_ms"),
  },
);

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
  currentRefreshTokenId: text("current_refresh_token_id"),
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
  status: text("status", { enum: refreshTokenStatuses })
    .notNull()
    .default("active"),
  createdAtMs: integer("created_at_ms").notNull(),
  expiresAtMs: integer("expires_at_ms").notNull(),
});
