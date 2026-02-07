-- Relationship Status for Dating Profiles
-- Add relationship_status column to dating_profiles table

ALTER TABLE dating_profiles
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'single'
CHECK (relationship_status IN ('single', 'dating', 'complicated', 'married', 'divorced', 'widowed', 'rather_not_say'));

-- Comment Reactions Table (if not exists)
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see all comment reactions
CREATE POLICY IF NOT EXISTS "Comment reactions are viewable by everyone"
  ON comment_reactions FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own reactions
CREATE POLICY IF NOT EXISTS "Users can insert their own comment reactions"
  ON comment_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reactions
CREATE POLICY IF NOT EXISTS "Users can update their own comment reactions"
  ON comment_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY IF NOT EXISTS "Users can delete their own comment reactions"
  ON comment_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
