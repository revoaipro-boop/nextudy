-- Create activation_tokens table for admin activation links
-- Tokens are hashed for security and expire after 24 hours

CREATE TABLE IF NOT EXISTS activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activation_tokens_token_hash ON activation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_user_id ON activation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_expires_at ON activation_tokens(expires_at);

-- Enable RLS
ALTER TABLE activation_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access (admin operations)
CREATE POLICY "Service role can manage activation tokens" ON activation_tokens
  FOR ALL
  USING (auth.role() = 'service_role');
