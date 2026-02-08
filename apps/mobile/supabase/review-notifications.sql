-- Review Notifications Trigger
-- Creates a notification when someone reviews your profile
-- notifications tablosu: user_id, type, title, body, data

CREATE OR REPLACE FUNCTION notify_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reviewer_name TEXT;
BEGIN
  IF NEW.target_user_id != NEW.reviewer_id THEN
    SELECT username INTO reviewer_name
    FROM profiles
    WHERE id = NEW.reviewer_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.target_user_id,
      'review',
      'Yeni Değerlendirme',
      CASE WHEN NEW.is_anonymous THEN 'Birisi' ELSE COALESCE(reviewer_name, 'Birisi') END || ' seni değerlendirdi',
      jsonb_build_object(
        'review_id', NEW.id,
        'sender_id', NEW.reviewer_id,
        'score', NEW.score,
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
