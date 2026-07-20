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