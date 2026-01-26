-- Entrika Database Schema
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('female', 'male')) NOT NULL,
  reputation_score DECIMAL(3,1) DEFAULT 5.0,
  invite_quota INTEGER DEFAULT 3,
  invited_by UUID REFERENCES public.profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invite Codes Table
CREATE TABLE public.invite_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  used_by UUID REFERENCES public.profiles(id),
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Posts Table
CREATE TABLE public.posts (
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
CREATE TABLE public.post_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('alev', 'yanindayim', 'yilan', 'sok', 'helal')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comments Table
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shadow Profiles Table (kişi hakkında topluluk değerlendirmeleri)
CREATE TABLE public.shadow_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_name TEXT NOT NULL,
  identifier_hash TEXT NOT NULL, -- Hashed phone/instagram for privacy
  city TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shadow Profile Reviews
CREATE TABLE public.shadow_reviews (
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
CREATE TABLE public.dating_profiles (
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
CREATE TABLE public.swipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  swiper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  swiped_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_like BOOLEAN NOT NULL, -- true = like, false = pass
  is_super_like BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

-- Matches Table
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Messages Table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports Table
CREATE TABLE public.reports (
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
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
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

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Invite Codes Policies
CREATE POLICY "Users can view their own invite codes" ON public.invite_codes
  FOR SELECT USING (auth.uid() = created_by OR is_used = false);

CREATE POLICY "Users can create invite codes" ON public.invite_codes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can use unused invite codes" ON public.invite_codes
  FOR UPDATE USING (is_used = false);

-- Posts Policies
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Dating Profiles Policies
CREATE POLICY "Active dating profiles are viewable" ON public.dating_profiles
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own dating profile" ON public.dating_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dating profile" ON public.dating_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Swipes Policies
CREATE POLICY "Users can view own swipes" ON public.swipes
  FOR SELECT USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create swipes" ON public.swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Matches Policies
CREATE POLICY "Users can view own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages Policies
CREATE POLICY "Users can view messages in their matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = messages.match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function to check and create match when both users like each other
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if this is a like (not a pass)
  IF NEW.is_like = true THEN
    -- Check if the other person has also liked
    IF EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.swiped_id
      AND swiped_id = NEW.swiper_id
      AND is_like = true
    ) THEN
      -- Create match (ensure user1_id < user2_id to avoid duplicates)
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATEST(NEW.swiper_id, NEW.swiped_id)
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic match creation
CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_match();

-- Function to update shadow profile average score
CREATE OR REPLACE FUNCTION update_shadow_profile_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shadow_profiles
  SET updated_at = NOW()
  WHERE id = NEW.shadow_profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating shadow profile on new review
CREATE TRIGGER on_review_update_shadow
  AFTER INSERT OR UPDATE ON public.shadow_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_shadow_profile_score();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_dating_profiles_updated_at
  BEFORE UPDATE ON public.dating_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Initial Data: System Invite Codes
-- ============================================

-- These are initial invite codes for testing
-- In production, remove these or generate new ones
INSERT INTO public.invite_codes (code, created_by)
SELECT code, '00000000-0000-0000-0000-000000000000'::uuid
FROM (VALUES
  ('ENTRIKA2024'),
  ('HOSGELDIN'),
  ('DAVET123'),
  ('BETA2024'),
  ('TOPLULUK')
) AS codes(code)
ON CONFLICT DO NOTHING;

-- Note: The system user UUID above is a placeholder
-- You may need to create a system/admin user first or adjust this

-- ============================================
-- Views for common queries
-- ============================================

-- View for shadow profiles with average scores
CREATE OR REPLACE VIEW public.shadow_profiles_with_scores AS
SELECT
  sp.*,
  COALESCE(AVG(sr.score), 0) as avg_score,
  COUNT(sr.id) as total_reviews,
  ARRAY_AGG(DISTINCT unnest(sr.tags)) FILTER (WHERE sr.tags IS NOT NULL) as all_tags
FROM public.shadow_profiles sp
LEFT JOIN public.shadow_reviews sr ON sp.id = sr.shadow_profile_id
GROUP BY sp.id;

-- View for posts with reaction counts
CREATE OR REPLACE VIEW public.posts_with_reactions AS
SELECT
  p.*,
  pr.username as author_username,
  pr.avatar_url as author_avatar,
  COALESCE(
    jsonb_agg(
      jsonb_build_object('type', r.reaction_type, 'count', r.count)
    ) FILTER (WHERE r.reaction_type IS NOT NULL),
    '[]'::jsonb
  ) as reactions,
  COALESCE(comment_counts.count, 0) as comment_count
FROM public.posts p
LEFT JOIN public.profiles pr ON p.author_id = pr.id
LEFT JOIN (
  SELECT post_id, reaction_type, COUNT(*) as count
  FROM public.post_reactions
  GROUP BY post_id, reaction_type
) r ON p.id = r.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM public.comments
  GROUP BY post_id
) comment_counts ON p.id = comment_counts.post_id
GROUP BY p.id, pr.username, pr.avatar_url, comment_counts.count;
