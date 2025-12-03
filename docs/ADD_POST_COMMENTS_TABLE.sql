-- Create post_comments table for threaded comments on posts with labels
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES furniture_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  label TEXT CHECK (label IN ('question', 'comment', 'suggestion')) DEFAULT 'comment',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_label ON post_comments(label);

-- Enable RLS (Row Level Security)
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments
CREATE POLICY "Anyone can view comments"
  ON post_comments
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert comments
CREATE POLICY "Authenticated users can add comments"
  ON post_comments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON post_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON post_comments
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
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

