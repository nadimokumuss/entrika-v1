-- Comment Notifications Trigger
-- Creates a notification when someone comments on your post

-- First, ensure the notifications table exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

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
    INSERT INTO notifications (receiver_id, sender_id, type, data)
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

-- Grant permissions
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;
