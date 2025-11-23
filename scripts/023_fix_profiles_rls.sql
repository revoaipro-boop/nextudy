-- Fix infinite recursion in profiles RLS policies
-- This script drops all existing policies and creates simple, non-recursive ones

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_delete_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create new simple policies without any recursion
-- These policies only check auth.uid() directly without any table lookups

-- Allow users to view their own profile
CREATE POLICY "profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to insert their own profile (needed during signup)
CREATE POLICY "profiles_insert_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "profiles_delete_own" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- Note: The "Admins can view all profiles" policy has been removed
-- If you need admin access, use the service role key instead
-- This prevents infinite recursion that can occur when checking admin status
