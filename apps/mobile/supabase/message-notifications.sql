-- Message Notifications Trigger
-- Creates a notification when someone sends you a message

CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_name TEXT;
  other_user_id UUID;
  match_user1 UUID;
  match_user2 UUID;
BEGIN
  -- Get match users to determine recipient
  SELECT user1_id, user2_id INTO match_user1, match_user2
  FROM matches
  WHERE id = NEW.match_id;

  -- Determine recipient (the other user in the match)
  IF NEW.sender_id = match_user1 THEN
    other_user_id := match_user2;
  ELSE
    other_user_id := match_user1;
  END IF;

  IF other_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT username INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    other_user_id,
    'message',
    'Yeni Mesaj',
    COALESCE(sender_name, 'Birisi') || ' sana mesaj gönderdi',
    jsonb_build_object(
      'match_id', NEW.match_id,
      'sender_id', NEW.sender_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON messages;

CREATE TRIGGER on_message_insert
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_on_message();
