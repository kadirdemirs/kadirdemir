# Kadir Demir — Kişisel Site

YouTuber içerik üreticisi için React 19 + Vite 8 + Express + MongoDB üzerine kurulu kişisel site. Vercel'de host edilir.

## Özellikler

- **Frontend:** React 19, Vite 8, React Router 7, Framer Motion, responsive image pipeline (`vite-imagetools` + `sharp`)
- **Backend:** Express 5, MongoDB Atlas, JWT auth (httpOnly cookie + CSRF)
- **PWA:** Service Worker, manifest, offline page, install shortcuts
- **SEO:** JSON-LD (Person, FAQ, Video), dinamik sitemap, OG tags
- **Analytics:** GA4 (client + server-side GA4 Data API)
- **Newsletter:** Double opt-in (e-posta onayı), unsubscribe
- **YouTube:** Data API v3 entegrasyonu (10 dk MongoDB cache)
- **Admin panel:** Dashboard, Analitik, Mesajlar, Blog, Newsletter, Medya, Hatırlatıcılar, Kullanıcılar, Yedekleme, Site Ayarları

## Kurulum

```bash
# Bağımlılıklar
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env'yi açıp MongoDB, JWT_SECRET, SMTP ve YOUTUBE_API_KEY değerlerini doldur

# Geliştirme
npm run dev          # Frontend (port 5173)
npm run dev:api      # Backend (port 3001)

# Production build
npm run build
```

## Komutlar

| Komut | Açıklama |
|-------|---------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run dev:api` | Local Express API (port 3001) |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Production build'i lokal preview |
| `npm run lint` | ESLint |

## Yapı

```
.
├── api/[...path].js       # Vercel serverless router (tüm /api/* istekleri buradan geçer)
├── server/api/            # Endpoint handlerları (auth, blog, contact, content, youtube vb.)
│   └── _lib/              # Yardımcılar (auth, cors, csrf, mongodb, rateLimit, sanitize)
├── src/
│   ├── pages/             # Route sayfaları (Home, Blog, Videolar, Admin vb.)
│   ├── components/        # UI bileşenleri
│   ├── hooks/             # useSEO, useSiteSettings
│   └── api.js             # Frontend → backend API client
├── public/                # Statik dosyalar (favicon, manifest, sw.js, robots, og-image)
└── vercel.json            # Cron + rewrites + güvenlik header'ları
```

## Önemli Yapılandırma

### YouTube Data API
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → YouTube Data API v3 etkinleştir
2. API Key oluştur, `.env`'ye `YOUTUBE_API_KEY=...` ekle
3. Admin → Site Ayarları → YouTube Channel ID veya Handle gir
4. Admin → Site Ayarları → "YouTube Yenile" butonuna bas (10 dk'da bir otomatik tazelenir)

### Newsletter Double Opt-In
- Kullanıcı abone olunca onay e-postası gönderilir
- 7 gün içinde onaylanmazsa kayıt `pending` kalır
- `NEWSLETTER_SECRET` env tanımlı değilse `JWT_SECRET`'a fallback

### GA4
- `VITE_GA_ID` env'inde Measurement ID (frontend gtag için)
- Admin panel analitik widget'ı için (server-side): `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`

### Vercel Cron
`vercel.json` her gün 06:00 UTC'de `/api/reminders?action=check` çağırır.

## Güvenlik

- `.env` git'e commit edilmemeli (`.gitignore`'da). **Geçmişte commit edildiyse `git filter-repo` ile temizle, tüm secret'ları rotate et.**
- Production'da en az 32 karakter random `JWT_SECRET` kullan
- `ALLOWED_ORIGINS`'i sadece kendi domain'lerini içerecek şekilde sınırla
- Admin parolasını ilk login'den sonra hemen değiştir (Admin → Site Ayarları → Şifre Değiştir)

## Lisans

Özel kullanım — tüm hakları saklıdır.
