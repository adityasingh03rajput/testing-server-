@echo off
echo ========================================
echo Building Android APK (Fixed)
echo ========================================
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
    echo.
    
    REM Step 6: Install APK
    echo Step 6: Installing APK on device...
    echo ========================================
    adb install -r "app-release-latest.apk"
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo SUCCESS! APK installed on device
        echo ========================================
    ) else (
        echo.
        echo ========================================
        echo APK built but installation failed
        echo Please install manually: app-release-latest.apk
        echo ========================================
    )
) else (
    echo ERROR: APK file not found!
    echo Build may have failed.
)

echo.
echo Build process completed.
pause
