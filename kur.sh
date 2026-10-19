#!/usr/bin/env bash
# Nadide Kit — yerel kurulum (macOS / Linux). Gerekli: Node.js 20+ (https://nodejs.org)
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js bulunamadı. https://nodejs.org adresinden LTS sürümünü kurun."; exit 1; }
npm install
if [ ! -f .env ]; then
  read -r -s -p "Yönetim paneli parolası (en az 10 karakter): " PW; echo
  npx tsx scripts/admin-hash.ts "$PW" > .env
fi
if ! grep -q '^IPRO_XML_KEY=' .env; then
  read -r -p "ipromosyon XML anahtarı (boş: otomatik güncelleme kapalı): " KEY
  if [ -n "$KEY" ]; then echo "IPRO_XML_KEY=$KEY" >> .env; fi
fi
npm run build
echo "Site: http://localhost:3000  Yönetim: http://localhost:3000/admin  (durdurmak için Ctrl+C)"
npm start
