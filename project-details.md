# Entrika - Project Details

> Son güncelleme: 2026-02-07
> Versiyon: 0.2.0 (Beta)

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
- Takip sistemi - kullanıcıları takip edebilme
- Feed filtreleme - Tanıdıklar / Tanımadıklar

---

## Özellikler Detayı

### 1. Kayıt Sistemi
- Herkese açık kayıt (davetiye sistemi kaldırıldı)
- Cinsiyet seçimi (Kadın/Erkek)
- Cinsiyete göre avatar seçenekleri
- Email + username + şifre

### 2. Feed (Akış)
**Kategoriler:**
| Kategori | Emoji | Açıklama |
|----------|-------|----------|
| İtiraf | 🔥 | Kişisel itiraflar |
| İfşa | ⚠️ | Kişi ifşaları (hassas içerik) |
| Red Flag | 🚩 | Uyarı işaretleri |
| Yılanlık | 🐍 | İhanet/arkadan vurma hikayeleri |
| Dolandırıcılık | 💸 | Dolandırıcı uyarıları |
| Tavsiye | 💅 | Genel tavsiyeler |

**Feed Filter Tabs:**
- **Tümü** - Tüm paylaşımlar
- **Tanıdıklar** - Sadece takip edilenlerin paylaşımları
- **Tanımadıklar** - Takip edilmeyenlerin paylaşımları

**Özellikler:**
- Anonim veya isimli paylaşım seçeneği
- Spoiler/hassas içerik filtresi
- Reaksiyon sistemi: 🔥 Olay, 🫂 Yanındayım, 🐍 Yılan, 😱 Şok, 👏 Helal
- Yorum sistemi
- Yorum reaksiyonları

### 3. Match (Eşleşme)
**Tinder benzeri swipe sistemi:**
- Her kartta topluluk puanı görünür
- İlişki durumu gösterimi (Bekar, İlişkide, vb.)
- Düşük puanlı profillerde (<4) uyarı işareti
- Fotoğraf galerisi, bio, ilgi alanları, meslek, eğitim

**Aksiyonlar:**
- ❌ Pass (sola kaydır)
- ⭐ Super Like (yukarı)
- ❤️ Like (sağa kaydır)

### 4. Explore (Keşfet)
- Shadow profil arama (isim, şehir, etiket)
- Topluluk değerlendirmesi görme
- Negatif etiketler: Aldatıcı, Yalancı, Ghosting, Manipülatif, vb.

### 5. Profile (Profil)
- Avatar ve kullanıcı adı
- İtibar puanı
- İstatistikler: Paylaşım sayısı, değerlendirme sayısı
- Kendi paylaşımları
- Değerlendirmeler sekmesi

### 6. Takip Sistemi
- Kullanıcıları takip etme/takibi bırakma
- Takipçi sayısı
- Feed'de filtreleme

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

#### comment_reactions (2026-02-07 eklendi)
- id, comment_id, user_id, reaction_type
- UNIQUE(comment_id, user_id)

#### follows (2026-02-07 eklendi)
- id, follower_id, following_id
- UNIQUE(follower_id, following_id)

#### shadow_profiles
- id, target_name, identifier_hash, city, created_by

#### shadow_reviews
- id, shadow_profile_id, reviewer_id, score (1-10), content, tags[], is_anonymous

#### dating_profiles
- id, user_id, bio, photos[], interests[], job, education, city, age, is_active
- looking_for (TEXT: 'female' | 'male' | 'both')
- **relationship_status** (TEXT: 'single' | 'dating' | 'complicated' | 'married' | 'divorced' | 'widowed' | 'rather_not_say') - 2026-02-07 eklendi

#### swipes
- id, swiper_id, swiped_id, is_like, is_super_like

#### matches
- id, user1_id, user2_id, created_at

#### messages
- id, match_id, sender_id, content, is_read

#### notifications
- id, user_id, type, title, body, data (JSONB), is_read, created_at

#### user_reviews
- id, target_user_id, reviewer_id, score (1-10), content, tags[], is_anonymous
- UNIQUE(target_user_id, reviewer_id)

#### reports
- id, reporter_id, reported_user_id, reported_post_id, reason, status

---

## Geliştirme Geçmişi

### 2026-01-26 - İlk Versiyon
- Proje oluşturuldu (Expo SDK 53)
- Temel ekranlar tamamlandı

### 2026-01-28 - Supabase Aktivasyonu
- Tum 5 ekran Supabase'e baglanildi

### 2026-01-30 - Mesajlasma + Dating Profil + Kullanici Degerlendirme
- Mesajlasma sistemi eklendi
- Dating profil duzenleme ekrani eklendi
- Kullanici degerlendirme sistemi eklendi

### 2026-02-02 - Bildirim Ekrani
- `notifications` tablosu olusturuldu
- Bildirim ekrani eklendi

### 2026-02-04 - Web Deploy (Vercel)
- Platform kontrolleri eklendi
- SSR hydration fix
- Site canli: https://entrika.vercel.app

### 2026-02-04 - Davetiye Sistemi Kaldirma
- Gatekeeper ekrani karsilama ekranina donusturuldu
- Turkce karakter duzeltmeleri

### 2026-02-05 - Profil Duzenleme
- Username ve bio duzenleme eklendi
- Avatar degistirme eklendi

### 2026-02-05 - Web Build Fix (glass is not defined)
- Tum dosyalarda inline glassFallback kullaniliyor

### 2026-02-06 - Proje Yapısı Temizligi
- Duplika klasor silindi

### 2026-02-07 - Feed Tabs + Relationship Status + Comment Reactions
- **Logo component yeniden yazıldı** (basit ve güvenilir)
- **Reaction picker arka planı düzeltildi** (transparent -> solid)
- **Yorum optimistic update düzeltildi** (temp comment matching)
- **Feed filter tabs eklendi**: Tümü / Tanıdıklar / Tanımadıklar
  - `app/(tabs)/index.tsx`'e tab UI eklendi
  - `useFollow()` hook ile followingIds kullanılıyor
  - Post fetch'de filtreleme uygulanıyor
- **İlişki durumu UI eklendi**:
  - `dating_profiles` tablosuna `relationship_status` kolonu
  - `app/edit-dating-profile.tsx`'e seçici eklendi
  - `app/(tabs)/match.tsx`'te gösterim eklendi
- **Yorum reaksiyonları UI eklendi**:
  - `comment_reactions` tablosu oluşturuldu
  - `app/post-detail.tsx`'e tepki butonları eklendi
  - Tepki sayısı ve kullanıcı tepki rengi gösteriliyor

---

## Bilinen Sorunlar ve Eksiklikler

### Kritik Sorunlar
1. **Post silme/düzenleme yok** - Kullanıcılar paylaşımını silemiyor
2. **Realtime feed güncellemesi yok** - Yeni postlar için refresh gerekiyor
3. **Profil detayında ilişki durumu görünmüyor** - Sadece match ekranında var

### UI/UX Sorunları
1. **Feed algoritması yetersiz** - Engagement bazalı sıralama yok
2. **Match filtreleme sınırlı** - Yaş ve şehir filtresi yok
3. **Notification types eksik** - Bazı aksiyonlar bildirim gelmiyor

### Performance
1. **Pagination yok** - Tüm postlar aynı anda çekiliyor
2. **Image optimization eksik** - Large images sorun olabilir

---

## API Endpoints (Supabase RPC/Functions)

### Auth
- `signUp(email, password, username, gender, avatar)`
- `signIn(email, password)`
- `signOut()`

### Posts
- `getPosts(category?, feedFilter?, limit, offset)`
- `createPost(content, category, isAnonymous, isSpoiler, imageUrl?)`
- `addReaction(postId, reactionType)`
- `removeReaction(postId)`

### Comments
- `addComment(postId, content, isAnonymous)`
- `addCommentReaction(commentId, reactionType)`
- `removeCommentReaction(commentId)`

### Dating
- `getDatingProfiles(filters)`
- `swipe(targetUserId, isLike, isSuperLike)`
- `getMatches()`
- `updateDatingProfile(data)`

### Follow
- `followUser(targetUserId)`
- `unfollowUser(targetUserId)`
- `getFollowingIds()`
- `isFollowing(targetUserId)`

---

## Güvenlik Notları

1. **RLS (Row Level Security)** aktif
2. **Identifier hash** - telefon/instagram bilgileri hashlenir
3. **Anonim paylaşımlar** - author bilgisi frontend'de gizlenir
4. **Rate limiting** - spam önleme

---

## Kaynaklar

- [Expo Docs](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Lucide Icons](https://lucide.dev/icons)
- [DiceBear Avatars](https://dicebear.com)
