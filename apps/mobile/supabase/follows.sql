-- Follow System (X/Twitter style)
-- Users can follow each other without approval

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Helper function to check if a user is following another
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_follower_id
    AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM follows
    WHERE following_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get following count
CREATE OR REPLACE FUNCTION get_following_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM follows
    WHERE follower_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
