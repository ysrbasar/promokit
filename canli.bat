@echo off
rem Nadide Kit - canli takip: siteyi gelistirme modunda acar, her dakika GitHub'dan guncelleme ceker.
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
findstr /b /c:"IPRO_XML_KEY=" .env >nul 2>nul && goto run2
echo.
echo ipromosyon XML anahtarini girin (bos birakirsaniz otomatik katalog guncellemesi kapali kalir):
set /p IPROKEY=Anahtar: 
if not "%IPROKEY%"=="" (>>.env echo IPRO_XML_KEY=%IPROKEY%)
:run2
call :restart
timeout /t 10 /nobreak >nul
start "" http://localhost:3000
echo.
echo Site: http://localhost:3000  ^|  Yonetim: http://localhost:3000/admin
echo Bu pencere her dakika guncellemeleri kontrol eder. Kapatirsaniz otomatik guncelleme durur.
:loop
timeout /t 60 /nobreak >nul
for /f %%h in ('git rev-parse HEAD') do set OLD=%%h
git pull --ff-only -q
for /f %%h in ('git rev-parse HEAD') do set NEW=%%h
if "%OLD%"=="%NEW%" goto loop
echo [%time%] Guncelleme alindi, site yeniden baslatiliyor...
git diff --quiet %OLD% %NEW% -- package-lock.json || call npm install
call :restart
echo [%time%] Hazir. Sayfayi yenileyin.
goto loop

rem Site penceresini kapatir, eski derleme onbellegini (.next) siler ve siteyi yeniden acar.
rem Onbellek silinmezse guncellemeden sonra "ENOENT ... vendor-chunks" hatasi gorulebilir.
:restart
taskkill /FI "WINDOWTITLE eq Nadide Kit - site*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Maison Kit - site*" /T /F >nul 2>nul
timeout /t 2 /nobreak >nul
if exist .next rmdir /s /q .next
start "Nadide Kit - site" cmd /k "npm run dev"
exit /b 0
