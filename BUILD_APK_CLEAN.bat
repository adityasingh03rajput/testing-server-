@echo off
echo ========================================
echo Building Android APK (Clean Build)
echo ========================================
echo.

REM Set Android SDK environment variables
set ANDROID_HOME=C:\Users\Victus\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\Victus\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%PATH%

REM Set Gradle options for better performance
set GRADLE_OPTS=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError

echo Step 1: Building Release APK...
echo ========================================
echo This may take 5-10 minutes...
echo.

cd android
call gradlew assembleRelease --no-daemon --stacktrace --info
set BUILD_RESULT=%ERRORLEVEL%
cd ..

echo.
echo Step 2: Checking build result...
echo ========================================

if %BUILD_RESULT% NEQ 0 (
    echo ❌ BUILD FAILED with exit code %BUILD_RESULT%
    echo Check the output above for errors
    pause
    exit /b %BUILD_RESULT%
)

if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo ✅ APK built successfully!
    
    REM Copy APK to root directory with timestamp
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
    set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"
    
    copy /Y "android\app\build\outputs\apk\release\app-release.apk" "app-release-%timestamp%.apk" >nul
    echo APK copied to: app-release-%timestamp%.apk
    
    REM Get APK size
    for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do set "apk_size=%%~zA"
    set /a "apk_size_mb=%apk_size% / 1024 / 1024"
    echo APK size: %apk_size_mb% MB
    
    echo.
    echo Step 3: Installing APK on device...
    echo ========================================
    
    REM Check if device is connected
    adb devices | findstr "device" | findstr -v "List" >nul
    if %ERRORLEVEL% EQU 0 (
        echo Device detected, installing APK...
        adb install -r "android\app\build\outputs\apk\release\app-release.apk"
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo ========================================
            echo ✅ SUCCESS! APK installed on device
            echo ========================================
            echo APK Location: android\app\build\outputs\apk\release\app-release.apk
            echo Backup Copy: app-release-%timestamp%.apk
            echo Size: %apk_size_mb% MB
        ) else (
            echo.
            echo ========================================
            echo ⚠️ APK built but installation failed
            echo Please install manually: app-release-%timestamp%.apk
            echo ========================================
        )
    ) else (
        echo No Android device detected
        echo.
        echo ========================================
        echo ✅ APK built successfully!
        echo ========================================
        echo APK Location: android\app\build\outputs\apk\release\app-release.apk
        echo Backup Copy: app-release-%timestamp%.apk
        echo Size: %apk_size_mb% MB
        echo.
        echo To install on device:
        echo 1. Connect your Android device via USB
        echo 2. Enable USB Debugging
        echo 3. Run: adb install -r app-release-%timestamp%.apk
    )
) else (
    echo ❌ ERROR: APK file not found!
    echo Build may have failed. Check the output above for errors.
)

echo.
echo Build process completed.
pause