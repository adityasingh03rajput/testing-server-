@echo off
echo ========================================
echo   SEEDING ATTENDANCE DATA
echo ========================================
echo.
echo This will populate the database with sample attendance records
echo for testing the new multi-level drill-down views.
echo.
echo Data to be created:
echo - 5 students (CSE Semester 3)
echo - Last 30 days of attendance
echo - 6 lectures per day
echo - Detailed time tracking in seconds
echo - Verification events
echo.
pause
echo.
echo Starting seed process...
node seed-attendance-data.js
echo.
pause
