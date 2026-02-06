-- Review Notifications Trigger
-- Creates a notification when someone reviews your profile
-- Mevcut notifications tablosuna uyumlu sürüm

-- Function to create notification on new review
CREATE OR REPLACE FUNCTION notify_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Don't notify if the reviewer is reviewing themselves
  IF NEW.target_user_id != NEW.reviewer_id THEN
    INSERT INTO notifications (recipient_id, sender_id, type, metadata)
    VALUES (
      NEW.target_user_id,
      NEW.reviewer_id,
      'review',
      jsonb_build_object(
        'review_id', NEW.id,
        'score', NEW.score,
        'tags', NEW.tags,
        'is_anonymous', NEW.is_anonymous
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_review_insert ON user_reviews;

-- Create trigger
CREATE TRIGGER on_review_insert
AFTER INSERT ON user_reviews
FOR EACH ROW
EXECUTE FUNCTION notify_on_review();
