-- Create reminder_schedules table for admin to manage when reminders are sent
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  schedule_time TEXT NOT NULL, -- Format: "HH:MM" (e.g., "18:00")
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;

-- Only service role (admin) can manage schedules
CREATE POLICY "Service role can manage reminder schedules"
  ON reminder_schedules
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_reminder_schedules_time ON reminder_schedules(schedule_time);
CREATE INDEX idx_reminder_schedules_active ON reminder_schedules(is_active);

-- Insert default schedule at 18:00
INSERT INTO reminder_schedules (name, description, schedule_time, is_active)
VALUES (
  'Rappel du soir',
  'Rappel quotidien envoyé à 18h pour la révision',
  '18:00',
  true
);
