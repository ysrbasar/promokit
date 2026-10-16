@echo off
rem Maison Kit - canli takip: siteyi gelistirme modunda acar, her dakika GitHub'dan guncelleme ceker.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js bulunamadi: https://nodejs.org & pause & exit /b 1)
where git >nul 2>nul || (echo Git bulunamadi: https://git-scm.com/download/win & pause & exit /b 1)
git pull --ff-only
call npm install
if exist .env goto run
echo.
echo Yonetim paneli icin bir parola belirleyin (en az 10 karakter).
set /p ADMINPW=Parola: 
call npx tsx scripts/admin-hash.ts "%ADMINPW%" > .env
if errorlevel 1 (del .env & pause & exit /b 1)
:run
start "Maison Kit - site" cmd /k "npm run dev"
timeout /t 8 /nobreak >nul
start "" http://localhost:3000
echo.
echo Site: http://localhost:3000  ^|  Yonetim: http://localhost:3000/admin
echo Bu pencere her dakika guncellemeleri kontrol eder. Kapatirsaniz otomatik guncelleme durur.
:loop
timeout /t 60 /nobreak >nul
for /f %%h in ('git rev-parse HEAD') do set OLD=%%h
git pull --ff-only -q
for /f %%h in ('git rev-parse HEAD') do set NEW=%%h
if not "%OLD%"=="%NEW%" (
  echo [%time%] Guncelleme alindi. Sayfayi yenileyin.
  git diff --quiet %OLD% %NEW% -- package-lock.json || call npm install
)
goto loop
