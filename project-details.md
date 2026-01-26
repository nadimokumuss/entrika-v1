# Entrika - Project Details

> Son güncelleme: 2026-01-26
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
- Davetiye sistemi ile kaliteli topluluk

---

## Özellikler Detayı

### 1. Davetiye Sistemi (Gatekeeper)
- Uygulamaya sadece davetiye kodu ile girilebilir
- Her kullanıcı 3 davetiye hakkına sahip
- Zincir sorumluluk: Davet eden kişi, davet ettiğinin eylemlerinden kısmen sorumlu
- Kural ihlalinde her ikisinin de puanı düşebilir

### 2. Kayıt Sistemi
- Cinsiyet seçimi (Kadın/Erkek)
- Cinsiyete göre avatar seçenekleri
  - Kadın: Lorelei avatar stili
  - Erkek: Avataaars stili
- Email + username + şifre
- Davetiye kodu doğrulama

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
- İstatistikler: Davetiye sayısı, paylaşım sayısı, referans sayısı
- Kendi paylaşımları
- Davet ettiği kişiler listesi

---

## Veritabanı Şeması

### Tablolar

#### profiles
- id (UUID, PK)
- username (TEXT, UNIQUE)
- avatar_url (TEXT)
- gender (TEXT: 'female' | 'male')
- reputation_score (DECIMAL, default 5.0)
- invite_quota (INTEGER, default 3)
- invited_by (UUID, FK)
- invite_code (TEXT, UNIQUE)
- is_verified (BOOLEAN)
- created_at, updated_at

#### invite_codes
- id, code, created_by, used_by, is_used, created_at, used_at

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

### Sonraki Oturum İçin Notlar
- Supabase projesini oluşturup bağlamak
- MOCK_MODE'u kapatmak
- Dating profil oluşturma ekranı eklemek
- Mesajlaşma sistemini başlatmak

---

## API Endpoints (Supabase RPC/Functions)

### Auth
- `signUp(email, password, username, gender, avatar, inviteCode)`
- `signIn(email, password)`
- `signOut()`
- `validateInviteCode(code)`

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
