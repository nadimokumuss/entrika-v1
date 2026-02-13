-- Reaction Notifications Trigger
-- Creates a notification when someone reacts to your post

CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_author_id UUID;
  reactor_name TEXT;
BEGIN
  SELECT author_id INTO post_author_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Don't notify if reacting to own post
  IF post_author_id IS NULL OR post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT username INTO reactor_name
  FROM profiles
  WHERE id = NEW.user_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_author_id,
    'reaction',
    'Yeni Tepki',
    COALESCE(reactor_name, 'Birisi') || ' paylaşımına tepki verdi',
    jsonb_build_object(
      'post_id', NEW.post_id,
      'sender_id', NEW.user_id,
      'reaction', NEW.reaction
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reaction_insert ON post_reactions;

CREATE TRIGGER on_reaction_insert
AFTER INSERT ON post_reactions
FOR EACH ROW
EXECUTE FUNCTION notify_on_reaction();
