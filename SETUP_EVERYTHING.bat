@echo off
color 0A
echo ========================================
echo   COLLEGE MANAGEMENT SYSTEM SETUP
echo ========================================
echo.
echo This will install everything you need!
echo.
pause

echo.
echo [1/3] Installing Server Dependencies...
echo ========================================
cd server
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install server dependencies
        pause
        exit /b 1
    )
    echo Server dependencies installed successfully!
) else (
    echo Server dependencies already installed.
)
cd ..

echo.
echo [2/3] Installing Admin Panel Dependencies...
echo ========================================
cd admin-panel
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install admin panel dependencies
        pause
        exit /b 1
    )
    echo Admin panel dependencies installed successfully!
) else (
    echo Admin panel dependencies already installed.
)
cd ..

echo.
echo [3/3] Checking MongoDB...
echo ========================================
sc query MongoDB >nul 2>&1
if errorlevel 1 (
    echo WARNING: MongoDB service not found
    echo The system will work with in-memory storage
    echo For persistent storage, install MongoDB from:
    echo https://www.mongodb.com/try/download/community
) else (
    echo MongoDB service found!
)

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Start the server: cd server ^&^& node index.js
echo 2. Start admin panel: cd admin-panel ^&^& npm start
echo 3. Build mobile app: cd .. ^&^& npx react-native run-android
echo.
echo Or use the quick start scripts:
echo - server\server_start.bat
echo - admin-panel\start-admin.bat
echo.
echo Read ADMIN_PANEL_QUICKSTART.md for detailed instructions!
echo.
pause
