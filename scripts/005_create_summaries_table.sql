-- Create summaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  summary TEXT NOT NULL,
  short_summary TEXT,
  keywords TEXT[],
  flashcards JSONB,
  subject TEXT,
  type TEXT NOT NULL CHECK (type IN ('document', 'audio')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_own_summaries" ON public.summaries;
DROP POLICY IF EXISTS "users_insert_own_summaries" ON public.summaries;
DROP POLICY IF EXISTS "users_update_own_summaries" ON public.summaries;
DROP POLICY IF EXISTS "users_delete_own_summaries" ON public.summaries;

-- RLS Policies for summaries
CREATE POLICY "users_select_own_summaries" 
  ON public.summaries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_summaries" 
  ON public.summaries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_summaries" 
  ON public.summaries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_summaries" 
  ON public.summaries FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS summaries_user_id_idx ON public.summaries(user_id);
CREATE INDEX IF NOT EXISTS summaries_created_at_idx ON public.summaries(created_at DESC);
