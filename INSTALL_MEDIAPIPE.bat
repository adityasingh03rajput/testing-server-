@echo off
echo ========================================
echo Installing MediaPipe Dependencies
echo ========================================
echo.

echo Step 1: Installing npm packages...
echo ========================================
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo MediaPipe is now installed.
echo.
echo Next steps:
echo 1. Start the server: npm start
echo 2. MediaPipe will auto-initialize
echo 3. Test face verification with liveness detection
echo.
echo Features enabled:
echo   - Face Detection
echo   - Face Matching  
echo   - Liveness Detection (Anti-Spoofing)
echo   - 3D Face Mesh
echo.
pause
