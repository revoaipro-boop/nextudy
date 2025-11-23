-- Create user_achievements table to track overall stats
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  summaries_created INTEGER DEFAULT 0,
  qcm_completed INTEGER DEFAULT 0,
  flashcards_reviewed INTEGER DEFAULT 0,
  todos_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create points_history table to track points over time for graphs
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  activity_type TEXT NOT NULL, -- 'summary', 'qcm', 'flashcard', 'todo'
  activity_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at);

-- Enable Row Level Security
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for points_history
CREATE POLICY "Users can view their own points history"
  ON points_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points history"
  ON points_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert initial achievements for existing users
INSERT INTO user_achievements (user_id, total_points, summaries_created, qcm_completed, flashcards_reviewed, todos_completed)
SELECT 
  id,
  0,
  0,
  0,
  0,
  0
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
