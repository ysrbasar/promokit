@echo off
rem PromoKit - ilk kurulum: depoyu indirir ve canli takibi baslatir. Bir kez calistirin.
cd /d "%~dp0"
where git >nul 2>nul || (echo Once Git kurun: https://git-scm.com/download/win & pause & exit /b 1)
where node >nul 2>nul || (echo Once Node.js LTS kurun: https://nodejs.org & pause & exit /b 1)
if exist promokit goto start
echo GitHub hesabinizla giris istenebilir (tarayicida acilir).
git clone -b promokit-site https://github.com/ysrbasar/form360.git promokit
if errorlevel 1 (echo Indirme basarisiz. GitHub girisini kontrol edin. & pause & exit /b 1)
:start
call promokit\canli.bat
