@echo off
cls
echo ========================================
echo BUILD APK - ONE CLICK
echo ========================================
echo.
echo This will:
echo 1. Build debug APK (faster)
echo 2. Install on connected device
echo.
echo Make sure your device is connected with USB debugging enabled
echo.
pause

echo.
echo [1/3] Cleaning previous builds...
cd android
call gradlew clean >nul 2>&1

echo [2/3] Building APK (this takes 2-3 minutes)...
call gradlew assembleDebug

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ BUILD FAILED
    echo.
    echo Try these fixes:
    echo 1. npm install
    echo 2. Delete android\.gradle folder
    echo 3. Restart computer
    echo.
    pause
    exit /b 1
)

echo [3/3] Installing on device...
adb install -r app\build\outputs\apk\debug\app-debug.apk

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ INSTALLATION FAILED
    echo.
    echo Make sure:
    echo - USB debugging is ON
    echo - Device is connected
    echo - You accepted the USB debugging prompt
    echo.
    echo APK saved at: android\app\build\outputs\apk\debug\app-debug.apk
    echo You can manually copy and install it
    echo.
    pause
    exit /b 1
)

cd ..
echo.
echo ========================================
echo ✅ SUCCESS!
echo ========================================
echo.
echo The app is now installed on your device
echo Look for "Attendance App" icon
echo.
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
