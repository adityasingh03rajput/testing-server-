@echo off
echo ========================================
echo SERVER HEALTH CHECK
echo ========================================
echo.

echo 1. Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    ✅ MongoDB is running
) else (
    echo    ❌ MongoDB is NOT running
    echo    Start MongoDB first!
)

echo.
echo 2. Checking if Node server is running...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    ✅ Node server is running
) else (
    echo    ❌ Node server is NOT running
)

echo.
echo 3. Checking server connection...
curl -s http://localhost:3000/api/health >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo    ✅ Server is responding
) else (
    echo    ❌ Server is not responding
)

echo.
echo 4. Testing MongoDB connection...
cd server
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/attendance_app', {serverSelectionTimeoutMS: 3000}).then(() => {console.log('✅ MongoDB connection OK'); process.exit(0);}).catch(err => {console.log('❌ MongoDB connection failed:', err.message); process.exit(1);});"

echo.
echo ========================================
echo Health check complete
echo ========================================
pause
