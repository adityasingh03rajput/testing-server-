@echo off
echo ========================================
echo CONNECTION FIX SCRIPT
echo ========================================
echo.

echo Step 1: Killing any existing Node processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✅ Killed existing Node processes
) else (
    echo ℹ️  No Node processes running
)
echo.

echo Step 2: Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo ✅ MongoDB is running
) else (
    echo ⚠️  MongoDB not running, starting...
    net start MongoDB
)
echo.

echo Step 3: Your IP Address:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo ✅ IP: %%a
)
echo.

echo Step 4: Starting server...
cd server
start "Attendance Server" cmd /k "node index.js"
echo ✅ Server starting in new window...
echo.

timeout /t 3 >nul

echo Step 5: Testing server...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Server is responding!
) else (
    echo ⚠️  Server may still be starting...
)
echo.

echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Check the server window for "Server running on port 3000"
echo 2. Make sure your phone is on the SAME WiFi
echo 3. In Expo app, shake device and press "Reload"
echo 4. Check app console for "Connected to server"
echo.
echo ========================================
pause
