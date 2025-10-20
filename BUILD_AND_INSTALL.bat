@echo off
echo ========================================
echo BUILDING APK AND INSTALLING
echo ========================================
echo.

echo Step 1: Cleaning previous builds...
cd android
call gradlew clean
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Clean failed
    pause
    exit /b 1
)

echo.
echo Step 2: Building APK...
echo This may take 5-10 minutes...
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ APK built successfully!
echo Location: android\app\build\outputs\apk\release\app-release.apk

echo.
echo Step 3: Checking for connected devices...
adb devices

echo.
echo Step 4: Installing APK...
adb install -r app\build\outputs\apk\release\app-release.apk
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Installation failed
    echo Make sure:
    echo 1. USB debugging is enabled
    echo 2. Device is connected
    echo 3. You authorized the computer on your device
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ APK INSTALLED SUCCESSFULLY!
echo ========================================
echo.
echo The app should now be on your device
echo Look for "Attendance App" icon
echo.
pause
