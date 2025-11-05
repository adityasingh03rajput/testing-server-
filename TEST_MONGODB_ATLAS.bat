@echo off
echo ========================================
echo Testing MongoDB Atlas Connection
echo ========================================
echo.

cd server
call npm run test-db

echo.
echo ========================================
echo.
pause
