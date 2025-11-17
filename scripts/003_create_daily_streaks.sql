-- Create daily_streaks table
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_date DATE NOT NULL,
  activity_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones to make script idempotent
DROP POLICY IF EXISTS "users_select_own_streaks" ON public.daily_streaks;
DROP POLICY IF EXISTS "users_insert_own_streaks" ON public.daily_streaks;
DROP POLICY IF EXISTS "users_update_own_streaks" ON public.daily_streaks;

-- RLS Policies for daily_streaks
CREATE POLICY "users_select_own_streaks" 
  ON public.daily_streaks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_streaks" 
  ON public.daily_streaks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_streaks" 
  ON public.daily_streaks FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS daily_streaks_user_id_idx ON public.daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS daily_streaks_date_idx ON public.daily_streaks(streak_date);

-- Function to get current streak for a user
CREATE OR REPLACE FUNCTION public.get_current_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  -- Check if user has activity today or yesterday
  IF NOT EXISTS (
    SELECT 1 FROM public.daily_streaks 
    WHERE user_id = p_user_id 
    AND streak_date IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day')
  ) THEN
    RETURN 0;
  END IF;
  
  -- Count consecutive days
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.daily_streaks 
      WHERE user_id = p_user_id AND streak_date = check_date
    ) THEN
      current_streak := current_streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN current_streak;
END;
$$;
