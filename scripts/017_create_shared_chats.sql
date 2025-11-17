-- Create shared_chats table for sharing ChatIA conversations
CREATE TABLE IF NOT EXISTS shared_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_history_id UUID REFERENCES chat_history(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  title TEXT,
  subject TEXT,
  grade TEXT,
  format TEXT,
  messages JSONB NOT NULL,
  views_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT valid_share_token CHECK (char_length(share_token) >= 10)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_chats_token ON shared_chats(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_chats_user ON shared_chats(user_id);

-- Enable RLS
ALTER TABLE shared_chats ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own shared chats"
  ON shared_chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own shared chats"
  ON shared_chats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public shared chats by token"
  ON shared_chats FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Users can update their own shared chats"
  ON shared_chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared chats"
  ON shared_chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
