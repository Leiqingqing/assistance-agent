CREATE TABLE IF NOT EXISTS agent_group_chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  message_count INTEGER NOT NULL,
  last_message_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_group_chat_members (
  id TEXT PRIMARY KEY,
  group_chat_id TEXT NOT NULL REFERENCES agent_group_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES user_agent_companions(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  status TEXT NOT NULL,
  joined_at_ms INTEGER NOT NULL,
  removed_at_ms INTEGER
);

CREATE TABLE IF NOT EXISTS agent_group_chat_messages (
  id TEXT PRIMARY KEY,
  group_chat_id TEXT NOT NULL REFERENCES agent_group_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  agent_id TEXT REFERENCES user_agent_companions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  turn_index INTEGER NOT NULL,
  metadata_json TEXT,
  created_at_ms INTEGER NOT NULL
);