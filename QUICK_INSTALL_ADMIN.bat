@echo off
title College Attendance Admin Panel - Quick Installer Builder
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   College Attendance Admin Panel - Installer Builder      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo This will create a Windows installer (.exe) for the admin panel
echo that can be installed on any Windows PC.
echo.
echo ════════════════════════════════════════════════════════════
echo.

:MENU
echo Please select an option:
echo.
echo [1] Build Installer (Full Process)
echo [2] Quick Build (Skip dependency check)
echo [3] Test Admin Panel Locally
echo [4] View Build Output
echo [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto BUILD_FULL
if "%choice%"=="2" goto BUILD_QUICK
if "%choice%"=="3" goto TEST_LOCAL
if "%choice%"=="4" goto VIEW_OUTPUT
if "%choice%"=="5" goto EXIT
goto MENU

:BUILD_FULL
echo.
echo ════════════════════════════════════════════════════════════
echo Starting Full Build Process...
echo ════════════════════════════════════════════════════════════
echo.

cd admin-panel

echo [Step 1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    goto MENU
)
echo ✅ Node.js is installed
echo.

echo [Step 2/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ ERROR: Failed to install dependencies
    pause
    goto MENU
)
echo ✅ Dependencies installed
echo.

echo [Step 3/5] Installing Electron Builder...
call npm install --save-dev electron@^27.0.0 electron-builder@^24.6.4 electron-squirrel-startup@^1.0.0
if errorlevel 1 (
    echo ❌ ERROR: Failed to install Electron Builder
    pause
    goto MENU
)
echo ✅ Electron Builder installed
echo.

echo [Step 4/5] Configuring build...
copy /Y package-electron.json package.json >nul
echo ✅ Build configured
echo.

echo [Step 5/5] Building Windows installer...
echo This may take 5-10 minutes...
call npm run build-win
if errorlevel 1 (
    echo ❌ ERROR: Build failed
    pause
    goto MENU
)

cd ..

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ BUILD SUCCESSFUL!
echo ════════════════════════════════════════════════════════════
echo.
echo Installer created at:
echo admin-panel\dist\College Attendance Admin Setup 1.0.0.exe
echo.
echo File size: ~150MB
echo.
echo You can now:
echo  ✓ Install on this PC
echo  ✓ Share with others
echo  ✓ Install on any Windows PC
echo.
echo ════════════════════════════════════════════════════════════
pause
goto MENU

:BUILD_QUICK
echo.
echo ════════════════════════════════════════════════════════════
echo Starting Quick Build...
echo ════════════════════════════════════════════════════════════
echo.

cd admin-panel
copy /Y package-electron.json package.json >nul
call npm run build-win
cd ..

echo.
echo ✅ Quick build complete!
echo.
pause
goto MENU

:TEST_LOCAL
echo.
echo ════════════════════════════════════════════════════════════
echo Testing Admin Panel Locally...
echo ════════════════════════════════════════════════════════════
echo.

cd admin-panel
echo Starting Electron app...
call npm start
cd ..

pause
goto MENU

:VIEW_OUTPUT
echo.
echo ════════════════════════════════════════════════════════════
echo Opening build output folder...
echo ════════════════════════════════════════════════════════════
echo.

if exist "admin-panel\dist" (
    start explorer "admin-panel\dist"
    echo ✅ Folder opened
) else (
    echo ❌ Build output folder not found
    echo Please build the installer first (Option 1)
)
echo.
pause
goto MENU

:EXIT
echo.
echo Thank you for using College Attendance Admin Panel Builder!
echo.
exit

