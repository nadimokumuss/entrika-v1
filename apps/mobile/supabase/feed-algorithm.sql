-- Feed Algorithm
-- Adds computed columns for post ranking

-- Add a computed column for trending score
-- This will be calculated on the fly for now
-- In production, you might want to materialize this

-- Function to calculate post score for ranking
CREATE OR REPLACE FUNCTION calculate_post_score(
  p_post_id UUID,
  p_time_weight NUMERIC DEFAULT 0.4,
  p_reaction_weight NUMERIC DEFAULT 0.6
)
RETURNS NUMERIC AS $$
DECLARE
  v_hours_since_post NUMERIC;
  v_time_decay NUMERIC;
  v_total_reactions INTEGER;
  v_reaction_score NUMERIC;
  v_final_score NUMERIC;
  v_post_created_at TIMESTAMPTZ;
BEGIN
  -- Get post created_at
  SELECT created_at INTO v_post_created_at
  FROM posts
  WHERE id = p_post_id;

  -- Calculate hours since post
  v_hours_since_post := EXTRACT(EPOCH FROM (NOW() - v_post_created_at)) / 3600;

  -- Time decay: 1 for new posts, 0 after 72 hours (3 days)
  v_time_decay := GREATEST(0, 1 - (v_hours_since_post / 72));

  -- Get total reaction count
  SELECT COUNT(*) INTO v_total_reactions
  FROM post_reactions
  WHERE post_id = p_post_id;

  -- Reaction score: logarithmic to prevent spam domination
  v_reaction_score := CASE
    WHEN v_total_reactions > 0 THEN LN(v_total_reactions + 1) / 5
    ELSE 0
  END;

  -- Final score
  v_final_score := (v_time_decay * p_time_weight) + (v_reaction_score * p_reaction_weight);

  RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;

-- View for trending posts (last 24 hours, high engagement)
CREATE OR REPLACE VIEW trending_posts AS
SELECT
  p.*,
  COUNT(pr.id) as reaction_count,
  COUNT(DISTINCT c.id) as comment_count,
  calculate_post_score(p.id, 0.3, 0.7) as trending_score
FROM posts p
LEFT JOIN post_reactions pr ON pr.post_id = p.id
LEFT JOIN comments c ON c.post_id = p.id
WHERE p.created_at > NOW() - INTERVAL '24 hours'
GROUP BY p.id
ORDER BY trending_score DESC;

-- Helper: Get posts with scores for a feed
CREATE OR REPLACE FUNCTION get_feed_posts(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  category TEXT,
  is_anonymous BOOLEAN,
  is_spoiler BOOLEAN,
  author_id UUID,
  created_at TIMESTAMPTZ,
  image_url TEXT,
  reaction_count BIGINT,
  comment_count BIGINT,
  feed_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.content,
    p.category,
    p.is_anonymous,
    p.is_spoiler,
    p.author_id,
    p.created_at,
    p.image_url,
    COUNT(DISTINCT pr.id) as reaction_count,
    COUNT(DISTINCT c.id) as comment_count,
    calculate_post_score(p.id) as feed_score
  FROM posts p
  LEFT JOIN post_reactions pr ON pr.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  WHERE p.created_at > NOW() - INTERVAL '30 days'
  GROUP BY p.id
  ORDER BY feed_score DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
