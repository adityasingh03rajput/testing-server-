@echo off
echo ========================================
echo BSSID Validation Testing Guide
echo ========================================
echo.
echo This guide will help you test the enhanced BSSID validation system.
echo.
echo STEP 1: Install the Updated APK
echo ========================================
echo The APK has been built with enhanced BSSID validation and permission handling.
echo.
echo APK Location: app-release-bssid-validation.apk
echo Size: ~84MB
echo.
echo To install manually:
echo 1. Enable "Install from Unknown Sources" in Android settings
echo 2. Transfer the APK to your device
echo 3. Tap the APK file to install
echo.
echo OR use ADB if available:
echo adb install -r app-release-bssid-validation.apk
echo.
pause
echo.

echo STEP 2: Test Permission System
echo ========================================
echo The app now has enhanced permission handling for BSSID detection.
echo.
echo What to expect:
echo 1. When you try face verification, it will check WiFi permissions first
echo 2. If permissions are missing, you'll see a clear explanation dialog
echo 3. The app will guide you to grant location permission
echo 4. After granting permission, BSSID detection should work
echo.
echo Key Features Added:
echo - Automatic permission checking before BSSID detection
echo - Clear error messages explaining why permissions are needed
echo - Aggressive permission request with user-friendly explanations
echo - Debug button to test native WiFi module directly
echo.
pause
echo.

echo STEP 3: Test BSSID Detection
echo ========================================
echo The app now shows detailed BSSID information during face verification.
echo.
echo What you'll see:
echo 1. BSSID Status Card showing:
echo    - Current room (from your timetable)
echo    - Expected BSSID (from server configuration)
echo    - Current BSSID (detected from your device)
echo    - Validation status (✅ or ❌)
echo.
echo 2. Clear error messages if validation fails:
echo    - "You are not connected to WiFi" → Enable WiFi
echo    - "Wrong WiFi network" → Connect to classroom WiFi
echo    - "Room not configured" → Contact administrator
echo.
echo 3. Debug features (development mode):
echo    - "🔧 Test Native WiFi" button to test the native module
echo    - Detailed console logs for troubleshooting
echo.
pause
echo.

echo STEP 4: Testing Scenarios
echo ========================================
echo Test these scenarios to verify the system works:
echo.
echo Scenario A: No WiFi Connection
echo 1. Disable WiFi on your device
echo 2. Try face verification
echo 3. Should show: "You are not connected to WiFi"
echo.
echo Scenario B: Wrong WiFi Network
echo 1. Connect to a different WiFi (not classroom WiFi)
echo 2. Try face verification
echo 3. Should show: "You are connected to the wrong WiFi network"
echo.
echo Scenario C: Correct WiFi Network
echo 1. Connect to the classroom WiFi (BSSID: b4:86:18:6f:fb:ec for room A2)
echo 2. Try face verification
echo 3. Should show: "✅ WiFi validated! Initializing camera..."
echo.
echo Scenario D: Permission Issues
echo 1. If BSSID shows "Permission denied" or "Not detected"
echo 2. Tap "🔧 Test Native WiFi" button (in development mode)
echo 3. Check permission status and grant if needed
echo.
pause
echo.

echo STEP 5: Troubleshooting
echo ========================================
echo If BSSID validation still fails:
echo.
echo Problem: "Permission denied" error
echo Solution: 
echo 1. Go to Android Settings → Apps → Attendi → Permissions
echo 2. Enable "Location" permission
echo 3. Restart the app and try again
echo.
echo Problem: "BSSID not available" error
echo Solution:
echo 1. Ensure WiFi is enabled and connected
echo 2. Check if you're connected to a real WiFi network (not mobile hotspot)
echo 3. Try disconnecting and reconnecting to WiFi
echo.
echo Problem: "Room not configured" error
echo Solution:
echo 1. Check if your current lecture room has WiFi BSSID configured
echo 2. Contact administrator to configure room WiFi settings
echo.
echo Problem: Still shows wrong BSSID
echo Solution:
echo 1. Use the "🔧 Test Native WiFi" button to check raw WiFi data
echo 2. Compare with expected BSSID in the status card
echo 3. Verify you're connected to the correct network
echo.
pause
echo.

echo STEP 6: Expected Behavior
echo ========================================
echo When everything works correctly:
echo.
echo 1. Face Verification Screen loads
echo 2. BSSID validation runs automatically
echo 3. Status card shows:
echo    - Room: A2 (or your current lecture room)
echo    - Expected: b4:86:18:6f:fb:ec (or room's configured BSSID)
echo    - Current: b4:86:18:6f:fb:ec (matching expected)
echo    - Status: ✅ with green border
echo.
echo 4. "Verify Face" button becomes enabled
echo 5. Face verification proceeds normally
echo.
echo If BSSID validation fails:
echo - Status card shows ❌ with red border
echo - "Verify Face" button shows "WiFi Required" and is disabled
echo - Clear error message explains the issue
echo - "🔄 Retry WiFi Check" button appears
echo.
pause
echo.

echo ========================================
echo Testing Complete!
echo ========================================
echo.
echo The enhanced BSSID validation system includes:
echo ✅ Automatic permission checking and requests
echo ✅ Clear error messages with specific solutions
echo ✅ Real-time BSSID status display
echo ✅ Debug tools for troubleshooting
echo ✅ Graceful fallback for development/testing
echo.
echo If you encounter any issues:
echo 1. Check the BSSID status card for detailed information
echo 2. Use the debug button to test native WiFi module
echo 3. Verify location permissions are granted
echo 4. Ensure you're connected to the correct classroom WiFi
echo.
echo The system should now properly validate BSSID before allowing face verification!
echo.
pause