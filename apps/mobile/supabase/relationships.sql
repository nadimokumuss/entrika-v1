-- Relationship Status System
-- Allows users to set their relationship status and link to other users

-- Add relationship_status column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'single'
CHECK (relationship_status IN ('single', 'in_relationship', 'engaged', 'married', 'complicated'));

-- Create relationships table for linking users
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('dating', 'engaged_to', 'married_to', 'friend', 'work_colleague', 'school_friend')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, related_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related_user_id ON relationships(related_user_id);

-- Enable RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all relationships"
  ON relationships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own relationships"
  ON relationships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationships"
  ON relationships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationships"
  ON relationships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to get relationship info for a user
CREATE OR REPLACE FUNCTION get_relationship_info(p_user_id UUID)
RETURNS TABLE (
  relationship_type TEXT,
  related_user_id UUID,
  related_username TEXT,
  related_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.relationship_type,
    r.related_user_id,
    p.username,
    p.avatar_url
  FROM relationships r
  JOIN profiles p ON p.id = r.related_user_id
  WHERE r.user_id = p_user_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_relationships_updated_at();
