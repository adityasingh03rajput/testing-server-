@echo off
echo ========================================
echo ASSIGN TEACHERS TO TIMETABLES
echo ========================================
echo.
echo This will assign teachers to all subjects in timetables
echo so teachers can see their schedules in the app
echo.
pause

cd server
node assign-teachers-to-timetable.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Failed to assign teachers
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ SUCCESS!
echo ========================================
echo.
echo Teachers are now assigned to timetables
echo.
echo Test the notifications:
echo 1. Login as teacher: TEACH001 / aditya
echo 2. Go to Schedule tab (bell icon)
echo 3. See today's classes
echo.
pause
