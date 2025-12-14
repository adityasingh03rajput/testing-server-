@echo off
echo ========================================
echo Verifying Build Readiness
echo ========================================
echo.

set "all_good=1"

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found or not in PATH
    set "all_good=0"
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
)

REM Check Java
echo Checking Java...
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Java not found or not in PATH
    set "all_good=0"
) else (
    echo ✅ Java: Found and working
)

REM Check Android SDK
echo Checking Android SDK...
if not exist "C:\Users\Victus\AppData\Local\Android\Sdk" (
    echo ❌ Android SDK not found at expected location
    set "all_good=0"
) else (
    echo ✅ Android SDK: Found at C:\Users\Victus\AppData\Local\Android\Sdk
)

REM Check node_modules
echo Checking dependencies...
if not exist "node_modules" (
    echo ❌ node_modules not found - run 'npm install'
    set "all_good=0"
) else (
    echo ✅ Dependencies: node_modules exists
)

REM Check package.json
echo Checking package.json...
if not exist "package.json" (
    echo ❌ package.json not found
    set "all_good=0"
) else (
    echo ✅ Package.json: Found
)

REM Check Android project structure
echo Checking Android project...
if not exist "android\app\build.gradle" (
    echo ❌ Android build.gradle not found
    set "all_good=0"
) else (
    echo ✅ Android project: Structure looks good
)

REM Check keystore
echo Checking keystore...
if not exist "android\app\debug.keystore" (
    echo ❌ Debug keystore not found
    set "all_good=0"
) else (
    echo ✅ Keystore: Debug keystore found
)

REM Check main app file
echo Checking main app file...
if not exist "App.js" (
    echo ❌ App.js not found
    set "all_good=0"
) else (
    echo ✅ App.js: Found
)

REM Check index.js
echo Checking entry point...
if not exist "index.js" (
    echo ❌ index.js not found
    set "all_good=0"
) else (
    echo ✅ index.js: Found
)

echo.
echo ========================================
if "%all_good%"=="1" (
    echo ✅ ALL CHECKS PASSED!
    echo Ready to build APK
    echo.
    echo Next steps:
    echo 1. Run BUILD_APK_CLEAN.bat to build the APK
    echo 2. Or run the individual commands manually
) else (
    echo ❌ SOME CHECKS FAILED!
    echo Please fix the issues above before building
)
echo ========================================
echo.

pause