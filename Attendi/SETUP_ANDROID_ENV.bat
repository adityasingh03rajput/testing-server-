@echo off
echo ========================================
echo Setting up Android Development Environment
echo ========================================
echo.

REM Read SDK path from local.properties
echo Reading Android SDK path from local.properties...
set SDK_DIR=C:\Users\Prathmesh\.android\SDK

REM Set Android environment variables
echo Setting Android environment variables...
setx ANDROID_HOME "%SDK_DIR%" /M >nul 2>&1
setx ANDROID_SDK_ROOT "%SDK_DIR%" /M >nul 2>&1

REM Current session variables
set ANDROID_HOME=%SDK_DIR%
set ANDROID_SDK_ROOT=%SDK_DIR%

echo ✅ ANDROID_HOME set to: %ANDROID_HOME%
echo ✅ ANDROID_SDK_ROOT set to: %ANDROID_SDK_ROOT%
echo.

REM Add to PATH (current session)
echo Adding Android tools to PATH (current session)...
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%PATH%

REM Add to system PATH permanently (requires admin)
echo Adding Android tools to system PATH...
echo Note: This requires administrator privileges
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin" /M >nul 2>&1

echo.
echo ========================================
echo Environment Setup Complete!
echo ========================================
echo.
echo Installed paths:
echo - Android SDK: %ANDROID_HOME%
echo - ADB: %ANDROID_HOME%\platform-tools\adb.exe
echo - Gradle: android\gradlew.bat
echo.

REM Test ADB
echo Testing ADB availability...
"%ANDROID_HOME%\platform-tools\adb.exe" version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ ADB is working correctly
    "%ANDROID_HOME%\platform-tools\adb.exe" version
) else (
    echo ❌ ADB test failed
    echo Please check Android SDK installation
)

echo.
echo ========================================
echo Ready to build APK!
echo ========================================
echo.
echo Next steps:
echo 1. Close and reopen Command Prompt/PowerShell
echo 2. Run: .\BUILD_APK_WITH_ENV.bat
echo 3. Or run: .\BUILD_APK_FIXED.bat
echo.
pause