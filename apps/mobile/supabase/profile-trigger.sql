-- Entrika Profile Trigger
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın
-- Bu trigger, yeni kullanıcı kaydolduğunda otomatik profil oluşturur

-- Mevcut profiles_insert policy'yi kaldır ve yenisini oluştur
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

-- Service role veya trigger ile profil oluşturulmasına izin ver
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Kullanıcı kaydolduğunda otomatik profil oluşturan fonksiyon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_invite_code TEXT;
  invite_data RECORD;
BEGIN
  -- Kullanıcı metadata'dan bilgileri al
  -- Eğer metadata yoksa default değerler kullan

  -- Benzersiz invite code oluştur
  new_invite_code := '';
  FOR i IN 1..8 LOOP
    new_invite_code := new_invite_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::int, 1);
  END LOOP;

  -- Profil oluştur (metadata'dan veya default değerlerle)
  INSERT INTO public.profiles (
    id,
    username,
    avatar_url,
    gender,
    reputation_score,
    invite_quota,
    invited_by,
    invite_code,
    is_verified
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

  -- Kullanıcıya 3 davet kodu oluştur
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

-- Trigger'ı auth.users tablosuna bağla
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- invite_codes tablosu için service role erişimi
DROP POLICY IF EXISTS "invite_codes_insert" ON public.invite_codes;
CREATE POLICY "invite_codes_insert" ON public.invite_codes
  FOR INSERT WITH CHECK (true);
