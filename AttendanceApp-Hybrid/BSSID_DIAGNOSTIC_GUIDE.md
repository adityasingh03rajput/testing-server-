# BSSID Detection Diagnostic Guide

## Overview
I've added comprehensive BSSID diagnostic tools to help you check if the app is detecting WiFi BSSIDs correctly. The app now has multiple ways to test and monitor WiFi detection.

## Diagnostic Features Added

### 1. 🔍 Check BSSID Button
**Location**: Below the circular timer (next to WiFi bypass button)  
**Visibility**: Development mode and teachers only  
**Function**: Runs comprehensive BSSID detection test

**What it does:**
- Checks if native WiFi module is available
- Verifies location permissions
- Tests WiFi state (enabled/disabled)
- Attempts to detect current BSSID
- Shows detailed results in a popup

**Sample Output:**
```
📶 BSSID Detection Results:

✅ Success: YES
📡 Current BSSID: b4:86:18:6f:fb:ec
📶 SSID: ClassroomWiFi_101
📊 Signal: -45 dBm
🔐 Permissions: Granted
📱 WiFi Enabled: YES
```

### 2. 📶 WiFi Status Display
**Location**: Below the current class info banner  
**Visibility**: Development mode and teachers only  
**Function**: Shows real-time WiFi status

**Status Indicators:**
- 🟢 **Green**: WiFi authorized/detected
- 🔴 **Red**: WiFi failed/not detected
- **BSSID**: Shows current detected BSSID
- **Reason**: Shows error reason if failed
- **Timestamp**: When last checked

### 3. 🧪 WiFi Test Tab
**Location**: Bottom navigation (WiFi Test tab)  
**Visibility**: Students in development mode  
**Function**: Comprehensive testing interface

**Features:**
- **Run Full Test**: Complete diagnostic sequence
- **Quick BSSID Test**: Fast BSSID detection
- **Clear Results**: Reset test history
- **Detailed Logs**: Step-by-step test results

## How to Use the Diagnostics

### Method 1: Quick Check (Recommended)
1. Open the app as a student
2. Look for the current class info banner
3. Below it, you'll see the WiFi status display
4. Tap the "🔍 Check BSSID" button for detailed info

### Method 2: Comprehensive Test
1. Go to the "WiFi Test" tab in bottom navigation
2. Tap "🧪 Run Full Test"
3. Watch the detailed test sequence
4. Review results for any issues

### Method 3: Quick BSSID Only
1. In WiFi Test tab, tap "📶 Quick BSSID Test"
2. Get immediate BSSID detection result
3. Shows BSSID, SSID, and signal strength

## Understanding the Results

### ✅ Success Indicators:
- **BSSID Detected**: Shows actual MAC address (e.g., `b4:86:18:6f:fb:ec`)
- **SSID Available**: Shows network name
- **Good Signal**: Signal strength > -70 dBm
- **Permissions Granted**: Location permission active

### ❌ Failure Indicators:
- **"Not detected"**: No BSSID found
- **"Permission denied"**: Location permission missing
- **"WiFi disabled"**: WiFi is turned off
- **"Module not available"**: Native module issue

### Common Error Codes:
- `PERMISSION_DENIED`: Grant location permission in Android settings
- `WIFI_DISABLED`: Enable WiFi on device
- `NO_BSSID`: Connect to a WiFi network
- `MODULE_NOT_AVAILABLE`: Native module not loaded

## Troubleshooting Steps

### If BSSID Not Detected:
1. **Check WiFi Connection**: Ensure connected to WiFi
2. **Grant Permissions**: Allow location access in Android settings
3. **Restart WiFi**: Turn WiFi off and on
4. **Restart App**: Close and reopen the app
5. **Check Native Module**: Look for "Module not available" errors

### If Permissions Denied:
1. Go to Android Settings > Apps > LetsBunk > Permissions
2. Enable "Location" permission
3. Return to app and test again

### If WiFi Disabled:
1. Enable WiFi in Android settings
2. Connect to your classroom WiFi
3. Test BSSID detection again

## Technical Details

### Native Module Integration:
- Uses custom Kotlin WiFi module (`WifiModule`)
- Accesses Android WiFi Manager APIs
- Requires location permissions (Android security requirement)
- Provides detailed WiFi information

### Permission Requirements:
- `ACCESS_FINE_LOCATION`: Required for BSSID access
- `ACCESS_COARSE_LOCATION`: Fallback permission
- `ACCESS_WIFI_STATE`: WiFi state information

### Detection Process:
1. Check native module availability
2. Verify location permissions
3. Check WiFi enabled state
4. Get WiFi connection info
5. Extract BSSID from connection

## Files Modified:
- `App.js`: Added diagnostic buttons and status display
- `TestBSSID.js`: Existing comprehensive test interface
- `NativeWiFiService.js`: Native module integration
- Built APK: `app-debug-bssid-diagnostic.apk`

## Expected Results:
When working correctly, you should see:
- ✅ **BSSID**: Actual MAC address of your WiFi router
- ✅ **SSID**: Name of your WiFi network
- ✅ **Signal**: Negative number (closer to 0 = stronger)
- ✅ **Status**: "AUTHORIZED" or "DETECTED"

The diagnostic tools will help identify exactly where the BSSID detection might be failing and provide specific solutions for each issue.