@echo off
color 0A
echo ========================================
echo   RESTARTING SERVER
echo ========================================
echo.

echo [1/3] Killing existing Node.js processes...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No existing processes found.
) else (
    echo Processes killed.
)

echo.
echo [2/3] Waiting for cleanup...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting fresh server...
echo ========================================
cd /d "%~dp0server"
echo.
echo Server starting on http://localhost:3000
echo Press Ctrl+C to stop
echo.
node index.js
