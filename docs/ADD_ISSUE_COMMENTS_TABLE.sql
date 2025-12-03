-- Create issue_comments table for threaded comments on repair issues
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to profiles table if it exists
-- This allows Supabase PostgREST to automatically join profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Note: This doesn't create a constraint, just helps with queries
    -- The actual relationship is through auth.users(id) -> profiles(id)
    ALTER TABLE issue_comments 
    ADD CONSTRAINT IF NOT EXISTS fk_issue_comments_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_parent_id ON issue_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user_id ON issue_comments(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments
CREATE POLICY "Anyone can view comments"
  ON issue_comments
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert comments
CREATE POLICY "Authenticated users can add comments"
  ON issue_comments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON issue_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON issue_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_issue_comments_updated_at
  BEFORE UPDATE ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

