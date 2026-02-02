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
- Davetiye sistemi (zincir sorumluluk)

### Hedef Kitle
- Hem kadınlar hem erkekler
- Dating öncesi güvenlik arayanlar
- Topluluk istihbaratı isteyenler

---

## Teknik Bilgiler

### Tech Stack
- **Framework:** React Native (Expo SDK 53)
- **Router:** Expo Router (file-based routing)
- **Language:** TypeScript
- **Styling:** React Native StyleSheet (NativeWind kaldırıldı - Node.js 24 uyumsuzluğu)
- **Backend:** Supabase (production aktif, MOCK_MODE = false)
- **Icons:** Lucide React Native

### Renk Paleti (Light Mode - Vibrant & Fun)
```typescript
colors = {
  background: "#FFF7ED",  // Cream/Peach
  card: "#FFFFFF",
  primary: "#F97316",     // Orange
  accent: "#EC4899",      // Pink
  danger: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  text: "#1F2937",
  textLight: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
}
```

### Klasör Yapısı
```
entrika/
├── app/
│   ├── (auth)/          # Auth ekranları
│   │   ├── _layout.tsx
│   │   ├── index.tsx    # Gatekeeper (davetiye kodu)
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
- [x] Gatekeeper ekranı (davetiye kodu doğrulama)
- [x] Kayıt ekranı (cinsiyet seçimi, cinsiyete göre avatar, email, username, şifre)
- [x] Giriş ekranı
- [x] Feed (Supabase: posts + reactions + comments)
- [x] Match tab (Supabase: dating_profiles + swipes)
- [x] Explore tab (Supabase: shadow_profiles + shadow_reviews)
- [x] Profile sayfası (Supabase: profil + postlar + referanslar + cikis yap)
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
1. [ ] Profil duzenleme (username, bio, avatar degistirme)
2. [ ] Post silme / duzenleme
3. [ ] Feed'de realtime guncellemeler
4. [ ] Gelismis filtreleme (match'te yas, lokasyon)
5. [ ] Davetiye zincir takibi
6. [ ] Premium ozellikler

---

## Önemli Kararlar ve Notlar

### Alınan Kararlar
1. **Kadın-erkek ayrımı kaldırıldı** - Uygulama her iki cinsiyete de hitap edecek
2. **Light mode tercih edildi** - Warm/vibrant renkler (turuncu/pembe)
3. **NativeWind kaldırıldı** - Node.js 24 ile ESM uyumsuzluğu nedeniyle StyleSheet kullanılıyor
4. **Supabase production aktif** - MOCK_MODE = false, tum ekranlar gercek veri kullaniyor
5. **Mock data temizlendi** - data/mockData.ts sadece re-export, asil sabitler constants/categories.ts'de
6. **E-posta dogrulama kapatildi** - Supabase Authentication > Providers > Email > Confirm email = OFF

### Test Davetiye Kodları (Supabase)
- `ENTRIKA2024`
- `HOSGELDIN`
- `DAVET123`
- `BETA2024`
- `TOPLULUK`

### Dikkat Edilecekler
- Expo Go ile test edilebilir (development build gerekmez)
- Port 8081 meşgulse `--port 8082` kullan
- Supabase Dashboard: Authentication > Providers > Email > Confirm email = OFF olmali
- Yeni tablo eklenirse `supabase/setup-missing-tables.sql` guncellenmeli
- `supabase/user-reviews.sql` Supabase SQL Editor'de calistirilmali (user_reviews tablosu)
- `supabase/notifications.sql` Supabase SQL Editor'de calistirildi (notifications tablosu)

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

# Paket ekle
npm install <paket-adı>
```

---

## İletişim Notları

- Kullanıcı Türkçe konuşuyor, cevaplar Türkçe olmalı
- Kısa ve öz cevaplar tercih ediliyor
- Emoji kullanma (kullanıcı istemezse)
