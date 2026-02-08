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
- **Monorepo:** Turborepo + npm workspaces
- **Mobile:** React Native (Expo SDK 54) + Expo Router ~6.0.22
- **Web:** Next.js 16 + Tailwind v4 + Framer Motion
- **Shared:** @entrika/shared (tipler, lib factory'leri, sabitler)
- **Language:** TypeScript
- **Styling:** Mobile: RN StyleSheet | Web: CSS Variables + Tailwind v4
- **Backend:** Supabase (production aktif, MOCK_MODE = false)
- **Icons:** Lucide React Native (mobile) / Lucide React (web)
- **Web Hosting:** Vercel
  - Mobile (eski): https://entrika.vercel.app
  - Web (yeni): https://entrika-web.vercel.app

### Tema Sistemi (Light/Dark)
**Default: Light tema.** Ayarlardan koyu temaya gecilebilir.

**Mimari:**
- `constants/theme.ts`: `lightColors`, `darkColors`, `lightGradients`, `darkGradients`, `lightGlass`, `darkGlass` + backward-compatible static exports
- `contexts/ThemeContext.tsx`: `ThemeProvider` + `useTheme()` hook → `{ colors, gradients, glass, isDark, toggleTheme }`
- Tercih: AsyncStorage (native) / localStorage (web)
- StatusBar: ThemeProvider tarafindan yonetilir
- 48 dosya `useTheme()` kullaniyor, `glassFallback` tamamen silindi

**Light Renk Paleti:**
```typescript
lightColors = {
  background: "#F5FBE6",  primary: "#FF7F11",  accent: "#FF7F11",
  card: "#E2E8CE",  text: "#262626",  border: "#ACBFA4",
}
```

**Dark Renk Paleti:**
```typescript
darkColors = {
  background: "#0A0A0F",  primary: "#A855F7",  accent: "#F472B6",
  card: "#16161F",  text: "#F1F1F6",  border: "#2A2A3C",
}
```

**Logo:** Light'ta turuncu tonlari, dark'ta mor/pembe tonlari

### Klasör Yapısı (Monorepo)
```
entrika/                              # Turborepo monorepo root
├── apps/
│   ├── mobile/                       # Expo SDK 54 React Native
│   │   ├── app/(auth)/               # Auth ekranları
│   │   ├── app/(tabs)/               # Ana tab ekranları (Feed, Match, Explore, Profile)
│   │   ├── app/chat/[matchId].tsx    # Realtime chat
│   │   ├── components/               # UI bileşenleri
│   │   ├── constants/                # Re-exports from @entrika/shared
│   │   ├── contexts/                 # AuthContext, FollowContext, ThemeContext
│   │   ├── hooks/                    # Re-exports from @entrika/shared
│   │   └── lib/                      # supabase, following, blocking, messaging, bookmarks
│   └── web/                          # Next.js 16 Web App
│       └── src/
│           ├── app/(auth)/           # Login, Register, Forgot Password
│           ├── app/(main)/           # Feed, Explore, Match, Messages, Profile, Settings, vb.
│           ├── app/u/[username]/     # SSR user profile (SEO)
│           ├── app/post/[postId]/    # Post detail
│           ├── components/layout/    # Sidebar, RightPanel, MobileNav
│           ├── contexts/             # AuthContext, ThemeContext, FollowContext
│           ├── hooks/                # useKeyboardShortcuts
│           └── lib/                  # supabase, shared (factory instances), notifications
├── packages/
│   └── shared/                       # @entrika/shared
│       └── src/
│           ├── types/index.ts        # Tum DB tipleri
│           ├── supabase.ts           # createSupabaseClient() factory
│           ├── lib/                   # Factory pattern: createXxxLib(supabase)
│           ├── constants/            # categories.ts, theme.ts
│           └── hooks/                # useError.ts
├── turbo.json
├── vercel.json                       # Monorepo deploy config
└── package.json                      # npm workspaces
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
- [x] Web deploy (Vercel) - https://entrika.vercel.app (mobile)
- [x] Platform kontrolleri (Haptics, Notifications, SecureStore, ImagePicker)
- [x] SSR hydration fix (isClient pattern)
- [x] Logo component yeniden yazıldı (basit ve güvenilir)
- [x] Reaction picker arka planı düzeltildi (transparent -> solid)
- [x] Light/Dark tema sistemi (ThemeContext + useTheme hook, 48 dosya migrate edildi)
- [x] **Monorepo donusumu** (Turborepo + npm workspaces)
- [x] **@entrika/shared paketi** (factory pattern, tipler, sabitler)
- [x] **Next.js 16 web uygulamasi** - 15 sayfa, tam ozellik paritesi
- [x] **Web deploy** - https://entrika-web.vercel.app
- [x] **Web ozellikleri**: Klavye kisayollari, Web Notifications, SSR SEO, drag-to-swipe

---

## Önemli Kararlar ve Notlar

### Alınan Kararlar
1. **Kadın-erkek ayrımı kaldırıldı** - Uygulama her iki cinsiyete de hitap edecek
2. **Light/Dark tema sistemi** - Default light (#F5FBE6 bg, #FF7F11 primary), dark (#0A0A0F bg, #A855F7 primary). ThemeContext + useTheme() hook, AsyncStorage persist
3. **NativeWind kaldırıldı** - Node.js 24 ile ESM uyumsuzluğu nedeniyle StyleSheet kullanılıyor
4. **Supabase production aktif** - MOCK_MODE = false, tum ekranlar gercek veri kullaniyor
5. **Mock data temizlendi** - data/mockData.ts sadece re-export, asil sabitler constants/categories.ts'de
6. **E-posta dogrulama kapatildi** - Supabase Authentication > Providers > Email > Confirm email = OFF
7. **Web deploy Vercel uzerinden** - Static rendering + rewrites ile SPA routing
8. **Davetiye sistemi kaldirildi** - Uygulama herkese acik, gatekeeper yerine karsilama ekrani
9. **Turkce karakter duzeltmeleri** - Tum UI metinlerinde ö, ü, ş, ç, ğ, ı, İ, Ş, Ç karakterleri duzeltildi
10. **Takip sistemi eklendi** - FollowContext, follows tablosu, kullanıcı takip edebilir
11. **Monorepo yapısı (2026-02-08)** - Turborepo + npm workspaces, @entrika/shared factory pattern
12. **Web app Next.js 16** - Tailwind v4 + CSS Variables tema, 3-kolonlu layout, Framer Motion
13. **Shared lib factory pattern** - `createXxxLib(supabase)` → platform-agnostic
14. **Mobile bridge re-exports** - constants/ ve hooks/ @entrika/shared'dan re-export, lib/ dosyalari ayni kaldi
15. **Web deploy Vercel monorepo** - Root'tan deploy, `buildCommand: cd apps/web && npm run build`

### Dikkat Edilecekler
- Expo Go ile test edilebilir (development build gerekmez)
- Port 8081 meşgulse `--port 8082` kullan
- Supabase Dashboard: Authentication > Providers > Email > Confirm email = OFF olmali
- Yeni tablo eklenirse `supabase/setup-missing-tables.sql` guncellenmeli
- `supabase/update-relationship-status.sql` Supabase SQL Editor'de calistirilmali (EN ÖNCE!)

### Web Deploy Notlari (Next.js)
- **Vercel URL (web):** https://entrika-web.vercel.app
- **Vercel URL (mobile/eski):** https://entrika.vercel.app
- **Vercel proje adi:** entrika-web
- **Vercel env vars:** `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` production scope'da tanimli
- **Deploy:** Monorepo root'tan `npx vercel --prod --yes` (vercel.json buildCommand ile apps/web build eder)
- **vercel.json (root):** `buildCommand: cd apps/web && npm run build`, `outputDirectory: apps/web/.next`
- **Tema:** CSS Variables + `.dark` class toggle, Tailwind v4 @theme inline
- **Auth storage:** Web'de localStorage adapter

### Eski Mobile Web Deploy Notlari
- **Platform kontrolleri:** Haptics, SplashScreen, SecureStore, ImagePicker, Notifications - hepsi `Platform.OS !== 'web'` ile sarili
- **Auth storage:** Mobile native'de SecureStore, mobile web'de localStorage

### Tema Kullanimi
- `useTheme()` hook'u kullan: `const { colors, gradients, glass, isDark } = useTheme()`
- StyleSheet: `useMemo(() => StyleSheet.create({...}), [colors, glass])` ile component icinde
- Memo'd sub-componentler kendi `useTheme()` cagrisi yapmali
- ErrorBoundary class component → static import kullanir (`colors`, `glass` from theme.ts)
- `app/_layout.tsx` pre-ThemeProvider loading icin `lightColors` import eder

### Proje Yapisi
- **Repo Root:** `C:\Users\reiss\Desktop\Entrika v1\entrika\` (Turborepo monorepo)
- **Mobile App:** `apps/mobile/`
- **Web App:** `apps/web/`
- **Shared Package:** `packages/shared/`

---

## Geliştirme Komutları

```bash
# Monorepo root
cd "C:\Users\reiss\Desktop\Entrika v1\entrika"

# Mobile gelistirme
cd apps/mobile && npx expo start --tunnel

# Web gelistirme
cd apps/web && npm run dev          # http://localhost:3000

# Web build (lokal test)
cd apps/web && npm run build

# Web deploy (Vercel production)
cd "C:\Users\reiss\Desktop\Entrika v1\entrika" && npx vercel --prod --yes

# Turborepo build (tum paketler)
npm run build

# Paket ekle (mobile)
cd apps/mobile && npm install <paket>

# Paket ekle (web)
cd apps/web && npm install <paket>

# Paket ekle (shared)
cd packages/shared && npm install <paket>
```

---

## İletişim Notları

- Kullanıcı Türkçe konuşuyor, cevaplar Türkçe olmalı
- Kısa ve öz cevaplar tercih ediliyor
- Emoji kullanma (kullanıcı istemezse)
