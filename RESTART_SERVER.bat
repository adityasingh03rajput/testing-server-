@echo off
echo ========================================
echo RESTARTING SERVER
echo ========================================
echo.

echo Killing any running Node processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Starting server...
cd server
start cmd /k "npm start"

echo.
echo ========================================
echo Server restarted!
echo ========================================
echo.
echo Check the new window for server logs
pause
