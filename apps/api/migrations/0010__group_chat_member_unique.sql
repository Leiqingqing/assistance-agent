CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_group_chat_members_chat_agent_unique
ON agent_group_chat_members(group_chat_id, agent_id);
