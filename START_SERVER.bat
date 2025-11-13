@echo off
title LetsBunk Server - Client-Side Face Verification v2.0
color 0A

echo.
echo ========================================
echo   LETSBUNK SERVER v2.0
echo   Client-Side Face Verification
echo ========================================
echo.

echo [INFO] Stopping any running Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Previous server stopped
    timeout /t 2 /nobreak >nul
) else (
    echo [OK] No previous server running
)

echo.
echo [INFO] Starting server...
echo.
echo ========================================
echo   SERVER LOGS
echo ========================================
echo.

cd server
node index.js

echo.
echo ========================================
echo   SERVER STOPPED
echo ========================================
echo.
pause
