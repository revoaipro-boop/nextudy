-- Add daily reminder preference to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS daily_reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_reminder_time TEXT DEFAULT '18:00';

-- Add comment
COMMENT ON COLUMN profiles.daily_reminder_enabled IS 'Whether user wants to receive daily revision reminders';
COMMENT ON COLUMN profiles.daily_reminder_time IS 'Time to send daily reminder (HH:MM format)';
