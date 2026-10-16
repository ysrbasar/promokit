@echo off
rem Maison Kit - yerel kurulum (Windows). Gerekli: Node.js 20+ (https://nodejs.org)
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kurun. & pause & exit /b 1)
call npm install || (pause & exit /b 1)
if exist .env goto build
echo.
echo Yonetim paneli icin bir parola belirleyin (en az 10 karakter).
set /p ADMINPW=Parola: 
call npx tsx scripts/admin-hash.ts "%ADMINPW%" > .env
if errorlevel 1 (del .env & pause & exit /b 1)
:build
call npm run build || (pause & exit /b 1)
echo.
echo Site: http://localhost:3000   Yonetim paneli: http://localhost:3000/admin
echo Durdurmak icin bu pencereyi kapatin.
start "" http://localhost:3000
call npm start
