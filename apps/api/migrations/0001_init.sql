CREATE TABLE users (
  id TEXT PRIMARY KEY,
  primary_email_id TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  deleted_at_ms INTEGER,
  last_login_at_ms INTEGER
);

CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  application_id TEXT NOT NULL,
  auth_method TEXT NOT NULL,
  password_credential_id TEXT,
  oauth_identity_id TEXT,
  login_email_id TEXT,
  device_type TEXT,
  device_name TEXT,
  current_refresh_token_id TEXT,
  access_token_jti TEXT,
  created_at_ms INTEGER NOT NULL,
  last_seen_at_ms INTEGER,
  expires_at_ms INTEGER NOT NULL,
  revoked_at_ms INTEGER,
  revoke_reason TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (password_credential_id) REFERENCES password_credentials(id),
  FOREIGN KEY (oauth_identity_id) REFERENCES oauth_identities(id),
  FOREIGN KEY (login_email_id) REFERENCES user_emails(id)
);

CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  used_at_ms INTEGER,
  revoked_at_ms INTEGER,
  replaced_by_token_id TEXT,
  reuse_detected_at_ms INTEGER,
  FOREIGN KEY (session_id) REFERENCES auth_sessions(id),
  FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens(id)
);

CREATE TABLE user_emails (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  is_verified INTEGER NOT NULL DEFAULT 0,
  is_login_enabled INTEGER NOT NULL DEFAULT 1,
  verified_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  deleted_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE password_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_algo TEXT NOT NULL,
  password_params_json TEXT,
  password_updated_at_ms INTEGER NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  failed_attempt_count INTEGER NOT NULL DEFAULT 0,
  locked_until_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  disabled_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE oauth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  provider_email TEXT,
  provider_email_normalized TEXT,
  provider_display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  linked_at_ms INTEGER NOT NULL,
  last_login_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  deleted_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  deleted_at_ms INTEGER
);

CREATE TABLE application_auth_methods (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  auth_method TEXT NOT NULL,
  provider TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  config_json TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  deleted_at_ms INTEGER,
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  application_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  deleted_at_ms INTEGER,
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE user_role_bindings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  application_id TEXT,
  granted_at_ms INTEGER NOT NULL,
  revoked_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE oauth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  provider_email TEXT,
  provider_email_normalized TEXT,
  provider_display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  linked_at_ms INTEGER NOT NULL,
  last_login_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  deleted_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE INDEX idx_auth_sessions_user_id
ON auth_sessions(user_id);

CREATE INDEX idx_auth_sessions_application_user
ON auth_sessions(application_id, user_id);

CREATE INDEX idx_auth_sessions_current_refresh_token_id
ON auth_sessions(current_refresh_token_id);

CREATE UNIQUE INDEX idx_refresh_tokens_token_hash
ON refresh_tokens(token_hash);

CREATE INDEX idx_refresh_tokens_session_id
ON refresh_tokens(session_id);

CREATE INDEX idx_refresh_tokens_expires_at
ON refresh_tokens(expires_at_ms);

CREATE INDEX idx_users_primary_email_id
ON users(primary_email_id);

CREATE UNIQUE INDEX idx_user_emails_unique_active_email
ON user_emails(email_normalized)
WHERE deleted_at_ms IS NULL;

CREATE INDEX idx_user_emails_user_id
ON user_emails(user_id);

CREATE INDEX idx_user_emails_login_lookup
ON user_emails(email_normalized, is_login_enabled, is_verified)
WHERE deleted_at_ms IS NULL;

CREATE UNIQUE INDEX idx_password_credentials_user_id
ON password_credentials(user_id)
WHERE disabled_at_ms IS NULL;

CREATE UNIQUE INDEX idx_oauth_identities_provider_subject
ON oauth_identities(provider, provider_subject)
WHERE deleted_at_ms IS NULL;

CREATE INDEX idx_oauth_identities_user_id
ON oauth_identities(user_id);

CREATE UNIQUE INDEX idx_applications_code
ON applications(code)
WHERE deleted_at_ms IS NULL;

CREATE UNIQUE INDEX idx_application_auth_methods_unique
ON application_auth_methods(application_id, auth_method, IFNULL(provider, ''))
WHERE deleted_at_ms IS NULL;

CREATE INDEX idx_application_auth_methods_application_id
ON application_auth_methods(application_id);

CREATE UNIQUE INDEX idx_roles_application_code
ON roles(IFNULL(application_id, 'global'), code)
WHERE deleted_at_ms IS NULL;

CREATE INDEX idx_roles_application_id
ON roles(application_id);

CREATE INDEX idx_user_role_bindings_user_id
ON user_role_bindings(user_id);

CREATE INDEX idx_user_role_bindings_role_id
ON user_role_bindings(role_id);

CREATE UNIQUE INDEX idx_user_role_bindings_active_unique
ON user_role_bindings(user_id, role_id, IFNULL(application_id, 'global'))
WHERE revoked_at_ms IS NULL;