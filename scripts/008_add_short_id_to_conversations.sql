-- Add short_id column to conversations table for URL-friendly IDs
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS short_id VARCHAR(10) UNIQUE;

-- Create index on short_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_conversations_short_id ON conversations(short_id);

-- Update existing conversations with short IDs (if any exist)
-- This is a one-time migration for existing data
UPDATE conversations 
SET short_id = UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 4))
WHERE short_id IS NULL;
