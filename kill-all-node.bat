@echo off
echo ========================================
echo   Killing All Node.js Processes
echo ========================================
echo.

echo Checking for Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I /N "node.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo Found Node.js processes. Killing them...
    taskkill /F /IM node.exe
    echo.
    echo ✅ All Node.js processes killed!
) else (
    echo No Node.js processes found.
)

echo.
echo You can now restart:
echo   - Server: cd server ^&^& node index.js
echo   - Admin Panel: cd admin-panel ^&^& npm start
echo.
pause
