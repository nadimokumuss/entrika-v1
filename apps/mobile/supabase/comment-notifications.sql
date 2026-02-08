-- Comment Notifications Trigger
-- Creates a notification when someone comments on your post
-- notifications tablosu: user_id, type, title, body, data

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
BEGIN
  SELECT author_id INTO post_author_id
  FROM posts
  WHERE id = NEW.post_id;

  IF post_author_id IS NOT NULL AND post_author_id != NEW.author_id THEN
    SELECT username INTO commenter_name
    FROM profiles
    WHERE id = NEW.author_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      post_author_id,
      'comment',
      'Yeni Yorum',
      CASE WHEN NEW.is_anonymous THEN 'Birisi' ELSE COALESCE(commenter_name, 'Birisi') END || ' paylaşımına yorum yaptı',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'sender_id', NEW.author_id,
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
