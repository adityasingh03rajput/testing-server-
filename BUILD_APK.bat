@echo off
echo ========================================
echo Building Android APK
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "android" (
    echo ERROR: android folder not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Java is installed
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java is not installed!
    echo Please install Java JDK 11 or higher
    pause
    exit /b 1
)

echo Step 1: Installing dependencies...
echo ========================================
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Cleaning previous builds...
echo ========================================
cd android
call gradlew clean
cd ..

echo.
echo Step 3: Building Release APK...
echo ========================================
echo This may take 5-10 minutes...
echo.

cd android
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    echo Check the error messages above.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK Location:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
echo APK Size:
for %%A in (android\app\build\outputs\apk\release\app-release.apk) do echo %%~zA bytes
echo.
echo Next Steps:
echo 1. Test the APK on a device
echo 2. Sign the APK for production (if needed)
echo 3. Distribute to users
echo.
pause
