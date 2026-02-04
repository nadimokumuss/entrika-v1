-- Entrika Premium Schema
-- Bu SQL dosyasını Supabase SQL Editor'da çalıştırın

-- Kullanıcı abonelikleri tablosu
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('premium', 'gold')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id)
);

-- Kullanıcı günlük limitleri tablosu (premium kullanıcılar için)
CREATE TABLE IF NOT EXISTS user_daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  likes_used INTEGER DEFAULT 0,
  super_likes_used INTEGER DEFAULT 0,
  rewinds_used INTEGER DEFAULT 0,
  boosts_used INTEGER DEFAULT 0,
  who_liked_views_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_daily_limits_user_id_date_unique UNIQUE (user_id, date)
);

-- Boost kayıtları tablosu
CREATE TABLE IF NOT EXISTS user_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  boosted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profil görüntüleme kayıtları tablosu (kim kimin profilini görmüş)
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMSETAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profile_views_viewer_viewed_unique UNIQUE (viewer_id, viewed_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_daily_limits_user_id_date ON user_daily_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_boosts_user_id ON user_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_boosts_expires_at ON user_boosts(expires_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_id ON profile_views(viewed_id);

-- RLS (Row Level Security) politikaları
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- user_subscriptions RLS
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- user_daily_limits RLS
CREATE POLICY "Users can view own limits"
  ON user_daily_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own limits"
  ON user_daily_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own limits"
  ON user_daily_limits FOR UPDATE
  USING (auth.uid() = user_id);

-- user_boosts RLS
CREATE POLICY "Users can view own boosts"
  ON user_boosts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boosts"
  ON user_boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- profile_views RLS
CREATE POLICY "Users can view views of own profile"
  ON profile_views FOR SELECT
  USING (auth.uid() = viewed_id);

CREATE POLICY "Users can insert profile views"
  ON profile_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Updated_at trigger'ları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_limits_updated_at
  BEFORE UPDATE ON user_daily_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
