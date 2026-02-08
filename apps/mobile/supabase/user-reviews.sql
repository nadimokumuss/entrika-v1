-- user_reviews tablosu: Kullanici degerlendirmeleri
-- Bu SQL'i Supabase SQL Editor'de calistirin.

CREATE TABLE user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES profiles(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(target_user_id, reviewer_id)
);

ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reviews_select" ON user_reviews FOR SELECT USING (true);
CREATE POLICY "user_reviews_insert" ON user_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "user_reviews_update" ON user_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
