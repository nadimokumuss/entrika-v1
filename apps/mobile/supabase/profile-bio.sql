-- profiles tablosuna bio alanı ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Mevcut kayıtlar için varsayılan boş değer
UPDATE profiles SET bio = NULL WHERE bio IS NULL;
