@echo off
echo ========================================
echo WiFi-Based Attendance System Test
echo ========================================
echo.
echo This script tests the WiFi attendance system endpoints
echo and validates that the system works correctly.
echo.
echo Testing server: https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
echo.
pause

node test-wifi-system.js

echo.
echo ========================================
echo Test Complete
echo ========================================
echo.
echo If all tests passed, the WiFi system is ready!
echo You can now:
echo 1. Configure classroom BSSIDs in the admin panel
echo 2. Test with the mobile app
echo 3. Monitor WiFi-based attendance
echo.
pause