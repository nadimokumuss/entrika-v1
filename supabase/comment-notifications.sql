-- Comment Notifications Trigger
-- Creates a notification when someone comments on your post
-- Mevcut notifications tablosuna uyumlu sürüm

-- Function to create notification on new comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get the post author's ID
  SELECT author_id INTO post_author_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Don't notify if the commenter is the post author (commenting on own post)
  IF post_author_id IS NOT NULL AND post_author_id != NEW.author_id THEN
    INSERT INTO notifications (recipient_id, sender_id, type, metadata)
    VALUES (
      post_author_id,
      NEW.author_id,
      'comment',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'content', LEFT(NEW.content, 100),
        'is_anonymous', NEW.is_anonymous
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_comment_insert ON comments;

-- Create trigger
CREATE TRIGGER on_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment();
