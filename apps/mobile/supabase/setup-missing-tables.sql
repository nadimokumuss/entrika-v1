-- ============================================
-- Entrika: Eksik Tablolari Olusturma
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da calistirin
-- Onkosul: profiles ve invite_codes tablolari zaten mevcut olmali
--
-- Bu script asagidaki 10 tabloyu olusturur:
--   posts, post_reactions, comments,
--   shadow_profiles, shadow_reviews,
--   dating_profiles, swipes, matches, messages, reports

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('itiraf', 'ifsa', 'red_flag', 'yilanlik', 'dolandiricilik', 'tavsiye')) NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  is_spoiler BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Reactions Table
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('alev', 'yanindayim', 'yilan', 'sok', 'helal')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shadow Profiles Table
CREATE TABLE IF NOT EXISTS public.shadow_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_name TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  city TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shadow Profile Reviews
CREATE TABLE IF NOT EXISTS public.shadow_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shadow_profile_id UUID REFERENCES public.shadow_profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 10) NOT NULL,
  content TEXT,
  tags TEXT[],
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shadow_profile_id, reviewer_id)
);

-- Dating Profiles Table
CREATE TABLE IF NOT EXISTS public.dating_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio TEXT,
  photos TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  job TEXT,
  education TEXT,
  city TEXT,
  age INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  looking_for TEXT CHECK (looking_for IN ('female', 'male', 'both')) DEFAULT 'both',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swipes/Likes Table
CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  swiper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  swiped_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_like BOOLEAN NOT NULL,
  is_super_like BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

-- Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reported_shadow_profile_id UUID REFERENCES public.shadow_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Posts Policies
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Post Reactions Policies
CREATE POLICY "reactions_select" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Shadow Profiles Policies
CREATE POLICY "shadow_profiles_select" ON public.shadow_profiles FOR SELECT USING (true);
CREATE POLICY "shadow_profiles_insert" ON public.shadow_profiles FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Shadow Reviews Policies
CREATE POLICY "shadow_reviews_select" ON public.shadow_reviews FOR SELECT USING (true);
CREATE POLICY "shadow_reviews_insert" ON public.shadow_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Dating Profiles Policies
CREATE POLICY "dating_profiles_select" ON public.dating_profiles FOR SELECT USING (is_active = true OR auth.uid() = user_id);
CREATE POLICY "dating_profiles_insert" ON public.dating_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dating_profiles_update" ON public.dating_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Swipes Policies
CREATE POLICY "swipes_select" ON public.swipes FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "swipes_insert" ON public.swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Matches Policies
CREATE POLICY "matches_select" ON public.matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages Policies
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.matches WHERE id = messages.match_id AND (user1_id = auth.uid() OR user2_id = auth.uid()))
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.matches WHERE id = match_id AND (user1_id = auth.uid() OR user2_id = auth.uid()))
);

-- Reports Policies
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto match creation on mutual like
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_like = true THEN
    IF EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.swiped_id AND swiped_id = NEW.swiper_id AND is_like = true
    ) THEN
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (LEAST(NEW.swiper_id, NEW.swiped_id), GREATEST(NEW.swiper_id, NEW.swiped_id))
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_swipe_check_match ON public.swipes;
CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION check_and_create_match();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shadow_profiles_updated_at BEFORE UPDATE ON public.shadow_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_dating_profiles_updated_at BEFORE UPDATE ON public.dating_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HANDLE NEW USER TRIGGER (Profil otomatik olusturma)
-- ============================================

-- profiles_insert policy'sini guncelle (trigger'in calisabilmesi icin)
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- invite_codes_insert policy'sini guncelle
DROP POLICY IF EXISTS "invite_codes_insert" ON public.invite_codes;
CREATE POLICY "invite_codes_insert" ON public.invite_codes
  FOR INSERT WITH CHECK (true);

-- Yeni kullanici kaydolunca otomatik profil olustur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_invite_code TEXT;
BEGIN
  -- Benzersiz invite code olustur
  new_invite_code := '';
  FOR i IN 1..8 LOOP
    new_invite_code := new_invite_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::int, 1);
  END LOOP;

  -- Profil olustur (metadata veya default degerlerle)
  INSERT INTO public.profiles (
    id, username, avatar_url, gender,
    reputation_score, invite_quota, invited_by, invite_code, is_verified
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/lorelei/png?seed=' || NEW.id),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'female'),
    5.0,
    3,
    (NEW.raw_user_meta_data->>'invited_by')::UUID,
    new_invite_code,
    FALSE
  );

  -- Kullaniciya 3 davet kodu olustur
  FOR i IN 1..3 LOOP
    new_invite_code := '';
    FOR j IN 1..8 LOOP
      new_invite_code := new_invite_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::int, 1);
    END LOOP;

    INSERT INTO public.invite_codes (code, created_by, is_used)
    VALUES (new_invite_code, NEW.id, FALSE);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TEST DAVETIYE KODLARI
-- ============================================

INSERT INTO public.invite_codes (code, created_by, is_used) VALUES
  ('BETA2024', NULL, false),
  ('TOPLULUK', NULL, false)
ON CONFLICT (code) DO NOTHING;
