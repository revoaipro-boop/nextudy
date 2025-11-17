-- Update RLS policies for activation_tokens table
-- This allows both authenticated users and service role to manage tokens

-- Drop existing policy
DROP POLICY IF EXISTS "Service role can manage activation tokens" ON activation_tokens;

-- Allow inserts for authenticated users (including service_role and edge functions)
CREATE POLICY "Allow inserts for authenticated users"
ON activation_tokens
FOR INSERT
WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Allow service role full access (read, update, delete)
CREATE POLICY "Allow service role full access"
ON activation_tokens
FOR ALL
USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own tokens
CREATE POLICY "Allow users to read own tokens"
ON activation_tokens
FOR SELECT
USING (auth.uid() = user_id OR auth.role() = 'service_role');
