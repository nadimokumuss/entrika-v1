-- Supabase Realtime Replication Setup
-- Bu SQL dosyasını Supabase SQL Editor'da çalıştırın

-- Posts tablosu için realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Post reactions tablosu için realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;

-- Comments tablosu için realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Notifications tablosu için realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Realtime replication'ı kontrol etmek için
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
