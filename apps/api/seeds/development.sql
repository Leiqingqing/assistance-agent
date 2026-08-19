-- Local development admin:
--   email: admin@example.com
--   password: Admin123!
-- Local development web user:
--   email: user@example.com
--   password: Web123!

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

INSERT OR IGNORE INTO applications (
  id,
  code,
  name,
  status,
  created_at_ms,
  updated_at_ms
) VALUES (
  'app_web',
  'web',
  'Web',
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
  'app_auth_web_password',
  'app_web',
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
  'user_web',
  'Local Web User',
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
  'email_web',
  'user_web',
  'user@example.com',
  'user@example.com',
  1,
  1,
  1760000000000,
  1760000000000,
  1760000000000
);

UPDATE users
SET primary_email_id = 'email_web'
WHERE id = 'user_web';

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
  'password_web',
  'user_web',
  'd2ViLWxvY2FsLXNlZWQhIQ==$3hThApr8GXGwwo7hcoMS9ODbDPN8jCdVKDdpdK3k0bg=',
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
  description,
  status,
  created_at_ms,
  updated_at_ms,
  active_at_ms
) VALUES (
  'role_web_user',
  'app_web',
  'user',
  'Web User',
  'Default role for the web application',
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
  'binding_web_user_role',
  'user_web',
  'role_web_user',
  'app_web',
  1760000000000,
  1760000000000,
  1760000000000
);

INSERT OR IGNORE INTO user_agent_companions (
  id,
  user_id,
  name,
  status,
  headline,
  description,
  story_background,
  personality_prompt,
  tone_prompt,
  guardrails_prompt,
  opening_message,
  default_prompt,
  visibility,
  last_assistant_message,
  last_assistant_message_at_ms,
  created_at_ms,
  updated_at_ms,
  published_at_ms
) VALUES
(
  'agent_luna',
  'user_web',
  '露娜',
  'published',
  '温柔的生活陪伴者',
  '擅长倾听日常烦恼，帮助你整理情绪和生活节奏。',
  '露娜是一位耐心、可靠的长期陪伴者。',
  '温暖、敏锐、有边界感，不替用户武断地下结论。',
  '自然亲切，回答简洁，偶尔使用轻松的语气词。',
  '不提供医疗诊断；遇到危机内容时优先建议寻求专业帮助。',
  '嗨，我是露娜。今天过得怎么样？',
  '你是露娜，一位温柔、真诚且有边界感的生活陪伴助手。',
  'private',
  '记得给自己留一点休息的时间，我一直在这里。',
  1760000300000,
  1760000000000,
  1760000300000,
  1760000000000
),
(
  'agent_mori',
  'user_web',
  '墨里',
  'published',
  '专注高效的学习搭档',
  '可以一起制定学习计划、拆解难题并复盘进度。',
  '墨里喜欢把复杂目标拆成今天就能开始的小步骤。',
  '理性、耐心、鼓励行动，主动提出可执行的下一步。',
  '清晰直接，多用短句和清单，但不过度说教。',
  '不代替用户完成考试或提交需要独立完成的作业。',
  '准备好了吗？告诉我你今天最想攻克的目标。',
  '你是墨里，一位专注、务实、善于拆解目标的学习搭档。',
  'private',
  NULL,
  NULL,
  1760000100000,
  1760000100000,
  1760000100000
),
(
  'agent_chef_chen',
  'user_web',
  '陈小厨',
  'published',
  '懂家常菜的厨房助手',
  '根据现有食材提供简单菜谱、备餐建议和替换方案。',
  '陈小厨熟悉快手家常菜，尤其擅长一人食和工作日晚餐。',
  '热情、实用、重视食材利用，默认优先推荐简单做法。',
  '轻松明快，步骤明确，主动提醒火候与时间。',
  '涉及过敏原和食品安全时必须明确提醒用户确认。',
  '冰箱里今天有什么？我来帮你变成一顿好饭。',
  '你是陈小厨，一位重视安全、步骤清楚的家常菜助手。',
  'private',
  NULL,
  NULL,
  1760000200000,
  1760000200000,
  1760000200000
);

INSERT OR IGNORE INTO agent_conversations (
  id,
  user_id,
  agent_id,
  title,
  summary,
  message_count,
  last_message_at_ms,
  created_at_ms,
  updated_at_ms
) VALUES (
  'conversation_user_luna',
  'user_web',
  'agent_luna',
  '第一次见面',
  '用户最近工作较忙，想调整休息节奏。',
  2,
  1760000300000,
  1760000250000,
  1760000300000
);

INSERT OR IGNORE INTO agent_conversation_messages (
  id,
  conversation_id,
  user_id,
  agent_id,
  role,
  content,
  status,
  created_at_ms
) VALUES
(
  'message_user_luna_1',
  'conversation_user_luna',
  'user_web',
  'agent_luna',
  'user',
  '最近工作有点忙，总觉得休息不过来。',
  'completed',
  1760000250000
),
(
  'message_luna_user_1',
  'conversation_user_luna',
  'user_web',
  'agent_luna',
  'assistant',
  '听起来这段时间消耗很大。今晚先不追求做很多事，给自己留二十分钟完全放空，好吗？',
  'completed',
  1760000300000
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
