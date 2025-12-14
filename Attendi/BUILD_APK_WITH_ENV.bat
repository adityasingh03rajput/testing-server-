@echo off
echo ========================================
echo Building Android APK with Environment Setup
echo ========================================
echo.

REM Set Android SDK environment variables
echo Setting up Android SDK environment variables...
echo ========================================

REM Read SDK path from local.properties
set SDK_DIR=C:\Users\Prathmesh\.android\SDK
set ANDROID_HOME=%SDK_DIR%
set ANDROID_SDK_ROOT=%SDK_DIR%

REM Add Android SDK tools to PATH
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\build-tools;%PATH%"

REM Set Java environment (if needed)
REM set JAVA_HOME=C:\Program Files\Java\jdk-11.0.x
REM set PATH=%JAVA_HOME%\bin;%PATH%

echo ANDROID_HOME: %ANDROID_HOME%
echo ANDROID_SDK_ROOT: %ANDROID_SDK_ROOT%
echo.

REM Verify ADB is available
echo Verifying ADB availability...
adb version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ ADB is available
    adb version
) else (
    echo ❌ ADB not found in PATH
    echo Adding platform-tools to PATH...
    set "PATH=%ANDROID_HOME%\platform-tools;%PATH%"
    adb version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ ADB now available
    ) else (
        echo ❌ ADB still not available - check Android SDK installation
    )
)
echo.

REM Step 1: Stop all Gradle daemons
echo Step 1: Stopping Gradle daemons...
echo ========================================
cd android
call gradlew --stop
cd ..
echo.

REM Step 2: Kill any Java/ADB processes that might lock files
echo Step 2: Killing processes that might lock APK...
echo ========================================
taskkill /F /IM adb.exe 2>nul
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

REM Step 3: Clean old APK files
echo Step 3: Cleaning old APK files...
echo ========================================
if exist "android\app\build\outputs\apk\release\*.apk" (
    del /F /Q "android\app\build\outputs\apk\release\*.apk" 2>nul
)
if exist "app-release-*.apk" (
    del /F /Q "app-release-*.apk" 2>nul
)
echo.

REM Step 4: Build the APK
echo Step 4: Building Release APK...
echo ========================================
echo This may take 2-3 minutes...
echo.
cd android
call gradlew assembleRelease --no-daemon
set BUILD_RESULT=%ERRORLEVEL%
cd ..
echo.

REM Step 5: Copy APK immediately (even if packaging failed)
echo Step 5: Copying APK to root directory...
echo ========================================
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    copy /Y "android\app\build\outputs\apk\release\app-release.apk" "app-release-latest.apk" >nul
    echo APK copied successfully to: app-release-latest.apk
    
    REM Get APK size
    for %%A in ("app-release-latest.apk") do set APK_SIZE=%%~zA
    echo APK Size: %APK_SIZE% bytes
    echo.
    
    REM Step 6: Install APK with better error handling
    echo Step 6: Installing APK on device...
    echo ========================================
    
    REM Check if device is connected
    adb devices | findstr "device" >nul
    if %ERRORLEVEL% EQU 0 (
        echo Device detected, installing APK...
        adb install -r "app-release-latest.apk"
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo ========================================
            echo ✅ SUCCESS! APK installed on device
            echo ========================================
        ) else (
            echo.
            echo ========================================
            echo ❌ APK built but installation failed
            echo Please install manually: app-release-latest.apk
            echo ========================================
        )
    ) else (
        echo ❌ No Android device detected
        echo Please connect your device and enable USB debugging
        echo APK available for manual install: app-release-latest.apk
    )
) else (
    echo ❌ ERROR: APK file not found!
    echo Build may have failed.
    if %BUILD_RESULT% NEQ 0 (
        echo Build failed with error code: %BUILD_RESULT%
    )
)

echo.
echo ========================================
echo Build process completed
echo ========================================
echo Environment Variables Set:
echo - ANDROID_HOME: %ANDROID_HOME%
echo - ANDROID_SDK_ROOT: %ANDROID_SDK_ROOT%
echo - ADB Path: %ANDROID_HOME%\platform-tools\adb.exe
echo ========================================
pause