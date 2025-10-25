@echo off
echo ========================================
echo College Attendance Admin Panel
echo Building Windows Installer (.exe)
echo ========================================
echo.

cd admin-panel

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Electron Builder...
call npm install --save-dev electron@^27.0.0 electron-builder@^24.6.4
if errorlevel 1 (
    echo ERROR: Failed to install Electron Builder
    pause
    exit /b 1
)

echo.
echo [3/4] Copying package configuration...
copy /Y package-electron.json package.json
if errorlevel 1 (
    echo ERROR: Failed to copy package configuration
    pause
    exit /b 1
)

echo.
echo [4/4] Building Windows installer...
call npm run build-win
if errorlevel 1 (
    echo ERROR: Failed to build installer
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ BUILD SUCCESSFUL!
echo ========================================
echo.
echo Installer created at:
echo admin-panel\dist\College Attendance Admin Setup 1.0.0.exe
echo.
echo You can now:
echo 1. Run the installer to install the admin panel
echo 2. Share the installer with others
echo 3. Install on any Windows PC
echo.
echo ========================================
pause
