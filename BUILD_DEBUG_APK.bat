@echo off
echo ========================================
echo BUILDING DEBUG APK (FASTER)
echo ========================================
echo.

echo Cleaning...
cd android
call gradlew clean

echo.
echo Building debug APK...
echo This is faster than release build (2-3 minutes)
call gradlew assembleDebug

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ Debug APK built!
echo Location: android\app\build\outputs\apk\debug\app-debug.apk

echo.
echo Installing on device...
adb install -r app\build\outputs\apk\debug\app-debug.apk

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Installation failed
    echo Connect your device and enable USB debugging
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ DEBUG APK INSTALLED!
echo ========================================
pause
