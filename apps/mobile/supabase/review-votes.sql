-- Review Voting System
-- Users can vote on reviews to indicate if they were helpful or not

-- Add columns to user_reviews table
ALTER TABLE user_reviews
ADD COLUMN IF NOT EXISTS helpful_votes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vote_scores JSONB DEFAULT '{}';

-- vote_scores format: {"user_id": "helpful" | "not_helpful"}

-- Create index for votes
CREATE INDEX IF NOT EXISTS idx_user_reviews_helpful_votes ON user_reviews(helpful_votes DESC);

-- Function to vote on a review
CREATE OR REPLACE FUNCTION vote_on_review(
  review_id UUID,
  voter_id UUID,
  vote_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  review RECORD;
  current_votes JSONB;
  previous_vote TEXT;
  new_score INTEGER;
BEGIN
  -- Get the review
  SELECT * INTO review FROM user_reviews WHERE id = review_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Review not found');
  END IF;

  -- Check if voter is the review author (can't vote on own review)
  IF review.reviewer_id = voter_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot vote on own review');
  END IF;

  current_votes := review.vote_scores;
  previous_vote := current_votes -> voter_id;

  -- Calculate new score
  IF previous_vote = 'helpful' THEN
    new_score := review.helpful_votes - 1;
  ELSIF previous_vote = 'not_helpful' THEN
    -- no change to helpful_votes
    new_score := review.helpful_votes;
  ELSE
    new_score := review.helpful_votes;
  END IF;

  IF vote_type = 'helpful' THEN
    new_score := new_score + 1;
  END IF;

  -- Update the review
  UPDATE user_reviews
  SET
    helpful_votes = new_score,
    vote_scores = jsonb_set(
      COALESCE(current_votes, '{}'::jsonb),
      ARRAY[voter_id::TEXT],
      to_jsonb(vote_type)
    )
  WHERE id = review_id;

  RETURN jsonb_build_object(
    'success', true,
    'helpful_votes', new_score,
    'previous_vote', previous_vote
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION vote_on_review(UUID, UUID, TEXT) TO authenticated;
