-- Push Notification Webhooks
-- pg_net extension ile Edge Function'a HTTP istegi gonderir

-- pg_net extension'i aktif et
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Genel webhook trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.notify_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ajwfgvfgdltgiuyxwhdg.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqd2ZndmZnZGx0Z2l1eXh3aGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTE4MzUsImV4cCI6MjA4NTAyNzgzNX0.87s7twSZ_TyAkJ4nH6O-UVTT_q_ZkdjnvUKFrpKQToM'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)::jsonb,
      'schema', TG_TABLE_SCHEMA
    )
  );
  RETURN NEW;
END;
$$;

-- messages tablosu icin trigger
DROP TRIGGER IF EXISTS on_message_insert_notify ON public.messages;
CREATE TRIGGER on_message_insert_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_notification();

-- matches tablosu icin trigger
DROP TRIGGER IF EXISTS on_match_insert_notify ON public.matches;
CREATE TRIGGER on_match_insert_notify
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_notification();

-- post_reactions tablosu icin trigger
DROP TRIGGER IF EXISTS on_reaction_insert_notify ON public.post_reactions;
CREATE TRIGGER on_reaction_insert_notify
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_notification();

-- comments tablosu icin trigger
DROP TRIGGER IF EXISTS on_comment_insert_notify ON public.comments;
CREATE TRIGGER on_comment_insert_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_notification();

-- user_reviews tablosu icin trigger
DROP TRIGGER IF EXISTS on_review_insert_notify ON public.user_reviews;
CREATE TRIGGER on_review_insert_notify
  AFTER INSERT ON public.user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_notification();
