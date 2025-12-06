# Server URL Update Guide

## Quick Update Instructions

To change the backend server URL for the entire application, update it in these 4 files:

### 1. Mobile App (React Native)
**File:** `App.js` (Line ~27)
```javascript
const SERVER_BASE_URL = 'https://your-new-server-url.com';
```

### 2. Offline Face Verification
**File:** `OfflineFaceVerification.js` (Line ~10)
```javascript
const API_URL = 'https://your-new-server-url.com';
```

### 3. Admin Panel JavaScript
**File:** `admin-panel/renderer.js` (Line ~7)
```javascript
let SERVER_URL = localStorage.getItem('serverUrl') ||
    'https://your-new-server-url.com';
```

### 4. Admin Panel HTML
**File:** `admin-panel/index.html` (Line ~421)
```html
<input type="text" id="serverUrl" value="https://your-new-server-url.com"
```

Also update the example URL on line ~424:
```html
✅ Azure (HTTPS): https://your-new-server-url.com<br>
```

## Current Server URL
```
https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
```

## After Updating

### For Mobile App:
1. Rebuild the APK:
   ```cmd
   BUILD_APK.bat
   ```
2. Install on device:
   ```cmd
   adb install -r android\app\build\outputs\apk\release\app-release.apk
   ```

### For Admin Panel:
1. Just refresh the browser (F5)
2. Or clear localStorage and reload

## Testing New Server URL

### Test Mobile App:
1. Open the app
2. Try to login
3. Check if data loads correctly

### Test Admin Panel:
1. Open admin panel in browser
2. Click "Test Connection" button
3. Should show "✅ Connected successfully"

## Troubleshooting

### Mobile App Not Connecting:
- Check if server URL has `https://` prefix
- Verify server is accessible from mobile network
- Check server CORS settings allow mobile app origin

### Admin Panel Not Connecting:
- Check browser console for errors (F12)
- Verify server URL in Settings tab
- Try clearing localStorage: `localStorage.clear()`

### CORS Errors:
Add to your server's CORS configuration:
```javascript
app.use(cors({
  origin: '*', // Or specify your domain
  credentials: true
}));
```

## Files That Use Server URL

| File | Purpose | Line |
|------|---------|------|
| `App.js` | Main mobile app | ~27 |
| `OfflineFaceVerification.js` | Face verification | ~10 |
| `admin-panel/renderer.js` | Admin panel logic | ~7 |
| `admin-panel/index.html` | Admin panel UI | ~421, ~424 |

## Environment-Specific URLs

### Production (Azure):
```
https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
```

### Local Development:
```
http://localhost:3000
```
or
```
http://192.168.x.x:3000
```

## Notes

- Always use HTTPS for production
- HTTP only works for localhost/local IP
- Mobile app requires network permissions
- Admin panel stores URL in localStorage
- Server must have CORS enabled
- Socket.IO connection uses same base URL
