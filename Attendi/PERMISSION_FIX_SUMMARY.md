# Permission Fix Summary

## Problem
The app was crashing when the play button was pressed with the error:
```
java.lang.IllegalArgumentException: permission is null
```

## Root Cause
`PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION` was returning `null` instead of the expected string constant. This is a known issue in some React Native versions where the permission constants are not properly initialized.

## Solution Applied
Replaced all uses of `PermissionsAndroid.PERMISSIONS.*` constants with direct string constants:

### Before (Problematic):
```javascript
const fineLocationGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
```

### After (Fixed):
```javascript
const FINE_LOCATION = 'android.permission.ACCESS_FINE_LOCATION';
const fineLocationGranted = await PermissionsAndroid.check(FINE_LOCATION);
```

## Files Modified

### 1. App.js - handleStartPause function
- Fixed permission checking in the play button handler
- Added proper logging to debug permission status
- Used string constants instead of PermissionsAndroid.PERMISSIONS.*

### 2. WiFiManager.js - Multiple functions
- Fixed requestPermissions() function
- Fixed checkLocationPermissions() function  
- Fixed requestLocationPermissionAggressively() function
- All permission constants replaced with string equivalents

## String Constants Used
```javascript
const FINE_LOCATION = 'android.permission.ACCESS_FINE_LOCATION';
const COARSE_LOCATION = 'android.permission.ACCESS_COARSE_LOCATION';
const WIFI_STATE = 'android.permission.ACCESS_WIFI_STATE';
const CHANGE_WIFI_STATE = 'android.permission.CHANGE_WIFI_STATE';
```

## Z-Index Layering Fix
Also fixed the z-index layering issue in CircularTimer.js:
- Play button: `zIndex: 1002, elevation: 10`
- Center container: `zIndex: 1000`
- This ensures the play button is always above the circular arcs

## Expected Behavior After Fix
1. ✅ App should not crash when play button is pressed
2. ✅ Location permission dialog should appear properly
3. ✅ BSSID validation should work after permission is granted
4. ✅ Play button should be visible above the circular arcs
5. ✅ Face verification should proceed after BSSID validation passes

## Testing Steps
1. Install the updated APK: `app-release-latest.apk`
2. Open the app and login as a student
3. Press the play button
4. Verify permission dialog appears
5. Grant location permission
6. Verify BSSID validation works
7. Check that face verification screen opens

## Build Info
- APK: `app-release-latest.apk` (84.3MB)
- Build time: ~1 minute 8 seconds
- All warnings are non-critical (Metro bundler warnings)