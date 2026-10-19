@echo off
rem Maison Kit - yonetim paneli parolasini sifirlar (XML anahtari ve diger ayarlar korunur).
cd /d "%~dp0"
echo.
echo Yeni yonetim paneli parolasini yazin (en az 10 karakter).
set /p ADMINPW=Yeni parola: 
call npx tsx scripts/admin-hash.ts "%ADMINPW%" > .env.yeni
if errorlevel 1 (del .env.yeni & pause & exit /b 1)
if exist .env findstr /v /b /c:"ADMIN_PASSWORD_HASH=" /c:"ADMIN_SESSION_SECRET=" .env >> .env.yeni
move /y .env.yeni .env >nul
echo.
echo Parola degistirildi. Site penceresini kapatip canli.bat ile yeniden acin.
pause
