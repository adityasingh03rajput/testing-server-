# Admin Panel Connection Fix

## Problem
Admin panel shows "Disconnected" status and cannot connect to the server.

## Root Causes & Solutions

### 1. CORS Issues (Most Common)
**Problem:** Server blocks requests from admin panel due to CORS policy.

**Solution:** Ensure server has CORS enabled in `server.js`:
```javascript
const cors = require('cors');
app.use(cors({
  origin: '*', // Or specify your domain
  credentials: true
}));
```

### 2. Server Not Running
**Problem:** Backend server is not running or not accessible.

**Check:**
```bash
# Check if server is running locally
curl http://localhost:3000/api/health

# Check if Azure server is running
curl https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2024-11-28T..."}
```

### 3. Wrong Server URL
**Problem:** Admin panel is pointing to wrong URL.

**Fix:**
1. Open admin panel
2. Go to Settings tab
3. Update Server URL
4. Click "Test Connection" button
5. Click "Save" if test passes

### 4. Network/Firewall Issues
**Problem:** Network or firewall blocking connection.

**Check:**
- Open browser console (F12)
- Look for CORS or network errors
- Try accessing server URL directly in browser

## New Features Added

### ✅ Test Connection Button
- Located in Settings tab
- Tests connection before saving
- Shows detailed error messages
- Provides troubleshooting tips

### ✅ Better Error Logging
- Console logs show connection attempts
- Detailed error messages
- Alternative endpoint fallback

### ✅ Connection Status Indicator
- Green dot = Connected
- Red dot = Disconnected
- Auto-checks every 5 seconds

## Testing Steps

### 1. Open Admin Panel
```bash
# Open in browser
start admin-panel/index.html
```

### 2. Check Console
- Press F12 to open developer tools
- Go to Console tab
- Look for connection logs:
  - 🔍 Checking server connection
  - ✅ Server connected
  - ❌ Server connection error

### 3. Test Connection
1. Go to Settings tab
2. Verify Server URL is correct
3. Click "Test Connection" button
4. Check result message

### 4. Common Error Messages

#### ❌ "Failed to fetch"
**Cause:** CORS issue or server not running
**Fix:** 
- Check server is running
- Enable CORS on server
- Check firewall settings

#### ❌ "NetworkError"
**Cause:** Server unreachable
**Fix:**
- Verify server URL
- Check internet connection
- Try ping/curl to server

#### ❌ "404 Not Found"
**Cause:** Endpoint doesn't exist
**Fix:**
- Check server has `/api/health` endpoint
- Update server code if missing

## Server Requirements

Your server MUST have these endpoints:

### 1. Health Check (Required)
```javascript
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
```

### 2. Students Endpoint (Fallback)
```javascript
app.get('/api/students', async (req, res) => {
    // Return students list
});
```

### 3. CORS Configuration (Required)
```javascript
const cors = require('cors');
app.use(cors({
  origin: '*',
  credentials: true
}));
```

## Troubleshooting Checklist

- [ ] Server is running (check terminal/Azure logs)
- [ ] Server URL is correct in admin panel
- [ ] CORS is enabled on server
- [ ] `/api/health` endpoint exists
- [ ] No firewall blocking connection
- [ ] Browser console shows no errors
- [ ] Test Connection button shows success

## Quick Fixes

### Fix 1: Clear Cache
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Fix 2: Use Local Server
```javascript
// In Settings tab, change URL to:
http://localhost:3000
```

### Fix 3: Check Server Logs
```bash
# If running locally
# Check terminal for errors

# If on Azure
# Check Azure App Service logs
```

## Files Modified

1. **admin-panel/renderer.js**
   - Added `tryAlternativeEndpoint()` function
   - Added `testServerConnection()` function
   - Enhanced error logging
   - Better connection status handling

2. **admin-panel/index.html**
   - Added "Test Connection" button
   - Added connection test result display
   - Better UI feedback

## Status
✅ **FIXED** - Admin panel now has:
- Manual connection testing
- Better error messages
- Alternative endpoint fallback
- Detailed troubleshooting info
