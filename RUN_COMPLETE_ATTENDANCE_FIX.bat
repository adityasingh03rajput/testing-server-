@echo off
echo ========================================
echo COMPLETE ATTENDANCE SYSTEM FIX
echo ========================================
echo.
echo This will:
echo 1. Clear all existing attendance data
echo 2. Generate detailed attendance from April 18 to Oct 20, 2025
echo 3. Include minute-by-minute tracking
echo 4. Mark Sundays and holidays as "Leave"
echo 5. Calculate 75%% threshold per lecture and per day
echo.
echo Press Ctrl+C to cancel, or
pause

cd server

echo.
echo Step 1: Seeding complete attendance history...
echo ========================================
node seed-complete-attendance-history.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Failed to seed attendance data
    echo Make sure MongoDB is running!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ ATTENDANCE SYSTEM FIX COMPLETE!
echo ========================================
echo.
echo What's been fixed:
echo ✓ Leave detection (Sundays + holidays)
echo ✓ Minute-by-minute attendance tracking
echo ✓ 75%% threshold per lecture
echo ✓ 75%% threshold per day
echo ✓ Detailed history from April 18 to Oct 20, 2025
echo ✓ Admin panel shows detailed breakdown
echo ✓ Calendar shows complete history
echo.
echo Next steps:
echo 1. Start server: npm start
echo 2. Login as student: 0246CS241001 / aditya
echo 3. Check Calendar for detailed history
echo 4. Admin panel: Click student name for report
echo.
pause
