-- Bookmarks tablosu için SQL şema
-- Kullanıcıların postları kaydetmesi için

-- Bookmarks tablosu
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  -- Kullanıcı bir postu sadece bir kez kaydedebilir
  UNIQUE(user_id, post_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi bookmark'larını görebilir
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcı bookmark ekleyebilir
CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcı kendi bookmark'ını silebilir
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Bookmark sayısı için helper fonksiyon
CREATE OR REPLACE FUNCTION get_post_bookmark_count(p_post_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*) FROM bookmarks WHERE post_id = p_post_id
$$ LANGUAGE SQL STABLE;

-- Kullanıcının bir postu bookmark edip etmediğini kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION is_post_bookmarked(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookmarks
    WHERE user_id = p_user_id AND post_id = p_post_id
  )
$$ LANGUAGE SQL STABLE;
