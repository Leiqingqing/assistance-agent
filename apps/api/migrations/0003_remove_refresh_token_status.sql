DROP INDEX IF EXISTS idx_refresh_tokens_session_status;

ALTER TABLE refresh_tokens
DROP COLUMN status;

DROP INDEX IF EXISTS idx_auth_sessions_current_refresh_token_id;

ALTER TABLE auth_sessions
DROP COLUMN current_refresh_token_id;

CREATE INDEX idx_refresh_tokens_session_created
ON refresh_tokens(session_id, created_at_ms DESC);
