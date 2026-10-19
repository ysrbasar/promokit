@echo off
rem PromoKit - canli takip: siteyi gelistirme modunda acar, her dakika GitHub'dan guncelleme ceker.
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
rem Normal kod degisiklikleri acik siteye kendiliginden yansir; site yalnizca paketler veya ayarlar degisince yeniden baslatilir
git diff --quiet %OLD% %NEW% -- package-lock.json next.config.ts src/instrumentation.ts src/instrumentation-node.ts && goto hot
echo [%time%] Paket guncellemesi alindi, site yeniden baslatiliyor (1 dakika surebilir)...
call npm install
call :restart
echo [%time%] Hazir. Sayfayi yenileyin.
goto loop
:hot
echo [%time%] Guncelleme alindi. Sayfayi yenileyin.
goto loop

rem Site penceresini kapatir, eski derleme onbellegini (.next) siler ve siteyi yeniden acar.
rem Onbellek silinmezse guncellemeden sonra "ENOENT ... vendor-chunks" hatasi gorulebilir.
:restart
taskkill /FI "WINDOWTITLE eq PromoKit - site*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Nadide Kit - site*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Maison Kit - site*" /T /F >nul 2>nul
rem 3000-3005 portlarinda kalmis eski site sunuculari da kapatilir (yoksa yeni site baska porta kayar)
for %%P in (3000 3001 3002 3003 3004 3005) do for /f "tokens=5" %%I in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do taskkill /PID %%I /T /F >nul 2>nul
timeout /t 2 /nobreak >nul
if exist .next rmdir /s /q .next
start "PromoKit - site" cmd /k "npm run dev"
exit /b 0
