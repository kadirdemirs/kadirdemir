#!/usr/bin/env bash
# Vercel production env değişkenlerini .env dosyasından yükler.
# Kullanım: bash scripts/setup-vercel-env.sh
#
# Önce: VAPID anahtarlarını üret →
#   npx web-push generate-vapid-keys
# IndexNow key üret →
#   node -e "console.log(require('crypto').randomUUID().replace(/-/g,''))"
# Bunları .env dosyasına yaz, sonra bu scripti çalıştır.
set -e

if [ ! -f ".env" ]; then
  echo "❌ .env dosyası bulunamadı. Önce .env.example'ı .env olarak kopyala ve doldur."
  exit 1
fi

echo "🔑 Vercel'e env değişkenleri ekleniyor (production)…"

add_env() {
  local KEY="$1"
  local VAL
  VAL=$(grep "^${KEY}=" .env | cut -d'=' -f2- | tr -d '\r')
  if [ -z "$VAL" ] || [[ "$VAL" == buraya* ]]; then
    echo "  ⏭️  $KEY atlandı (boş veya doldurulmamış)"
    return
  fi
  echo "$VAL" | npx vercel env add "$KEY" production --yes 2>/dev/null \
    && echo "  ✅ $KEY" \
    || echo "  ⚠️  $KEY zaten var veya eklenemedi"
}

add_env VAPID_PUBLIC_KEY
add_env VAPID_PRIVATE_KEY
add_env INDEXNOW_KEY

echo ""
echo "✅ Tamamlandı. Vercel'de yeni deployment başlat:"
echo "   npx vercel --prod"
