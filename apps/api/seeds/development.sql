-- Local development admin:
--   email: admin@example.com
--   password: Admin123!

INSERT OR IGNORE INTO applications (
  id,
  code,
  name,
  status,
  created_at_ms,
  updated_at_ms
) VALUES (
  'app_admin',
  'admin',
  'Admin',
  'active',
  1760000000000,
  1760000000000
);

INSERT OR IGNORE INTO application_auth_methods (
  id,
  application_id,
  auth_method,
  is_enabled,
  created_at_ms,
  updated_at_ms
) VALUES (
  'app_auth_admin_password',
  'app_admin',
  'password',
  1,
  1760000000000,
  1760000000000
);

INSERT OR IGNORE INTO users (
  id,
  display_name,
  status,
  created_at_ms,
  updated_at_ms
) VALUES (
  'user_admin',
  'Local Admin',
  'active',
  1760000000000,
  1760000000000
);

INSERT OR IGNORE INTO user_emails (
  id,
  user_id,
  email,
  email_normalized,
  is_verified,
  is_login_enabled,
  verified_at_ms,
  created_at_ms,
  updated_at_ms
) VALUES (
  'email_admin',
  'user_admin',
  'admin@example.com',
  'admin@example.com',
  1,
  1,
  1760000000000,
  1760000000000,
  1760000000000
);

INSERT OR IGNORE INTO roles (
  id,
  application_id,
  code,
  name,
  description,
  status,
  created_at_ms,
  updated_at_ms,
  active_at_ms
) VALUES (
  'role_admin_owner',
  'app_admin',
  'admin_owner',
  'Admin Owner',
  'Protected role for role administration',
  'active',
  1760000000000,
  1760000000000,
  1760000000000
);

INSERT OR IGNORE INTO user_role_bindings (
  id,
  user_id,
  role_id,
  application_id,
  granted_at_ms,
  created_at_ms,
  updated_at_ms
) VALUES (
  'binding_admin_owner_role',
  'user_admin',
  'role_admin_owner',
  'app_admin',
  1760000000000,
  1760000000000,
  1760000000000
);

UPDATE users
SET primary_email_id = 'email_admin'
WHERE id = 'user_admin';

INSERT OR IGNORE INTO password_credentials (
  id,
  user_id,
  password_hash,
  password_algo,
  password_updated_at_ms,
  failed_attempt_count,
  created_at_ms,
  updated_at_ms
) VALUES (
  'password_admin',
  'user_admin',
  'ABEiM0RVZneImaq7zN3u/w==$YDQtnQUzzM94P/W/KE87KUWpJNrvvI+BiyVVywSWpe8=',
  'sha256',
  1760000000000,
  0,
  1760000000000,
  1760000000000
);

INSERT OR IGNORE INTO roles (
  id,
  application_id,
  code,
  name,
  status,
  created_at_ms,
  updated_at_ms,
  active_at_ms
) VALUES (
  'role_admin',
  'app_admin',
  'admin',
  'Administrator',
  'active',
  1760000000000,
  1760000000000,
  1760000000000
);

INSERT OR IGNORE INTO user_role_bindings (
  id,
  user_id,
  role_id,
  application_id,
  granted_at_ms,
  created_at_ms,
  updated_at_ms
) VALUES (
  'binding_admin_role',
  'user_admin',
  'role_admin',
  'app_admin',
  1760000000000,
  1760000000000,
  1760000000000
);
