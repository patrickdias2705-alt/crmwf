-- Create chatwoot_conversations table
CREATE TABLE IF NOT EXISTS chatwoot_conversations (
  id BIGINT PRIMARY KEY,
  account_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  contact_id BIGINT,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  channel_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  priority VARCHAR(20) DEFAULT 'medium',
  assignee_id BIGINT,
  team_id BIGINT,
  labels TEXT[],
  custom_attributes JSONB DEFAULT '{}',
  snoozed_until TIMESTAMP WITH TIME ZONE,
  raw_data JSONB,
  created_at_crm TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at_crm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chatwoot_messages table
CREATE TABLE IF NOT EXISTS chatwoot_messages (
  id BIGINT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  account_id BIGINT NOT NULL,
  sender_id BIGINT,
  sender_type VARCHAR(50),
  message_type VARCHAR(50) NOT NULL,
  content TEXT,
  content_type VARCHAR(50) DEFAULT 'text',
  content_attributes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  private BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'sent',
  raw_data JSONB,
  created_at_crm TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at_crm TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (conversation_id) REFERENCES chatwoot_conversations(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatwoot_conversations_account_id ON chatwoot_conversations(account_id);
CREATE INDEX IF NOT EXISTS idx_chatwoot_conversations_status ON chatwoot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatwoot_conversations_contact_id ON chatwoot_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_chatwoot_conversations_assignee_id ON chatwoot_conversations(assignee_id);
CREATE INDEX IF NOT EXISTS idx_chatwoot_conversations_last_activity ON chatwoot_conversations(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatwoot_messages_conversation_id ON chatwoot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatwoot_messages_account_id ON chatwoot_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_chatwoot_messages_created_at ON chatwoot_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatwoot_messages_sender_type ON chatwoot_messages(sender_type);

-- Create chatwoot_webhook_config table to store webhook configuration
CREATE TABLE IF NOT EXISTS chatwoot_webhook_config (
  id SERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL,
  webhook_url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default webhook configuration
INSERT INTO chatwoot_webhook_config (account_id, webhook_url, events, is_active)
VALUES (
  1,
  'https://your-supabase-url.supabase.co/functions/v1/chatwoot-webhook',
  ARRAY['conversation.created', 'conversation.updated', 'message.created', 'message.updated'],
  TRUE
) ON CONFLICT DO NOTHING;

-- Create function to update updated_at_crm timestamp
CREATE OR REPLACE FUNCTION update_updated_at_crm()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at_crm = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at_crm
CREATE TRIGGER update_chatwoot_conversations_updated_at_crm
  BEFORE UPDATE ON chatwoot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_crm();

CREATE TRIGGER update_chatwoot_messages_updated_at_crm
  BEFORE UPDATE ON chatwoot_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_crm();

-- Grant permissions
GRANT ALL ON chatwoot_conversations TO authenticated;
GRANT ALL ON chatwoot_messages TO authenticated;
GRANT ALL ON chatwoot_webhook_config TO authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE chatwoot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatwoot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatwoot_webhook_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth requirements)
CREATE POLICY "Users can view chatwoot_conversations" ON chatwoot_conversations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert chatwoot_conversations" ON chatwoot_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chatwoot_conversations" ON chatwoot_conversations
  FOR UPDATE USING (true);

CREATE POLICY "Users can view chatwoot_messages" ON chatwoot_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert chatwoot_messages" ON chatwoot_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chatwoot_messages" ON chatwoot_messages
  FOR UPDATE USING (true);

CREATE POLICY "Users can view chatwoot_webhook_config" ON chatwoot_webhook_config
  FOR SELECT USING (true);

CREATE POLICY "Users can insert chatwoot_webhook_config" ON chatwoot_webhook_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chatwoot_webhook_config" ON chatwoot_webhook_config
  FOR UPDATE USING (true);