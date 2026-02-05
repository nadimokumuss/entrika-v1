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
│   │   ├── index.tsx    # Feed (Supabase)
│   │   ├── match.tsx    # Eşleşme (Supabase)
│   │   ├── explore.tsx  # Keşfet (Supabase)
│   │   └── profile.tsx  # Profil (Supabase)
│   ├── chat/
│   │   └── [matchId].tsx # Chat ekrani (Supabase realtime)
│   ├── _layout.tsx      # Root layout
│   ├── new-post.tsx     # Yeni paylaşım (Supabase insert)
│   ├── edit-dating-profile.tsx # Dating profil duzenleme
│   ├── conversations.tsx # Sohbet listesi
│   ├── notifications.tsx # Bildirim ekrani (in-app)
│   └── review-user.tsx  # Kullanici degerlendirme formu (modal)
├── constants/
│   ├── theme.ts         # Renk ve spacing sabitleri
│   └── categories.ts   # Kategori ve reaksiyon sabitleri
├── contexts/
│   └── AuthContext.tsx  # Auth state yönetimi (production)
├── data/
│   └── mockData.ts      # Re-export (geriye uyumluluk)
├── components/
│   └── MessageBubble.tsx # Mesaj baloncugu bileşeni
├── lib/
│   ├── supabase.ts      # Supabase client + type definitions
│   └── messaging.ts     # Mesajlasma yardimci fonksiyonlari
└── supabase/
    ├── schema.sql              # Orijinal şema
    ├── schema-v2.sql           # Güncel tam şema
    ├── profile-trigger.sql     # Profil auto-create trigger
    ├── setup-missing-tables.sql # Eksik tablo kurulumu
    ├── user-reviews.sql        # Kullanici degerlendirme tablosu
    ├── notifications.sql       # Bildirim tablosu (in-app notifications)
    └── reputation-trigger.sql  # reputation_score otomatik guncelleme trigger'i
```

---

## Mevcut Durum

### Tamamlanan Özellikler
- [x] Karşılama ekranı (Hesap Oluştur / Giriş Yap)
- [x] Kayıt ekranı (cinsiyet seçimi, cinsiyete göre avatar, email, username, şifre)
- [x] Giriş ekranı
- [x] Feed (Supabase: posts + reactions + comments)
- [x] Match tab (Supabase: dating_profiles + swipes)
- [x] Explore tab (Supabase: shadow_profiles + shadow_reviews)
- [x] Profile sayfası (Supabase: profil + postlar + değerlendirmeler)
- [x] Yeni paylaşım (Supabase insert)
- [x] Supabase production aktif (MOCK_MODE = false)
- [x] Auth context ve navigation guard
- [x] Otomatik profil oluşturma trigger (handle_new_user)
- [x] Otomatik match oluşturma trigger (check_and_create_match)
- [x] useFocusEffect ile tab geçişlerinde veri yenileme

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

### Siradaki Ozellikler
1. [x] Profil duzenleme (username, bio, avatar degistirme)
2. [ ] Post silme / duzenleme
3. [ ] Feed'de realtime guncellemeler
4. [ ] Gelismis filtreleme (match'te yas, lokasyon)
5. [ ] Premium ozellikler

### Tamamlanan Ek Ozellikler
- [x] Web deploy (Vercel) - https://entrika.vercel.app
- [x] Platform kontrolleri (Haptics, Notifications, SecureStore, ImagePicker)
- [x] SSR hydration fix (isClient pattern)
- [x] Template dosyalari temizlendi (two.tsx kaldirildi)

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

### Dikkat Edilecekler
- Expo Go ile test edilebilir (development build gerekmez)
- Port 8081 meşgulse `--port 8082` kullan
- Supabase Dashboard: Authentication > Providers > Email > Confirm email = OFF olmali
- Yeni tablo eklenirse `supabase/setup-missing-tables.sql` guncellenmeli
- `supabase/user-reviews.sql` Supabase SQL Editor'de calistirilmali (user_reviews tablosu)
- `supabase/notifications.sql` Supabase SQL Editor'de calistirildi (notifications tablosu)

### Web Deploy Notlari
- **Vercel URL:** https://entrika.vercel.app
- **Vercel env vars:** `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` production scope'da tanimli
- **Build command:** `.env` dosyasi Vercel env vars'tan olusturulup `expo export --platform web --clear` calistirilir
- **vercel.json:** `rewrites` kullanilir (`routes` degil - routes statik dosyalari da yonlendirir!)
- **Platform kontrolleri:** Haptics, SplashScreen, SecureStore, ImagePicker, Notifications - hepsi `Platform.OS !== 'web'` ile sarili
- **Hydration fix:** `_layout.tsx`'te `isClient` state pattern - SSR'da bos View render edilir, client mount sonrasi gercek icerik
- **SecureStore:** Web'de `require('expo-secure-store')` yerine `localStorage` kullanilir
- **Auth storage:** Web'de localStorage, native'de SecureStore
- **Glass degiskeni fix:** StyleSheet.create icerisinde import edilen glass web build'te sorun yaratıyordu. Kritik bilesenlerde inline glass tanimi veya glassFallback kullanildi

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
