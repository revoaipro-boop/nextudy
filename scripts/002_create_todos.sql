-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones to make script idempotent
DROP POLICY IF EXISTS "users_select_own_todos" ON public.todos;
DROP POLICY IF EXISTS "users_insert_own_todos" ON public.todos;
DROP POLICY IF EXISTS "users_update_own_todos" ON public.todos;
DROP POLICY IF EXISTS "users_delete_own_todos" ON public.todos;

-- RLS Policies for todos
CREATE POLICY "users_select_own_todos" 
  ON public.todos FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_todos" 
  ON public.todos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_todos" 
  ON public.todos FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_todos" 
  ON public.todos FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON public.todos(completed);
