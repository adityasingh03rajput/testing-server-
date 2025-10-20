@echo off
cls
echo ========================================
echo QUICK APK BUILD AND INSTALL
echo ========================================
echo.
echo Choose build type:
echo 1. Debug APK (Fast - 2-3 minutes)
echo 2. Release APK (Optimized - 5-10 minutes)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" goto debug
if "%choice%"=="2" goto release
echo Invalid choice
pause
exit /b 1

:debug
echo.
echo Building DEBUG APK...
cd android
call gradlew assembleDebug
if %ERRORLEVEL% NEQ 0 goto error
set APK_PATH=app\build\outputs\apk\debug\app-debug.apk
goto install

:release
echo.
echo Building RELEASE APK...
cd android
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 goto error
set APK_PATH=app\build\outputs\apk\release\app-release.apk
goto install

:install
echo.
echo ✅ Build successful!
echo APK: %APK_PATH%
echo.
echo Checking for connected device...
adb devices
echo.
set /p install="Install on device? (y/n): "
if /i "%install%"=="y" (
    echo Installing...
    adb install -r %APK_PATH%
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Installation failed
        echo.
        echo Troubleshooting:
        echo 1. Enable USB debugging on your device
        echo 2. Connect device via USB
        echo 3. Accept "Allow USB debugging" prompt on device
        echo 4. Run: adb devices
        echo.
        pause
        exit /b 1
    )
    echo.
    echo ========================================
    echo ✅ APP INSTALLED SUCCESSFULLY!
    echo ========================================
    echo.
    echo Open "Attendance App" on your device
) else (
    echo.
    echo APK saved at: android\%APK_PATH%
    echo You can manually install it
)
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo ❌ BUILD FAILED
echo ========================================
echo.
echo Common fixes:
echo 1. Run: npm install
echo 2. Delete android\.gradle folder
echo 3. Run: cd android ^&^& gradlew clean
echo 4. Check if Java JDK is installed
echo.
pause
exit /b 1
