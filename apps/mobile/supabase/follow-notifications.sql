-- Follow Notifications Trigger
-- Creates a notification when someone follows you

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Don't notify if following yourself
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  SELECT username INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.following_id,
    'follow',
    'Yeni Takipçi',
    COALESCE(follower_name, 'Birisi') || ' seni takip etti',
    jsonb_build_object(
      'sender_id', NEW.follower_id,
      'username', COALESCE(follower_name, '')
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_insert ON follows;

CREATE TRIGGER on_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_on_follow();
