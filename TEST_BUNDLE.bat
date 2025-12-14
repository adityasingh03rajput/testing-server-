@echo off
echo ========================================
echo Testing React Native Bundle Creation
echo ========================================
echo.

REM Set environment variables
set ANDROID_HOME=C:\Users\Victus\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\Victus\AppData\Local\Android\Sdk

echo Creating test bundle...
echo This will verify that the JavaScript can be bundled properly
echo.

REM Create bundle directory if it doesn't exist
if not exist "test-bundle" mkdir test-bundle

REM Try to create a bundle
npx expo export --platform android --output-dir test-bundle --clear

if %ERRORLEVEL% EQU 0 (
    echo ✅ Bundle creation successful!
    echo JavaScript code can be bundled properly
    
    REM Clean up test bundle
    if exist "test-bundle" rmdir /s /q "test-bundle"
) else (
    echo ❌ Bundle creation failed!
    echo There may be JavaScript errors in your code
    echo Please check the output above for details
)

echo.
pause