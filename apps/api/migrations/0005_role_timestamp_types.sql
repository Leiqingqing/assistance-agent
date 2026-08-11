UPDATE roles
SET
  active_at_ms = CASE
    WHEN typeof(active_at_ms) IN ('integer', 'real')
      THEN CAST(active_at_ms AS INTEGER)
    WHEN
      typeof(active_at_ms) = 'text'
      AND trim(active_at_ms) != ''
      AND trim(active_at_ms) NOT GLOB '*[^0-9]*'
      THEN CAST(active_at_ms AS INTEGER)
    ELSE CAST(created_at_ms AS INTEGER)
  END,
  disable_at_ms = CASE
    WHEN disable_at_ms IS NULL THEN NULL
    WHEN typeof(disable_at_ms) IN ('integer', 'real')
      THEN CAST(disable_at_ms AS INTEGER)
    WHEN
      typeof(disable_at_ms) = 'text'
      AND trim(disable_at_ms) != ''
      AND trim(disable_at_ms) NOT GLOB '*[^0-9]*'
      THEN CAST(disable_at_ms AS INTEGER)
    ELSE NULL
  END;

CREATE TRIGGER roles_timestamp_types_before_insert
BEFORE INSERT ON roles
WHEN
  typeof(NEW.active_at_ms) != 'integer'
  OR (
    NEW.disable_at_ms IS NOT NULL
    AND typeof(NEW.disable_at_ms) != 'integer'
  )
BEGIN
  SELECT RAISE(ABORT, 'role timestamps must be integer milliseconds');
END;

CREATE TRIGGER roles_timestamp_types_before_update
BEFORE UPDATE OF active_at_ms, disable_at_ms ON roles
WHEN
  typeof(NEW.active_at_ms) != 'integer'
  OR (
    NEW.disable_at_ms IS NOT NULL
    AND typeof(NEW.disable_at_ms) != 'integer'
  )
BEGIN
  SELECT RAISE(ABORT, 'role timestamps must be integer milliseconds');
END;
