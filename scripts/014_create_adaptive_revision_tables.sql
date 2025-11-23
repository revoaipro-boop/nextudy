-- Create revision_sessions table to track emotional states during revision
CREATE TABLE IF NOT EXISTS revision_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('chill', 'performance', 'stressed')),
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  focus_level INTEGER CHECK (focus_level >= 1 AND focus_level <= 5),
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  average_response_time FLOAT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_nodes table for the neural network
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  times_reviewed INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, concept_name, subject)
);

-- Create knowledge_connections table for concept relationships
CREATE TABLE IF NOT EXISTS knowledge_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('prerequisite', 'related', 'example', 'application')),
  strength INTEGER DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_node_id, to_node_id, connection_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revision_sessions_user_id ON revision_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_started_at ON revision_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_user_id ON knowledge_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_subject ON knowledge_nodes(subject);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_user_id ON knowledge_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_from_node ON knowledge_connections(from_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_to_node ON knowledge_connections(to_node_id);

-- Enable Row Level Security
ALTER TABLE revision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revision_sessions
CREATE POLICY "Users can view their own revision sessions"
  ON revision_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revision sessions"
  ON revision_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revision sessions"
  ON revision_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for knowledge_nodes
CREATE POLICY "Users can view their own knowledge nodes"
  ON knowledge_nodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge nodes"
  ON knowledge_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge nodes"
  ON knowledge_nodes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge nodes"
  ON knowledge_nodes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for knowledge_connections
CREATE POLICY "Users can view their own knowledge connections"
  ON knowledge_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge connections"
  ON knowledge_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge connections"
  ON knowledge_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge connections"
  ON knowledge_connections FOR DELETE
  USING (auth.uid() = user_id);
