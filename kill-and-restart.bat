@echo off
echo ========================================
echo   Killing All Node Processes
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No Node.js processes found.
) else (
    echo All Node.js processes stopped.
)

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Starting Server
echo ========================================
echo.

cd /d "%~dp0server"
echo Starting server on port 3000...
echo.
node index.js
