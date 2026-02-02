-- =============================================
-- Entrika Storage Bucket'lari Kurulumu
-- Supabase Dashboard > SQL Editor'de calistirilmali
-- =============================================

-- 1. Bucket'lari olustur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('dating-photos', 'dating-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('post-images', 'post-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS Politikalari

-- Herkes public bucket'lardan okuyabilir
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars', 'dating-photos', 'post-images'));

-- Kullanici kendi klasorune yukleyebilir (userId/ prefix)
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('avatars', 'dating-photos', 'post-images')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanici kendi klasorundeki dosyalari guncelleyebilir
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('avatars', 'dating-photos', 'post-images')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanici kendi klasorundeki dosyalari silebilir
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('avatars', 'dating-photos', 'post-images')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
