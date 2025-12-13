@echo off
echo ========================================
echo  Enhanced WiFi BSSID Build and Test
echo ========================================
echo.

echo 📱 Building APK with enhanced WiFi support...
echo.

cd android
call gradlew clean
call gradlew assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.

echo 📲 Installing APK on connected devices...
cd ..

adb devices
echo.

echo Installing on all connected devices...
adb install -r "android\app\build\outputs\apk\release\app-release.apk"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Installation failed!
    pause
    exit /b 1
)

echo.
echo ✅ Installation successful!
echo.

echo 🧪 Running WiFi BSSID test...
echo.
echo To test WiFi BSSID detection:
echo 1. Open the app on your device
echo 2. Go to student mode
echo 3. Check the WiFi status indicator
echo 4. Look at the console logs for detailed information
echo.

echo 📋 For Xiaomi/MIUI devices:
echo 1. WiFi Settings → Advanced → Enhanced Privacy → Disable
echo 2. WiFi Settings → Use randomized MAC → Turn OFF  
echo 3. Settings → Apps → Permissions → Location → Allow all the time
echo 4. For Android 13+: Grant "Nearby WiFi devices" permission
echo.

echo 🔍 To check logs:
echo adb logcat *:E ReactNative:V WifiModule:V
echo.

pause