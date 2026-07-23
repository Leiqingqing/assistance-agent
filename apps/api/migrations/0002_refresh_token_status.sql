ALTER TABLE refresh_tokens
ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'used', 'revoked', 'compromised'));

CREATE INDEX idx_refresh_tokens_session_status
ON refresh_tokens(session_id, status);
