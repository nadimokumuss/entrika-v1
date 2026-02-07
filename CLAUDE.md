# CLAUDE.md - Entrika Projesi için Claude Talimatları

## Sync Sistemi

### sync-start
Kullanıcı "sync-start" dediğinde:
1. `git pull origin main` ile en güncel kodu çek
2. Bu dosyayı (`CLAUDE.md`) oku
3. `project-details.md` dosyasını oku
4. Nerede kaldığımızı ve sonraki adımları kullanıcıya özetle

### sync-end
Kullanıcı "sync-end" dediğinde:
1. Yapılan değişiklikleri `project-details.md` dosyasına yaz
2. Alınan kararları ve güncellemeleri `CLAUDE.md` dosyasına ekle
3. Tüm değişiklikleri git'e ekle: `git add -A`
4. Anlamlı bir commit mesajı ile commit oluştur
5. GitHub'a pushla: `git push origin main`
6. Kullanıcıya özet ver

---

## Proje Özeti

**Entrika** - "Tanışmadan Önce Tanı" sloganıyla dating ve sosyal istihbarat uygulaması.

### Temel Konsept
- Kullanıcılar birbirini değerlendirebiliyor (topluluk puanı)
- Tinder benzeri eşleşme sistemi AMA eşleşmeden önce karşı tarafın topluluk puanını görebiliyorsun
- Anonim paylaşımlar (itiraf, ifşa, red flag, yılanlık, dolandırıcılık, tavsiye)
- Herkese açık kayıt (davetiye sistemi kaldırıldı)
- Takip sistemi (Follow) - kullanıcıları takip edebilirsin
- Feed filtreleme - Tümü / Tanıdıklar / Tanımadıklar

### Platform Stratejisi (2026-02-07 güncellendi)
**X (Twitter) modeli:** Ayrı codebase'ler, aynı backend.

```
┌────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                  │
│  - Database, Auth, Storage, Realtime                  │
└──────────────┬─────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────────┐
│  MOBILE APP  │  │   WEB SITE       │
│  (Expo/RN)   │  │   (Next.js)      │
│              │  │                  │
│  - Native UI │  │  - Web UI        │
│  - Tab bar   │  │  - Sidebar nav   │
│  - Swipe     │  │  - Hover states  │
│  - Gestures  │  │  - Keyboard nav  │
└──────────────┘  └──────────────────┘
```

- **Mobile**: `entrika/` - React Native (Expo SDK 54) - Mevcut proje
- **Web**: `entrika-web/` - Next.js (yeni proje, başlanmadı)

**Development Stratejisi:**
- Mobile geliştirme: `npx expo start --tunnel` (telefonda test)
- Web deploy: `npx vercel --prod` (mobile test sonrası)

### Test Listesi (2026-02-07)
Kullanıcı her değişiklik sonrası bu listeyi kontrol etmelidir:

**Feed Ekranı (app/(tabs)/index.tsx):**
- [ ] Logo üst kısımda görünüyor
- [ ] Tab'ler çalışıyor: Tümü / Tanıdıklar / Tanımadıklar
- [ ] "Tanıdıklar" boşsa özel empty state gösteriliyor
- [ ] Post paylaşımı çalışıyor (anonim/isimli)
- [ ] Yorum ekleyince kalıcı olarak ekleniyor (optimistic update düzgün)
- [ ] Reaction picker düzgün arka planla gösteriliyor
- [ ] Kendi postunu menüden silebiliyor musun?

**Post Detay (app/post-detail.tsx):**
- [ ] Yorumlara tepki verilebiliyor (emoji + sayı)
- [ ] Kendi yorumunu silebiliyor musun?
- [ ] Yorum reactions yükleniyor mu hata olmadan?

**Match Ekranı (app/(tabs)/match.tsx):**
- [ ] Blokladığın kullanıcılar kartlarda görünmüyor
- [ ] İlişki durumu profil kartında gösteriliyor
- [ ] Refresh butonu (rotate icon) çalışıyor
- [ ] Profile card swipe edilebiliyor

**Explore (app/(tabs)/explore.tsx):**
- [ ] Takip butonu tıklanınca anında güncelleniyor
- [ ] Follow/Unfollow gerçek zamanlı çalışıyor
- [ ] Hata durumunda ErrorState + Retry görünüyor

**Profil (app/(tabs)/profile.tsx):**
- [ ] Avatar yükleme başarılı olunca güncelleniyor
- [ ] Avatar yükleme hata olursa Alert gösteriliyor
- [ ] Dating profil'de ilişki durumu seçilebiliyor

**Notifications (app/notifications.tsx):**
- [ ] Bildirimler listeleniyor
- [ ] Bildirim tıklanınca ilgili sayfaya yönlendiriyor
- [ ] Hata durumunda ErrorState görünüyor

**Conversations (app/conversations.tsx):**
- [ ] Sohbetler listeleniyor
- [ ] Hata durumunda ErrorState + Retry görünüyor

**Genel:**
- [ ] İnternet kesilince "Network error" hatası gösteriliyor
- [ ] Retry butonuna basınca tekrar deneniyor
- [ ] Uygulama crash vermeden hataları yönetiyor

### Hedef Kitle
- Hem kadınlar hem erkekler
- Dating öncesi güvenlik arayanlar
- Topluluk istihbaratı isteyenler

---

## Teknik Bilgiler

### Tech Stack
- **Framework:** React Native (Expo SDK 54)
- **Router:** Expo Router ~6.0.22 (file-based routing)
- **Language:** TypeScript
- **Styling:** React Native StyleSheet (NativeWind kaldırıldı - Node.js 24 uyumsuzluğu)
- **Backend:** Supabase (production aktif, MOCK_MODE = false)
- **Icons:** Lucide React Native
- **Web Hosting:** Vercel (https://entrika.vercel.app)

### Renk Paleti (Dark Premium)
```typescript
colors = {
  background: "#0A0A0F",  // Derin koyu
  card: "#16161F",
  cardElevated: "#1E1E2A",
  primary: "#A855F7",     // Mor
  primaryLight: "#C084FC",
  accent: "#F472B6",      // Pembe
  danger: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  text: "#F1F1F6",
  textLight: "#A1A1B5",
  textMuted: "#5A5A72",
  border: "#2A2A3C",
}
```

### Klasör Yapısı
```
entrika/
├── app/
│   ├── (auth)/          # Auth ekranları
│   │   ├── _layout.tsx
│   │   ├── index.tsx    # Karşılama ekranı (Hesap Oluştur / Giriş Yap)
│   │   ├── login.tsx    # Giriş
│   │   ├── forgot-password.tsx # Sifremi unuttum
│   │   └── register.tsx # Kayıt (cinsiyet + avatar)
│   ├── (tabs)/          # Ana tab ekranları
│   │   ├── _layout.tsx
│   │   ├── index.tsx    # Feed (Supabase) + Feed Filter Tabs
│   │   ├── match.tsx    # Eşleşme (Supabase)
│   │   ├── explore.tsx  # Keşfet (Supabase)
│   │   └── profile.tsx  # Profil (Supabase)
│   ├── chat/
│   │   └── [matchId].tsx # Chat ekrani (Supabase realtime)
│   ├── _layout.tsx      # Root layout
│   ├── new-post.tsx     # Yeni paylaşım (Supabase insert)
│   ├── edit-dating-profile.tsx # Dating profil duzenleme + Relationship Status
│   ├── conversations.tsx # Sohbet listesi
│   ├── notifications.tsx # Bildirim ekrani (in-app)
│   ├── post-detail.tsx  # Post detay + yorumlar + yorum reaksiyonları
│   └── review-user.tsx  # Kullanici degerlendirme formu (modal)
├── components/
│   ├── Logo.tsx         # Basit logo component (3 bar)
│   ├── ui/              # UI bileşenleri
│   └── ...
├── constants/
│   ├── theme.ts         # Renk ve spacing sabitleri
│   └── categories.ts   # Kategori ve reaksiyon sabitleri
├── contexts/
│   ├── AuthContext.tsx  # Auth state yönetimi (production)
│   └── FollowContext.tsx # Follow state yönetimi
├── lib/
│   ├── supabase.ts      # Supabase client + type definitions
│   ├── following.ts     # Follow fonksiyonları
│   └── ...
└── supabase/
    ├── schema.sql              # Orijinal şema
    ├── schema-v2.sql           # Güncel tam şema
    └── update-relationship-status.sql # Relationship status + comment reactions
```

---

## Mevcut Durum

### Tamamlanan Özellikler
- [x] Karşılama ekranı (Hesap Oluştur / Giriş Yap)
- [x] Kayıt ekranı (cinsiyet seçimi, cinsiyete göre avatar, email, username, şifre)
- [x] Giriş ekranı
- [x] Feed (Supabase: posts + reactions + comments)
- [x] Feed Filter Tabs: Tümü / Tanıdıklar / Tanımadıklar
- [x] Match tab (Supabase: dating_profiles + swipes)
- [x] Explore tab (Supabase: shadow_profiles + shadow_reviews)
- [x] Profile sayfası (Supabase: profil + postlar + değerlendirmeler)
- [x] Yeni paylaşım (Supabase insert)
- [x] Supabase production aktif (MOCK_MODE = false)
- [x] Auth context ve navigation guard
- [x] Otomatik profil oluşturma trigger (handle_new_user)
- [x] Otomatik match oluşturma trigger (check_and_create_match)
- [x] useFocusEffect ile tab geçişlerinde veri yenileme
- [x] Takip sistemi (Follow)
- [x] İlişki durumu seçimi (Dating Profile)
- [x] Yorum reaksiyonları (Comment Reactions)

### Yapılacaklar (Öncelik Sırasına Göre)
1. [x] Mesajlaşma sistemi (eşleşmeler arası)
2. [x] Dating profil oluşturma/düzenleme ekranı
3. [x] Profil değerlendirme/yorum ekleme
4. [x] Push bildirimleri
5. [x] Gerçek fotoğraf yükleme
6. [x] Ayarlar sayfası
7. [x] Şifremi unuttum akışı
8. [x] reputation_score otomatik guncelleme (user_reviews trigger)
9. [x] Bildirim ekrani (in-app notifications + bell badge)
10. [x] Feed filter tabs (Tümü/Tanıdıklar/Tanımadıklar)
11. [x] İlişki durumu UI
12. [x] Yorum reaksiyonları UI

### Siradaki Ozellikler
1. [ ] Post silme / duzenleme
2. [ ] Gelismis filtreleme (match'te yas, lokasyon)
3. [ ] Premium ozellikler
4. [ ] Profil detay sayfasında ilişki durumu gösterimi
5. [ ] Feed'de algorithm optimization

### Tamamlanan Ek Ozellikler
- [x] Web deploy (Vercel) - https://entrika.vercel.app
- [x] Platform kontrolleri (Haptics, Notifications, SecureStore, ImagePicker)
- [x] SSR hydration fix (isClient pattern)
- [x] Template dosyalari temizlendi (two.tsx kaldirildi)
- [x] Logo component yeniden yazıldı (basit ve güvenilir)
- [x] Reaction picker arka planı düzeltildi (transparent -> solid)

---

## Önemli Kararlar ve Notlar

### Alınan Kararlar
1. **Kadın-erkek ayrımı kaldırıldı** - Uygulama her iki cinsiyete de hitap edecek
2. **Dark Premium tema** - Koyu arka plan (#0A0A0F), mor (#A855F7) ve pembe (#F472B6) vurgular
3. **NativeWind kaldırıldı** - Node.js 24 ile ESM uyumsuzluğu nedeniyle StyleSheet kullanılıyor
4. **Supabase production aktif** - MOCK_MODE = false, tum ekranlar gercek veri kullaniyor
5. **Mock data temizlendi** - data/mockData.ts sadece re-export, asil sabitler constants/categories.ts'de
6. **E-posta dogrulama kapatildi** - Supabase Authentication > Providers > Email > Confirm email = OFF
7. **Web deploy Vercel uzerinden** - Static rendering + rewrites ile SPA routing
8. **Davetiye sistemi kaldirildi** - Uygulama herkese acik, gatekeeper yerine karsilama ekrani
9. **Turkce karakter duzeltmeleri** - Tum UI metinlerinde ö, ü, ş, ç, ğ, ı, İ, Ş, Ç karakterleri duzeltildi
10. **Takip sistemi eklendi** - FollowContext, follows tablosu, kullanıcı takip edebilir

### Dikkat Edilecekler
- Expo Go ile test edilebilir (development build gerekmez)
- Port 8081 meşgulse `--port 8082` kullan
- Supabase Dashboard: Authentication > Providers > Email > Confirm email = OFF olmali
- Yeni tablo eklenirse `supabase/setup-missing-tables.sql` guncellenmeli
- `supabase/update-relationship-status.sql` Supabase SQL Editor'de calistirilmali (EN ÖNCE!)

### Web Deploy Notlari
- **Vercel URL:** https://entrika.vercel.app
- **Vercel env vars:** `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` production scope'da tanimli
- **Build command:** `.env` dosyasi Vercel env vars'tan olusturulup `expo export --platform web --clear` calistirilir
- **vercel.json:** `rewrites` kullanilir (`routes` degil - routes statik dosyalari da yonlendirir!)
- **Platform kontrolleri:** Haptics, SplashScreen, SecureStore, ImagePicker, Notifications - hepsi `Platform.OS !== 'web'` ile sarili
- **Hydration fix:** `_layout.tsx`'te `isClient` state pattern - SSR'da bos View render edilir, client mount sonrasi gercek icerik
- **SecureStore:** Web'de `require('expo-secure-store')` yerine `localStorage` kullanilir
- **Auth storage:** Web'de localStorage, native'de SecureStore

### Glass Degiskeni
Artık glass import edilmiyor. Tum dosyalarda inline glassFallback kullaniliyor:
```typescript
const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
```

### Proje Yapisi
- **Repo Root:** `C:\Users\reiss\Desktop\Entrika v1\entrika\`
- **Duplika klasor:** YOK (entrika/entrika/ silindi - 2026-02-06)
- **Tum dosyalar tek ve dogru lokasyonda

---

## Geliştirme Komutları

```bash
# Projeyi başlat
cd "C:\Users\reiss\Desktop\Entrika v1\entrika"
npx expo start

# Farklı port ile başlat
npx expo start --port 8082

# Tunnel modunda başlat (telefon testi için)
npx expo start --tunnel

# Web dev mode
npx expo start --web

# Web build (static export)
npx expo export --platform web

# Vercel deploy (production)
npx vercel --prod --yes

# Paket ekle
npm install <paket-adı>
```

---

## İletişim Notları

- Kullanıcı Türkçe konuşuyor, cevaplar Türkçe olmalı
- Kısa ve öz cevaplar tercih ediliyor
- Emoji kullanma (kullanıcı istemezse)
