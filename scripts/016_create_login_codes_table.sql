-- Create login_codes table for 4-digit code authentication
CREATE TABLE IF NOT EXISTS login_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_login_codes_email ON login_codes(email);

-- Create index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_login_codes_expires_at ON login_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE login_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access login codes (server-side only)
CREATE POLICY "Service role can manage login codes"
  ON login_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
