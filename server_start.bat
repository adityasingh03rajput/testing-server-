@echo off
echo ========================================
echo   SDUI Countdown Timer Server
echo ========================================
echo.
echo Starting server...
echo Server URL: http://192.168.107.31:3000
echo Config API: http://192.168.107.31:3000/api/config
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.
cd server
node index.js
