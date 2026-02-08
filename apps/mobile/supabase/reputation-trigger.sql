-- reputation_score otomatik guncelleme trigger'i
-- user_reviews tablosunda INSERT, UPDATE veya DELETE olunca
-- hedef kullanicinin reputation_score'unu yeniden hesaplar.
-- Bu SQL'i Supabase SQL Editor'de calistirin.

CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
  new_score DECIMAL(3,1);
BEGIN
  -- DELETE durumunda OLD, diger durumlarda NEW kullanilir
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.target_user_id;
  ELSE
    target_id := NEW.target_user_id;
  END IF;

  -- Ortalama puani hesapla
  SELECT ROUND(AVG(score)::numeric, 1)
  INTO new_score
  FROM user_reviews
  WHERE target_user_id = target_id;

  -- Review yoksa default 5.0 yap, varsa ortalama ile guncelle
  UPDATE profiles
  SET reputation_score = COALESCE(new_score, 5.0)
  WHERE id = target_id;

  -- UPDATE durumunda target_user_id degismis olabilir (eski hedefin skorunu da guncelle)
  IF TG_OP = 'UPDATE' AND OLD.target_user_id != NEW.target_user_id THEN
    SELECT ROUND(AVG(score)::numeric, 1)
    INTO new_score
    FROM user_reviews
    WHERE target_user_id = OLD.target_user_id;

    UPDATE profiles
    SET reputation_score = COALESCE(new_score, 5.0)
    WHERE id = OLD.target_user_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: INSERT, UPDATE, DELETE sonrasi calisir
CREATE TRIGGER on_review_update_reputation
  AFTER INSERT OR UPDATE OR DELETE ON user_reviews
  FOR EACH ROW EXECUTE FUNCTION update_reputation_score();
