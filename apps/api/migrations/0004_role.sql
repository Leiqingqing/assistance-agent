ALTER TABLE roles ADD COLUMN active_at_ms INTEGER;
ALTER TABLE roles ADD COLUMN disable_at_ms INTEGER;

UPDATE roles
SET
  status = CASE
    WHEN deleted_at_ms IS NOT NULL THEN 'deleted'
    WHEN status = 'active' THEN 'active'
    ELSE 'disabled'
  END,
  active_at_ms = created_at_ms,
  disable_at_ms = CASE
    WHEN deleted_at_ms IS NULL AND status != 'active' THEN updated_at_ms
    ELSE NULL
  END;
