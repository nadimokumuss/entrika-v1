# Entrika - Kurulum Rehberi

Bu rehber, Entrika projesini sıfırdan kurmak ve çalıştırmak için adım adım talimatlar içerir.

## 📋 Ön Koşullar

Aşağıdaki yazılımların yüklü olduğundan emin olun:

- **Node.js**: v18 veya üzeri ([indir](https://nodejs.org/))
- **npm**: v9 veya üzeri (Node.js ile birlikte gelir)
- **Git**: Son sürüm ([indir](https://git-scm.com/))
- **VS Code** (önerilir) veya başka bir IDE
- **Expo Account**: [expo.dev](https://expo.dev) adresinden ücretsiz hesap

## 🚀 Hızlı Başlangıç

### 1. Projeyi Klonlayın

```bash
git clone <repo-url>
cd entrika
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

Bu işlem birkaç dakika sürebilir.

### 3. Environment Variables Oluşturun

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Bu değerleri Supabase projenizden alacaksınız (aşağıda).

## 🗄️ Supabase Kurulumu

### 1. Supabase Projesi Oluşturun

1. [supabase.com](https://supabase.com)'a gidin
2. "New Project" butonuna tıklayın
3. Formu doldurun:
   - **Organization**: Organizasyon adı
   - **Name**: `entrika` (veya istediğiniz ad)
   - **Database Password**: Güçlü bir şifre (bunuyun!)
   - **Region**: En yakın region (örn: Amsterdam)
4. "Create new project" butonuna tıklayın
5. Projenin hazır olması için 1-2 dakika bekleyin

### 2. API Anahtarlarını Alın

Proje hazır olduğunda:

1. Sol menüden **Settings** > **API**'ye gidin
2. **Project URL**'yi kopyalayın → `.env` dosyasına yapıştırın
3. **anon public** key'i kopyalayın → `.env` dosyasına yapıştırın

### 3. E-posta Doğrulamayı Kapatın (Geliştirme için)

1. **Authentication** > **Providers** > **Email**'e gidin
2. **Confirm email** ayarını **OFF** yapın
3. Kaydedin

### 4. Database Şemasını Oluşturun

Supabase SQL Editor'da şu dosyaları **sırayla** çalıştırın:

```sql
-- 1. Ana şema
-- supabase/schema-v2.sql içeriğini buraya yapıştırın ve çalıştırın

-- 2. Profil otomatik oluşturma trigger
-- supabase/profile-trigger.sql

-- 3. Kullanıcı değerlendirmeleri
-- supabase/user-reviews.sql

-- 4. Bildirimler
-- supabase/notifications.sql

-- 5. Bookmarks
-- supabase/bookmarks-schema.sql
```

Dosyalar proje kök dizinindeki `supabase/` klasöründedir.

### 5. Storage Bucket Oluşturun

1. **Storage** > **New bucket**'a tıklayın
2. Bucket adı: `avatars`
3. **Public bucket**: ✅ İşaretleyin
4. **Allowed file size**: 1MB
5. **Create** butonuna tıklayın

Aynı şekilde `posts` bucket'ını da oluşturun (public, 5MB).

## 📱 Uygulamayı Çalıştırma

### Development Build (Önerilen)

Development build ile test etmek en iyi yöntemdir:

```bash
npx expo start
```

Ardından:

- **iOS**: Simulator açılacaktır
- **Android**: Emulator bağlayın veya `a` tuşuna basın
- **Web**: `w` tuşuna basın
- **Physical Device**: QR kodu scan edin (Expo Go uygulaması ile)

### Web Development

```bash
npx expo start --web
```

Tarayıcıda otomatik olarak `http://localhost:8081` açılacaktır.

### Tunnel Modu (Telefon Testi)

Farklı ağdaki telefonlarda test etmek için:

```bash
npx expo start --tunnel
```

QR kodu telefonunuzda Expo Go ile scan edin.

## 🔧 VS Code Ayarları (Önerilir)

### Eklentiler

Bu eklentileri yükleyin:

- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **TypeScript Importer** (pmneo.tsimporter)
- **Error Lens** (usernamehw.errorlens)

### Workspace Settings

`.vscode/settings.json` dosyası:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## 🐛 Sorun Giderme

### Port 8081 Kullanımda Hatası

```bash
npx expo start --port 8082
```

### Metro Barder Hataları

```bash
# Cache'i temizle
npx expo start -c

# Node_modules'i yeniden yükle
rm -rf node_modules
npm install
```

### Supabase Bağlantı Hatası

1. `.env` dosyasının doğru olduğundan emin olun
2. Supabase projesinin "Active" durumda olduğunu kontrol edin
3. API anahtarlarının doğru kopyalandığını kontrol edin

### Permission Hataları

Supabase'de RLS (Row Level Security) politikalarını kontrol edin:

```sql
-- Policy kontrolü
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

## 📱 Test Kullanıcısı Oluşturma

1. Uygulamayı açın
2. "Hesap Oluştur" butonuna tıklayın
3. Formu doldurun:
   - **Cinsiyet**: Seçin
   - **Email**: test@example.com
   - **Username**: testuser
   - **Şifre**: Test123!
4. "Kayıt Ol" butonuna tıklayın

Supabase'de otomatik olarak profil oluşturulacaktır.

## 🎯 Sonraki Adımlar

Kurulum tamamlandıktan sonra:

1. **Özellikleri Test Edin**: Post paylaşın, eşleşme yapın, mesajlaşın
2. **Realtime'i Test Edin**: Farklı cihazlarda açın ve gerçek zamanlı güncellemeleri görün
3. **Production Build**: EAS build ile gerçek bir APK/IPA oluşturun

Detaylı bilgi için `DEPLOYMENT.md` dosyasına bakın.

## 🆘 Yardım

Sorun yaşarsanız:

1. **Console'u Kontrol Edin**: `npx expo start` çıktısını okuyun
2. **Supabase Logs**: Supabase dashboard'da database logs'u kontrol edin
3. **GitHub Issues**: Proje repo'sunda issue açın

---

İyi geliştirmeler! 🚀
