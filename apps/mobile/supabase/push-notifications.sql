-- Push Notifications: push_tokens tablosu
-- Supabase SQL Editor'de calistirin

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ayni kullanici + ayni token icin tekrar kayit olmasin
CREATE UNIQUE INDEX IF NOT EXISTS push_tokens_user_token_idx ON push_tokens(user_id, token);

-- Aktif tokenlari hizli bulmak icin index
CREATE INDEX IF NOT EXISTS push_tokens_active_idx ON push_tokens(user_id, is_active) WHERE is_active = true;

-- updated_at otomatik guncelleme trigger'i
CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_token_timestamp();

-- RLS (Row Level Security) aktif et
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Kullanici kendi tokenlarini gorebilir
CREATE POLICY "Users can view own tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanici kendi tokenini ekleyebilir
CREATE POLICY "Users can insert own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Kullanici kendi tokenlarini guncelleyebilir
CREATE POLICY "Users can update own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Kullanici kendi tokenlarini silebilir
CREATE POLICY "Users can delete own tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (Edge Functions) icin tam erisim
-- Not: Edge Function'lar service_role key kullanacagi icin RLS bypass eder
