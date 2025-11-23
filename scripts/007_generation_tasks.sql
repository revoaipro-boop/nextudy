-- Create generation_tasks table for persistent server-side generation
CREATE TABLE IF NOT EXISTS generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating', -- 'generating', 'completed', 'failed'
  partial_content TEXT DEFAULT '',
  final_content TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Store request context
  subject TEXT,
  grade TEXT,
  format TEXT,
  messages_context JSONB, -- The conversation history to send to the model
  
  CONSTRAINT valid_status CHECK (status IN ('generating', 'completed', 'failed'))
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_message_id ON generation_tasks(message_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_conversation_id ON generation_tasks(conversation_id);

-- Enable RLS
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY users_select_own_tasks ON generation_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY users_insert_own_tasks ON generation_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can update tasks (for the generation process)
CREATE POLICY service_update_tasks ON generation_tasks
  FOR UPDATE
  USING (true);
