@echo off
echo ========================================
echo Setting up Android Build Environment
echo ========================================
echo.

REM Set Android SDK environment variables
set ANDROID_HOME=C:\Users\Victus\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\Victus\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%PATH%

echo Step 1: Verifying environment...
echo ========================================
echo ANDROID_HOME: %ANDROID_HOME%
echo Node version:
node --version
echo Java version:
java -version
echo.

REM Step 2: Clean previous builds
echo Step 2: Cleaning previous builds...
echo ========================================
if exist "android\.gradle" (
    echo Removing android\.gradle...
    rmdir /s /q "android\.gradle" 2>nul
)
if exist "android\app\build" (
    echo Removing android\app\build...
    rmdir /s /q "android\app\build" 2>nul
)
if exist "android\app\build\outputs\apk\release\*.apk" (
    echo Removing old APK files...
    del /F /Q "android\app\build\outputs\apk\release\*.apk" 2>nul
)
if exist "app-release-*.apk" (
    del /F /Q "app-release-*.apk" 2>nul
)
echo.

REM Step 3: Stop Gradle daemons
echo Step 3: Stopping Gradle daemons...
echo ========================================
cd android
call gradlew --stop
cd ..
echo.

REM Step 4: Kill processes that might interfere
echo Step 4: Killing interfering processes...
echo ========================================
taskkill /F /IM adb.exe 2>nul
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

REM Step 5: Verify React Native setup
echo Step 5: Verifying React Native setup...
echo ========================================
echo Checking if metro is running...
netstat -an | findstr :8081 >nul
if %ERRORLEVEL% EQU 0 (
    echo Metro bundler is running on port 8081
) else (
    echo Metro bundler is not running (good for release build)
)
echo.

echo ========================================
echo Environment setup complete!
echo Ready to build APK
echo ========================================
echo.
echo Run BUILD_APK_CLEAN.bat to build the APK
pause