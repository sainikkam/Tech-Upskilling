-- AI Engineer Upskilling Platform — Database Schema
-- Run this in the Supabase SQL editor to set up your database.

-- User concept progress (tracks mastery per concept per user)
CREATE TABLE IF NOT EXISTS user_concept_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  concept_id TEXT NOT NULL,
  mastery_score FLOAT DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  attempts INT DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

-- Quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  concept_id TEXT NOT NULL,
  score FLOAT,
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual quiz question responses
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  concept_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cached concept explanations (avoid regenerating on every view)
CREATE TABLE IF NOT EXISTS concept_explanations (
  concept_id TEXT PRIMARY KEY,
  explanation TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security

ALTER TABLE user_concept_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_explanations ENABLE ROW LEVEL SECURITY;

-- Drop policies before recreating (safe to re-run)
DROP POLICY IF EXISTS "Users can read own progress" ON user_concept_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_concept_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_concept_progress;
DROP POLICY IF EXISTS "Users can read own quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Users can insert own quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Users can update own quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Users can read quiz responses for their sessions" ON quiz_responses;
DROP POLICY IF EXISTS "Users can insert quiz responses for their sessions" ON quiz_responses;
DROP POLICY IF EXISTS "Authenticated users can read explanations" ON concept_explanations;
DROP POLICY IF EXISTS "Service role can write explanations" ON concept_explanations;

-- Policies: users can only access their own data
CREATE POLICY "Users can read own progress"
  ON user_concept_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_concept_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_concept_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own quiz sessions"
  ON quiz_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz sessions"
  ON quiz_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read quiz responses for their sessions"
  ON quiz_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions qs
      WHERE qs.id = quiz_responses.session_id AND qs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quiz responses for their sessions"
  ON quiz_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions qs
      WHERE qs.id = quiz_responses.session_id AND qs.user_id = auth.uid()
    )
  );

-- Explanations are read by all authenticated users, written by service role
CREATE POLICY "Authenticated users can read explanations"
  ON concept_explanations FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Service role can write explanations"
  ON concept_explanations FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON user_concept_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_next_review ON user_concept_progress(next_review_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON quiz_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON quiz_responses(session_id);
