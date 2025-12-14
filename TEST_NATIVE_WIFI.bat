@echo off
echo Testing Native WiFi Module Integration...
echo ========================================
echo.

echo Building APK with native WiFi module...
call BUILD_APK_FIXED.bat

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ APK build failed - cannot test native WiFi
    pause
    exit /b 1
)

echo.
echo Installing APK on device...
adb install -r android\app\build\outputs\apk\release\app-release.apk

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ APK installation failed
    pause
    exit /b 1
)

echo.
echo ✅ APK installed successfully
echo.
echo 📱 Now test the native WiFi integration:
echo    1. Open the app on your device
echo    2. Go to teacher mode
echo    3. Check if WiFi status shows correctly
echo    4. Look for BSSID detection in logs
echo.
echo 📋 To view logs, run:
echo    adb logcat *:E ReactNative:V WifiModule:V
echo.
echo Press any key to start log monitoring...
pause > nul

echo.
echo 📊 Monitoring logs (Ctrl+C to stop)...
adb logcat *:E ReactNative:V WifiModule:V