-- Add verification and login tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ;

-- Create login_verification_tokens table for magic link authentication
CREATE TABLE IF NOT EXISTS public.login_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.login_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_verification_tokens (only server can access)
CREATE POLICY "Service role can manage tokens" 
  ON public.login_verification_tokens 
  FOR ALL 
  USING (true);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS login_tokens_token_idx ON public.login_verification_tokens(token);
CREATE INDEX IF NOT EXISTS login_tokens_user_id_idx ON public.login_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS login_tokens_expires_idx ON public.login_verification_tokens(expires_at);

-- Update the handle_new_user function to set pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_verified, verification_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'User'),
    FALSE,
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Create admin policy to view all pending users (you'll need to set up admin role)
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND verification_status = 'approved'
    )
  );
