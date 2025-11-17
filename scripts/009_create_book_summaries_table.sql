-- Create book_summaries table for storing book summaries
CREATE TABLE IF NOT EXISTS public.book_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  summary TEXT NOT NULL,
  key_points TEXT[],
  themes TEXT[],
  characters JSONB,
  quotes TEXT[],
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.book_summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_own_book_summaries" ON public.book_summaries;
DROP POLICY IF EXISTS "users_insert_own_book_summaries" ON public.book_summaries;
DROP POLICY IF EXISTS "users_update_own_book_summaries" ON public.book_summaries;
DROP POLICY IF EXISTS "users_delete_own_book_summaries" ON public.book_summaries;

-- RLS Policies for book_summaries
CREATE POLICY "users_select_own_book_summaries" 
  ON public.book_summaries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_book_summaries" 
  ON public.book_summaries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_book_summaries" 
  ON public.book_summaries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_book_summaries" 
  ON public.book_summaries FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS book_summaries_user_id_idx ON public.book_summaries(user_id);
CREATE INDEX IF NOT EXISTS book_summaries_created_at_idx ON public.book_summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS book_summaries_book_title_idx ON public.book_summaries(book_title);
CREATE INDEX IF NOT EXISTS book_summaries_author_idx ON public.book_summaries(author);
