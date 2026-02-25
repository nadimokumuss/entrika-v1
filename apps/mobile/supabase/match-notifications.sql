-- Match Notifications Trigger
-- Creates notifications for both users when a match is created

CREATE OR REPLACE FUNCTION notify_on_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify user1
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.user1_id,
    'match',
    'Yeni Eşleşme!',
    'Yeni bir eşleşmen var!',
    jsonb_build_object('match_id', NEW.id)
  );

  -- Notify user2
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.user2_id,
    'match',
    'Yeni Eşleşme!',
    'Yeni bir eşleşmen var!',
    jsonb_build_object('match_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_insert ON matches;

CREATE TRIGGER on_match_insert
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION notify_on_match();
