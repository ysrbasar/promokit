@echo off
rem Maison Kit — yerel kurulum (Windows). Gerekli: Node.js 20+ (https://nodejs.org)
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kurun. & pause & exit /b 1)
call npm install || (pause & exit /b 1)
call npm run build || (pause & exit /b 1)
echo Site aciliyor: http://localhost:3000  (durdurmak icin Ctrl+C)
start "" http://localhost:3000
call npm start
