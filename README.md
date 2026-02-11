# Entrika

> "Tanışmadan Önce Tanı" - Topluluk Destekli Dating ve Sosyal İstihbarat Platformu

Entrika, kullanıcıların birbirini değerlendirebildiği, topluluk puanları görebildiği ve güvenli bir dating deneyimi sunan bir React Native mobil uygulamasıdır.

## 🎯 Özellikler

### Core Özellikler
- **Topluluk Puanı**: Kullanıcılar birbirini değerlendirebilir, itibar skoru oluşur
- **Dating Profili**: Tinder benzeri swipe ile eşleşme sistemi
- **Anonim Paylaşım**: İtiraf, ifşa, red flag, tavsiye kategorileri
- **Gerçek Zamanlı Mesajlaşma**: Eşleşen kullanıcılar arasında chat
- **Arama**: Kullanıcı, post ve hashtag arama
- **Bookmark**: Postları kaydetme özelliği

### UI/UX Özellikleri
- **Toast Notifications**: Success, error, info, warning bildirimleri
- **Image Lightbox**: Full-screen resim görüntüleyici (zoom, kaydet, paylaş)
- **Glass Morphism**: Premium dark tema tasarım
- **Smooth Animations**: Animated API ve spring physics
- **Haptic Feedback**: iOS ve Android dokunsal geri bildirim

### Teknik Özellikler
- **Performance Optimized**: React.memo, useCallback, useMemo
- **Error Handling**: Error Boundary ve retry mekanizması
- **Analytics**: Event tracking ve engagement monitoring
- **Realtime Sync**: Supabase realtime subscriptions

## 🛠 Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Language**: TypeScript
- **Router**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native
- **Haptics**: Expo Haptics
- **Linear Gradients**: Expo Linear Gradient

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Expo Go (development için) veya EAS (production build)

### Adımlar

1. **Repo'yu klonlayın**
```bash
git clone <repo-url>
cd entrika
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment variables oluşturun**
```bash
cp .env.example .env
```

`.env` dosyasını Supabase bilgilerinizle doldurun:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. **Supabase'i kurun**

Supabase SQL Editor'da şu dosyaları sırayla çalıştırın:
- `supabase/schema.sql`
- `supabase/schema-v2.sql`
- `supabase/profile-trigger.sql`
- `supabase/user-reviews.sql`
- `supabase/notifications.sql`
- `supabase/bookmarks-schema.sql`

5. **Uygulamayı başlatın**
```bash
# Development
npx expo start

# Web
npx expo start --web

# Tunnel (telefon testi)
npx expo start --tunnel
```

## 📁 Proje Yapısı

```
entrika/
├── app/                    # Expo Router sayfaları
│   ├── (auth)/            # Auth ekranları
│   ├── (tabs)/            # Ana tab ekranları
│   ├── chat/              # Chat ekranları
│   └── bookmarks.tsx      # Kaydedilenler
├── components/
│   └── ui/                # UI bileşenleri
├── constants/
│   ├── theme.ts           # Renk ve tasarım
│   └── categories.ts      # Kategori tanımları
├── contexts/
│   └── AuthContext.tsx    # Auth state yönetimi
├── hooks/                 # Custom hooks
├── lib/
│   ├── supabase.ts        # Supabase client
│   ├── bookmarks.ts       # Bookmark fonksiyonları
│   ├── blocking.ts        # Kullanıcı engelleme
│   ├── messaging.ts       # Mesajlaşma
│   ├── notifications.ts   # Bildirimler
│   └── storage.ts         # Dosya yükleme
└── supabase/              # SQL şemaları
```

## 🎨 Renk Paleti

```typescript
colors = {
  background: "#0A0A0F",    // Derin koyu
  card: "#16161F",
  primary: "#A855F7",        // Mor
  accent: "#F472B6",         // Pembe
  danger: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
}
```

## 🚀 Deployment

### Web (Vercel)
```bash
npx expo export --platform web
npx vercel --prod
```

### iOS/Android (EAS)
```bash
eas build --platform ios
eas build --platform android
```

Detaylı bilgi için `DEPLOYMENT.md` dosyasına bakın.

## 📱 Ana Ekranlar

| Ekran | Açıklama |
|-------|----------|
| **Feed** | Anonim paylaşımlar, reaksiyonlar, yorumlar |
| **Match** | Dating profili, swipe ile eşleşme |
| **Explore** | Shadow profiller, kullanıcı değerlendirmeleri |
| **Profil** | Kullanıcı profili, ayarlar, bookmarks |

## 🔧 Geliştirme

### Yeni özellik eklerken
1. Component'i `components/ui/` klasörüne ekleyin
2. Hook'u `hooks/` klasörüne ekleyin
3. Supabase fonksiyonunu `lib/` klasörüne ekleyin
4. Sayfayı `app/` klasörüne ekleyin

### Kod standartları
- TypeScript kullanın
- React Native StyleSheet ile stil verin
- Lucide React Native ikonları kullanın
- Haptic feedback ekleyin (native'de)

## 📝 Lisans

Bu proje özel bir projedir.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun: `git checkout -b feature/amazing-feature`
3. Commit yapın: `git commit -m 'feat: Add amazing feature'`
4. Branch'i pushlayın: `git push origin feature/amazing-feature`
5. Pull Request açın

## 📞 İletişim

Sorularınız için issue açın.

---

**Entrika** © 2024 - "Tanışmadan Önce Tanı"
