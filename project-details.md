# Entrika - Project Details

> Son güncelleme: 2026-02-04
> Versiyon: 0.1.0 (MVP Development)

---

## Proje Vizyonu

**Entrika** - "Tanışmadan Önce Tanı"

Türkiye'nin ilk topluluk tabanlı dating ve sosyal istihbarat uygulaması. Kullanıcılar, tanışmadan önce karşı taraf hakkında topluluk değerlendirmelerini görebilir, deneyimlerini anonim olarak paylaşabilir ve güvenli bir şekilde eşleşebilir.

### Problem
- Dating uygulamalarında karşılaşılan kişiler hakkında önceden bilgi edinme imkanı yok
- Kötü deneyimler (aldatma, dolandırıcılık, manipülasyon) yaşandıktan sonra öğreniliyor
- Kadınlar ve erkekler için güvenlik endişeleri

### Çözüm
- Topluluk puanı sistemi (1-10 arası)
- Anonim deneyim paylaşımı
- Eşleşmeden önce karşı tarafın "sicilini" görme
- Herkese açık kayıt sistemi

---

## Özellikler Detayı

### 1. Kayıt Sistemi
- Herkese açık kayıt (davetiye sistemi kaldırıldı)
- Cinsiyet seçimi (Kadın/Erkek)
- Cinsiyete göre avatar seçenekleri
  - Kadın: Lorelei avatar stili
  - Erkek: Avataaars stili
- Email + username + şifre

### 3. Feed (Akış)
**Kategoriler:**
| Kategori | Emoji | Açıklama |
|----------|-------|----------|
| İtiraf | 🔥 | Kişisel itiraflar |
| İfşa | ⚠️ | Kişi ifşaları (hassas içerik) |
| Red Flag | 🚩 | Uyarı işaretleri |
| Yılanlık | 🐍 | İhanet/arkadan vurma hikayeleri |
| Dolandırıcılık | 💸 | Dolandırıcı uyarıları |
| Tavsiye | 💅 | Genel tavsiyeler |

**Özellikler:**
- Anonim veya isimli paylaşım seçeneği
- Spoiler/hassas içerik filtresi (ifşa, red flag, dolandırıcılık için otomatik)
- Reaksiyon sistemi: 🔥 Olay, 🫂 Yanındayım, 🐍 Yılan, 😱 Şok, 👏 Helal
- Yorum sistemi

### 4. Match (Eşleşme)
**Tinder benzeri swipe sistemi AMA:**
- Her kartta topluluk puanı görünür
- Düşük puanlı profillerde (<4) uyarı işareti
- Pozitif/negatif etiketler görünür
- Fotoğraf galerisi (birden fazla fotoğraf)
- Bio, ilgi alanları, meslek, eğitim bilgileri

**Aksiyonlar:**
- ❌ Pass (sola kaydır)
- ⭐ Super Like (yukarı)
- ❤️ Like (sağa kaydır)

**Eşleşme:**
- İki taraf da like verdiğinde eşleşme oluşur
- Eşleşme sonrası mesajlaşma açılır

### 5. Explore (Keşfet)
- Shadow profil arama (isim, şehir, etiket)
- Topluluk değerlendirmesi görme
- Puan ortalaması ve değerlendirme sayısı
- Negatif etiketler: Aldatıcı, Yalancı, Ghosting, Manipülatif, vb.

### 6. Profile (Profil)
- Avatar ve kullanıcı adı
- İtibar puanı (diğer kullanıcıların verdiği)
- İstatistikler: Paylaşım sayısı, değerlendirme sayısı
- Kendi paylaşımları
- Değerlendirmeler sekmesi

---

## Veritabanı Şeması

### Tablolar

#### profiles
- id (UUID, PK)
- username (TEXT, UNIQUE)
- avatar_url (TEXT)
- gender (TEXT: 'female' | 'male')
- reputation_score (DECIMAL, default 5.0)
- is_verified (BOOLEAN)
- created_at, updated_at

#### posts
- id, content, category, is_anonymous, is_spoiler, image_url, author_id, created_at

#### post_reactions
- id, post_id, user_id, reaction_type

#### comments
- id, post_id, author_id, content, is_anonymous

#### shadow_profiles
- id, target_name, identifier_hash, city, created_by

#### shadow_reviews
- id, shadow_profile_id, reviewer_id, score (1-10), content, tags[], is_anonymous

#### dating_profiles
- id, user_id, bio, photos[], interests[], job, education, city, age, is_active, looking_for

#### swipes
- id, swiper_id, swiped_id, is_like, is_super_like

#### matches
- id, user1_id, user2_id, created_at

#### messages
- id, match_id, sender_id, content, is_read

#### notifications
- id (UUID, PK), user_id (FK auth.users), type, title, body, data (JSONB), is_read, created_at
- RLS: kullanicilar kendi bildirimlerini okuyup guncelleyebilir
- Partial index: okunmamis bildirimler icin hizli sorgu

#### user_reviews
- id, target_user_id (FK profiles), reviewer_id (FK profiles), score (1-10), content, tags[], is_anonymous
- UNIQUE(target_user_id, reviewer_id)
- RLS: herkes okuyabilir, sadece reviewer insert/update yapabilir

#### reports
- id, reporter_id, reported_user_id, reported_post_id, reason, status

---

## Geliştirme Geçmişi

### 2026-01-26 - İlk Versiyon
- Proje oluşturuldu (Expo SDK 53)
- Temel ekranlar tamamlandı
- Light mode tema uygulandı
- Supabase entegrasyonu hazırlandı (mock modda)
- Cinsiyet seçimi ve avatar sistemi eklendi
- GitHub'a ilk push yapıldı

### 2026-01-28 - Supabase Aktivasyonu
- Tum 5 ekran Supabase'e baglanildi (Feed, New Post, Explore, Profile, Match)
- 10 eksik tablo icin SQL olusturuldu ve Supabase'de calistirildi
- Mock data kaldirildi, constants/categories.ts'e tasindi
- Auth akisi duzeltildi (e-posta dogrulama kapatildi, session yonetimi)
- Profil sayfasina cikis yap butonu eklendi
- useFocusEffect ile tab gecislerinde otomatik veri yenileme eklendi
- signUp fonksiyonuna detayli hata loglama eklendi
- Test edildi: kayit, giris, post olusturma, profil goruntuleme calisiyor

### 2026-01-30 - Mesajlasma + Dating Profil + Kullanici Degerlendirme
- Mesajlasma sistemi eklendi (conversations.tsx, chat/[matchId].tsx, MessageBubble, lib/messaging.ts)
- Dating profil duzenleme ekrani eklendi (edit-dating-profile.tsx)
- Match ekrani guncellendi (app/(tabs)/match.tsx)
- Kullanici degerlendirme sistemi eklendi:
  - user_reviews tablosu (supabase/user-reviews.sql)
  - UserReview interface (lib/supabase.ts)
  - Degerlendirme formu (app/review-user.tsx) - 1-10 puan, etiketler, yorum, anonim toggle
  - Chat header'a yildiz butonu ile degerlendirme erisimi
  - Profil'e "Degerlendirmeler" sekmesi - alinan yorumlari gosterir

### 2026-02-02 - Bildirim Ekrani
- `notifications` tablosu olusturuldu (supabase/notifications.sql)
  - UUID PK, user_id, type, title, body, data (JSONB), is_read, created_at
  - Partial index (okunmamis bildirimler icin)
  - RLS: kullanicilar kendi bildirimlerini okuyup guncelleyebilir
- Edge function (send-push-notification) guncellendi:
  - Her bildirimde `notifications` tablosuna INSERT eklendi
  - Match icin iki kullaniciya ayri kayit (sendToRecipient icinde de INSERT)
- `app/notifications.tsx` ekrani eklendi:
  - Bildirim listesi (FlatList, pull-to-refresh)
  - Tip bazli ikon/renk (message, match, reaction, comment, review)
  - Okunmamis kartlar highlight ile gosterilir
  - Tiklaninca ilgili sayfaya yonlendirme + okundu isaretleme
  - "Tumu okundu" butonu
  - Bos state (Bell ikonu + aciklama)
- `app/_layout.tsx` guncellendi: notifications route eklendi (slide_from_right)
- `app/(tabs)/index.tsx` guncellendi:
  - Feed header'a Bell ikonu eklendi
  - Okunmamis bildirim sayisi badge (9+ gosterimi)
  - useFocusEffect ile her tab'a donuste unread count guncellenir

### 2026-02-04 - Web Deploy (Vercel)
- Web'e deploy icin Platform kontrolleri eklendi:
  - **Haptics**: 7 dosyada `Platform.OS !== 'web'` check (GradientButton, GradientTabBar, AnimatedPressable, index, post-detail, match, chat)
  - **Notifications**: `lib/notifications.ts` ve `hooks/usePushNotifications.ts` - web'de atlanir
  - **SecureStore**: `lib/supabase.ts` - conditional require, web'de localStorage
  - **ImagePicker**: `lib/storage.ts` - web'de izin isteme atlanir
  - **SplashScreen**: `app/_layout.tsx` - web'de preventAutoHide/hideAsync atlanir
- SSR hydration fix: `_layout.tsx`'te `isClient` state pattern ile hydration mismatch onlendi
- Vercel yapilandirmasi:
  - `vercel.json`: `rewrites` (routes degil!) + buildCommand ile `.env` olusturma
  - `package.json`: `build:web` script (`expo export --platform web --clear`)
  - Vercel env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (production scope)
- Template dosyasi `app/(tabs)/two.tsx` silindi, tab layout'tan referansi kaldirildi
- Onemli bug fix: `vercel.json`'da `routes` yerine `rewrites` - routes tum istekleri (JS bundle dahil) index.html'e yonlendiriyordu
- Davetiye kodu dogrulama'ya console logging eklendi (debug icin)
- Site canli: https://entrika.vercel.app

### 2026-02-04 - Davetiye Sistemi Kaldirma + Turkce Karakter Duzeltmeleri
- **Davetiye sistemi tamamen kaldirildi:**
  - Gatekeeper ekrani karsilama ekranina donusturuldu (Hesap Olustur / Giris Yap)
  - `app/(auth)/index.tsx` - WelcomeScreen olarak yeniden yazildi
  - `app/(auth)/register.tsx` - inviteCode state, AsyncStorage, uyari kutusu kaldirildi
  - `contexts/AuthContext.tsx` - validateInviteCode, generateInviteCode, signUp'tan invite dogrulama kaldirildi
  - `app/(tabs)/profile.tsx` - Davetiye/Referans istatistikleri ve referanslar sekmesi kaldirildi
  - `app/settings.tsx` - Davetiye bolumu tamamen kaldirildi
  - `lib/supabase.ts` - InviteCode interface'i ve Profile'dan invite alanlari kaldirildi
- **Turkce karakter duzeltmeleri (21+ dosya, ~150+ duzeltme):**
  - Tum UI metinlerinde ö, ü, ş, ç, ğ, ı, İ, Ş, Ç karakterleri duzeltildi
  - Kategori etiketleri (Itiraf→İtiraf, Ifsa→İfşa, Yilanlik→Yılanlık, Dolandiricilik→Dolandırıcılık)
  - Reaksiyon etiketleri (Yanindayim→Yanındayım, Yilan→Yılan, Sok→Şok)
  - Degerlendirme etiketleri (Guvenilir→Güvenilir, Durst→Dürüst, Saygili→Saygılı, vb.)
  - Auth ekranlari, profil, ayarlar, chat, explore, match, bildirimler, raporlama tum ekranlar duzeltildi
- **Not:** Veritabaninda eski etiket degerleriyle kaydedilmis degerlendirmeler varsa migration gerekebilir

### Sonraki Oturum Icin Notlar
- Profil duzenleme (username, bio, avatar degistirme)
- Post silme / duzenleme
- Feed'de realtime guncellemeler
- Gelismis filtreleme (match'te yas, lokasyon)
- Premium ozellikler
- Web'de UI iyilestirmeleri (responsive tasarim, web-specific stiller)
- Veritabanindaki eski etiket degerlerini (Guvenilir, Durst vb.) yeni Turkce karakterli hallerine migrate etme

---

## API Endpoints (Supabase RPC/Functions)

### Auth
- `signUp(email, password, username, gender, avatar)`
- `signIn(email, password)`
- `signOut()`

### Posts
- `getPosts(category?, limit, offset)`
- `createPost(content, category, isAnonymous, isSpoiler, imageUrl?)`
- `addReaction(postId, reactionType)`
- `removeReaction(postId)`

### Dating
- `getDatingProfiles(filters)`
- `swipe(targetUserId, isLike, isSuperLike)`
- `getMatches()`
- `sendMessage(matchId, content)`
- `getMessages(matchId)`

### Shadow Profiles
- `searchShadowProfiles(query, city?)`
- `createShadowProfile(targetName, identifier, city)`
- `addReview(shadowProfileId, score, content, tags)`

---

## Güvenlik Notları

1. **RLS (Row Level Security)** aktif - kullanıcılar sadece kendi verilerine erişebilir
2. **Identifier hash** - telefon/instagram bilgileri hashlenip saklanır
3. **Anonim paylaşımlar** - author bilgisi frontend'de gizlenir ama veritabanında var (moderasyon için)
4. **Rate limiting** - spam önleme (Supabase Edge Functions ile)

---

## Performans Notları

- Lazy loading için pagination kullan
- Resimler için CDN (Supabase Storage)
- Match algoritması için edge function
- Realtime mesajlaşma için Supabase Realtime

---

## Bilinen Sorunlar

1. ~~NativeWind Node.js 24 ile çalışmıyor~~ → StyleSheet'e geçildi
2. Port 8081 bazen meşgul → 8082 kullan
3. Expo Go'da bazı native modüller çalışmayabilir → Development build gerekebilir

---

## Kaynaklar

- [Expo Docs](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Lucide Icons](https://lucide.dev/icons)
- [DiceBear Avatars](https://dicebear.com)
