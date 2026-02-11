-- Entrika Notification Preferences Schema
-- Bu SQL dosyasını Supabase SQL Editor'da çalıştırın

-- Bildirim tercihleri tablosu
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Push notification preferences
  push_likes BOOLEAN DEFAULT true,
  push_matches BOOLEAN DEFAULT true,
  push_messages BOOLEAN DEFAULT true,
  push_super_likes BOOLEAN DEFAULT true,
  push_comments BOOLEAN DEFAULT true,
  push_profile_views BOOLEAN DEFAULT false,

  -- In-app notification preferences
  inapp_likes BOOLEAN DEFAULT true,
  inapp_matches BOOLEAN DEFAULT true,
  inapp_messages BOOLEAN DEFAULT true,
  inapp_super_likes BOOLEAN DEFAULT true,
  inapp_comments BOOLEAN DEFAULT true,
  inapp_profile_views BOOLEAN DEFAULT false,

  -- Email notification preferences
  email_likes BOOLEAN DEFAULT false,
  email_matches BOOLEAN DEFAULT true,
  email_messages BOOLEAN DEFAULT false,
  email_weekly_digest BOOLEAN DEFAULT true,

  -- General settings
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT NULL, -- Örn: 22:00
  quiet_hours_end TIME DEFAULT NULL,   -- Örn: 09:00
  quiet_hours_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_notification_preferences_user_id_unique UNIQUE (user_id)
);

-- Bildirim geçmişi tablosu (daha detaylı)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT NOT NULL CHECK (type IN (
  'like', 'match', 'message', 'super_like', 'comment',
  'profile_view', 'follow', 'mention', 'system'
));

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Bildirim meta data (JSONB)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_is_read ON notifications(recipient_id, is_read);

-- RLS (Row Level Security)
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger: Yeni kullanıcı için varsayılan bildirim tercihleri oluştur
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Trigger: Bildirim okunduğunda read_at güncelle
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND (OLD.is_read = false OR OLD.is_read IS NULL) THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  WHEN (NEW.is_read != OLD.is_read)
  EXECUTE FUNCTION update_notification_read_at();

-- Function: Bildirim tercihlerini getir
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  pref JSON;
BEGIN
  SELECT row_to_json(user_notification_preferences) INTO pref
  FROM user_notification_preferences
  WHERE user_id = p_user_id;

  RETURN pref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Okunmamış bildirim sayısını getir (type'a göre filtreleme ile)
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID, p_type TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  IF p_type IS NULL THEN
    SELECT COUNT(*) INTO count
    FROM notifications
    WHERE recipient_id = p_user_id AND is_read = false;
  ELSE
    SELECT COUNT(*) INTO count
    FROM notifications
    WHERE recipient_id = p_user_id AND is_read = false AND type = p_type;
  END IF;

  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
