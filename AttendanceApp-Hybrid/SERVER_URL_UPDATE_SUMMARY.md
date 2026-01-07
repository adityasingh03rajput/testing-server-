# Server URL Update Summary

## Changes Made
Updated all server URL references from Azure to Render deployment.

### Old URL
```
https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
```

### New URL
```
https://letsbunk-uw7g.onrender.com
```

## Files Updated

### 1. Main Configuration Files
- **config.js** - Updated `SERVER_BASE_URL` constant
- **App.js** - Updated `API_URL` and `SOCKET_URL` constants

### 2. API Test Files
- **add-teachers-via-api.js** - Updated `SERVER_URL` variable
- **test-server-direct.js** - Updated `SERVER_URL` variable  
- **test-teachers-api.js** - Updated `SERVER_URL` variable

### 3. Face Verification
- **OfflineFaceVerification.js** - Updated `API_URL` constant

### 4. View Records
- **ViewRecords.js** - Updated hardcoded URL in fetch request

### 5. Admin Panel
- **admin-panel/renderer.js** - Updated default `SERVER_URL`
- **admin-panel/index.html** - Updated default server URL input value and help text

## Files NOT Updated (Auto-Generated)
- **android/app/src/main/assets/index.android.bundle** - Will be regenerated on next build
- **android/app/src/main/assets/index.android.bundle.map** - Will be regenerated on next build

## Next Steps
1. **Rebuild the app** to generate new bundle files with updated URLs:
   ```bash
   npm run android
   # OR
   BUILD_APK_PROPER_SDK.bat
   ```

2. **Test the connection** to ensure the new Render server is accessible:
   ```bash
   node test-server-direct.js
   ```

3. **Update any local development environments** that might be using the old URL

## Verification
All source code files now point to the new Render deployment. The app will automatically use the new server URL after rebuilding.