#!/usr/bin/env bash
# Maison Kit — yerel kurulum (macOS / Linux). Gerekli: Node.js 20+ (https://nodejs.org)
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js bulunamadı. https://nodejs.org adresinden LTS sürümünü kurun."; exit 1; }
npm install
npm run build
echo "Site açılıyor: http://localhost:3000  (durdurmak için Ctrl+C)"
npm start
