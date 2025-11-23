-- Update existing summaries table to link with users
-- First check if summaries table exists and add user_id if it doesn't have it
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'summaries'
  ) THEN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'summaries' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.summaries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS summaries_user_id_idx ON public.summaries(user_id);
    END IF;
    
    -- Enable RLS if not already enabled
    ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "users_select_own_summaries" ON public.summaries;
    DROP POLICY IF EXISTS "users_insert_own_summaries" ON public.summaries;
    DROP POLICY IF EXISTS "users_update_own_summaries" ON public.summaries;
    DROP POLICY IF EXISTS "users_delete_own_summaries" ON public.summaries;
    
    -- Create RLS policies
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
  END IF;
END $$;
