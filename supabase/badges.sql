-- Badge System for Entrika
-- Users can earn badges based on their activity and community engagement

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  description TEXT,
  requirement JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table (junction table)
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Insert default badges
INSERT INTO badges (name, emoji, description, requirement) VALUES
  ('Güvenilir İfşacı', '🛡️', '10+ ifşa paylaşımı, %80+ olumlu oylama', '{"min_posts": 10, "category": "ifsa", "min_positive_ratio": 0.8}'),
  ('Dedikoducu', '💬', '50+ yorum yapmış', '{"min_comments": 50}'),
  ('Yıldız Değerlendirici', '⭐', '25+ değerlendirme yapmış', '{"min_reviews": 25}'),
  ('Ateşli', '🔥', '100+ toplam reaksiyon almış paylaşım', '{"min_total_reactions": 100}'),
  ('İlk Adım', '👣', 'İlk paylaşımını yapmış', '{"min_posts": 1}'),
  ('Popüler', '👑', '100+ takipçi veya yüksek etkileşim', '{"min_reputation": 8.0}'),
  ('Sadık Üye', '🎯', '30 gün üst üste giriş yapmış', '{"consecutive_days": 30}'),
  ('Yardımsever', '🤝', '10+ yardımsever oy almış değerlendirme', '{"min_helpful_votes": 10}'),
  ('Gazeteci', '📰', '5+ itiraf paylaşımı', '{"min_posts": 5, "category": "itiraf"}'),
  ('Dedektif', '🔍', '10+ red flag paylaşımı', '{"min_posts": 10, "category": "red_flag"}')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT SELECT ON badges TO authenticated;
GRANT SELECT ON user_badges TO authenticated;
GRANT INSERT ON user_badges TO authenticated;
GRANT DELETE ON user_badges TO authenticated;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id UUID)
RETURNS TABLE(id UUID, name TEXT, emoji TEXT, description TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  badge_record RECORD;
  should_award BOOLEAN;
  post_count INT;
  comment_count INT;
  review_count INT;
  total_reactions INT;
  reputation FLOAT;
  helpful_votes INT;
BEGIN
  -- Get user stats
  SELECT
    COUNT(DISTINCT p.id),
    (SELECT COUNT(*) FROM comments WHERE author_id = user_id),
    (SELECT COUNT(*) FROM user_reviews WHERE reviewer_id = user_id),
    (SELECT COALESCE(SUM(
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id)
      ), 0) FROM posts p WHERE author_id = user_id),
    p.reputation_score
  INTO post_count, comment_count, review_count, total_reactions, reputation
  FROM profiles p
  WHERE p.id = user_id;

  -- Check each badge
  FOR badge_record IN
    SELECT * FROM badges
  LOOP
    should_award := FALSE;

    -- Check if user already has this badge
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id AND badge_id = badge_record.id) THEN
      CONTINUE;
    END IF;

    -- Check badge requirements
    CASE badge_record.name
      WHEN 'İlk Adım' THEN
        IF post_count >= 1 THEN should_award := TRUE; END IF;

      WHEN 'Güvenilir İfşacı' THEN
        IF post_count >= 10 THEN
          SELECT COUNT(*) INTO post_count FROM posts WHERE author_id = user_id AND category = 'ifsa';
          IF post_count >= 10 THEN should_award := TRUE; END IF;
        END IF;

      WHEN 'Dedikoducu' THEN
        IF comment_count >= 50 THEN should_award := TRUE; END IF;

      WHEN 'Yıldız Değerlendirici' THEN
        IF review_count >= 25 THEN should_award := TRUE; END IF;

      WHEN 'Ateşli' THEN
        IF total_reactions >= 100 THEN should_award := TRUE; END IF;

      WHEN 'Popüler' THEN
        IF reputation >= 8.0 THEN should_award := TRUE; END IF;

      WHEN 'Gazeteci' THEN
        SELECT COUNT(*) INTO post_count FROM posts WHERE author_id = user_id AND category = 'itiraf';
        IF post_count >= 5 THEN should_award := TRUE; END IF;

      WHEN 'Dedektif' THEN
        SELECT COUNT(*) INTO post_count FROM posts WHERE author_id = user_id AND category = 'red_flag';
        IF post_count >= 10 THEN should_award := TRUE; END IF;

    END CASE;

    -- Award badge if requirements met
    IF should_award THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (user_id, badge_record.id);

      RETURN QUERY SELECT badge_record.id, badge_record.name, badge_record.emoji, badge_record.description;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- Function to automatically check badges after post
CREATE OR REPLACE FUNCTION award_badges_on_post()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.author_id);
  RETURN NEW;
END;
$$;

-- Create trigger for posts
DROP TRIGGER IF EXISTS on_badge_check_post ON posts;
CREATE TRIGGER on_badge_check_post
AFTER INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION award_badges_on_post();

-- Function to automatically check badges after comment
CREATE OR REPLACE FUNCTION award_badges_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.author_id);
  RETURN NEW;
END;
$$;

-- Create trigger for comments
DROP TRIGGER IF EXISTS on_badge_check_comment ON comments;
CREATE TRIGGER on_badge_check_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION award_badges_on_comment();

-- Function to automatically check badges after review
CREATE OR REPLACE FUNCTION award_badges_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.reviewer_id);
  RETURN NEW;
END;
$$;

-- Create trigger for reviews
DROP TRIGGER IF EXISTS on_badge_check_review ON user_reviews;
CREATE TRIGGER on_badge_check_review
AFTER INSERT ON user_reviews
FOR EACH ROW
EXECUTE FUNCTION award_badges_on_review();
