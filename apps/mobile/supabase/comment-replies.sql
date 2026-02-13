-- Comment Replies: parent_id column + notification trigger
-- Run this in Supabase SQL Editor

-- 1. Add parent_id column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- 2. Notification trigger for comment replies
CREATE OR REPLACE FUNCTION notify_on_comment_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  parent_author_id UUID;
  replier_name TEXT;
  parent_post_id UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;

  SELECT author_id, post_id INTO parent_author_id, parent_post_id
  FROM comments WHERE id = NEW.parent_id;

  IF parent_author_id IS NULL OR parent_author_id = NEW.author_id THEN RETURN NEW; END IF;

  SELECT username INTO replier_name FROM profiles WHERE id = NEW.author_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    parent_author_id, 'comment_reply', 'Yeni Yanıt',
    CASE WHEN NEW.is_anonymous THEN 'Birisi' ELSE COALESCE(replier_name, 'Birisi') END || ' yorumuna yanıt verdi',
    jsonb_build_object('post_id', parent_post_id, 'comment_id', NEW.parent_id, 'reply_id', NEW.id, 'sender_id', NEW.author_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_reply_insert ON comments;
CREATE TRIGGER on_comment_reply_insert
AFTER INSERT ON comments
FOR EACH ROW
WHEN (NEW.parent_id IS NOT NULL)
EXECUTE FUNCTION notify_on_comment_reply();
