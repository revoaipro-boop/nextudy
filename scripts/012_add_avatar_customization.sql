-- Add avatar customization columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS avatar_accessories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS avatar_background TEXT DEFAULT 'gradient-blue',
ADD COLUMN IF NOT EXISTS avatar_background_color TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.avatar_type IS 'Type of avatar: default, cat, dog, robot, alien, etc.';
COMMENT ON COLUMN public.profiles.avatar_accessories IS 'Array of accessories: glasses, hat, headphones, crown, etc.';
COMMENT ON COLUMN public.profiles.avatar_background IS 'Background style: solid, gradient-blue, gradient-purple, gradient-pink, image';
COMMENT ON COLUMN public.profiles.avatar_background_color IS 'Custom background color if avatar_background is solid';
