-- Comment Reactions Table
-- Allows users to react to comments with emojis

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('alev', 'yanindayim', 'yilan', 'sok', 'helal', 'begeni', 'ofke', 'korku', 'huzun', 'saskinlik')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all comment reactions"
  ON comment_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comment reactions"
  ON comment_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment reactions"
  ON comment_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment reactions"
  ON comment_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function to get top comment for a post with reaction count
CREATE OR REPLACE FUNCTION get_top_comment(p_post_id UUID)
RETURNS TABLE (
  comment_id UUID,
  content TEXT,
  author_username TEXT,
  author_avatar_url TEXT,
  is_anonymous BOOLEAN,
  reaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    COALESCE(p.username, 'Anonim') as author_username,
    COALESCE(p.avatar_url, '') as author_avatar_url,
    c.is_anonymous,
    COUNT(cr.id) as reaction_count
  FROM comments c
  LEFT JOIN comment_reactions cr ON cr.comment_id = c.id
  LEFT JOIN profiles p ON p.id = c.author_id
  WHERE c.post_id = p_post_id
  GROUP BY c.id, p.username, p.avatar_url
  ORDER BY reaction_count DESC, c.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
