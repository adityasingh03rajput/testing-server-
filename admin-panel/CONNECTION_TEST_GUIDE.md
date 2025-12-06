# Admin Panel Connection Test Guide

## Issue
Admin panel (Electron app) unable to connect to server when running `npm start`.

## Quick Fix Steps

### 1. Open Admin Panel
```bash
cd admin-panel
npm start
```

### 2. Open Developer Tools
- Press **F12** or **Ctrl+Shift+I**
- Go to **Console** tab

### 3. Check Connection Status
Look at the top-right corner of the admin panel:
- 🟢 Green dot = Connected
- 🔴 Red dot = Disconnected

### 4. Test Connection Manually
In the Console, run:
```javascript
checkServerConnection()
```

### 5. Check Server URL
In the Console, run:
```javascript
console.log('Current SERVER_URL:', SERVER_URL)
```

Expected output:
```
Current SERVER_URL: https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
```

### 6. Manual Connection Test
In the Console, run:
```javascript
fetch(SERVER_URL + '/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Connected:', d))
  .catch(e => console.error('❌ Failed:', e))
```

## Common Issues & Solutions

### Issue 1: CORS Error
**Symptom:** Console shows "CORS policy" error

**Solution:** Server needs CORS enabled. Check `server.js`:
```javascript
const cors = require('cors');
app.use(cors({ origin: '*', credentials: true }));
```

### Issue 2: Wrong Server URL
**Symptom:** "Failed to fetch" or "404 Not Found"

**Solution:**
1. Go to **Settings** tab in admin panel
2. Update Server URL
3. Click **"Test Connection"** button
4. Click **"Save"** if test passes

### Issue 3: Server Not Running
**Symptom:** "net::ERR_CONNECTION_REFUSED"

**Solution:** Start the server:
```bash
# In main project folder
npm start
# or
node server.js
```

### Issue 4: Cached Old URL
**Symptom:** Still using old localhost URL

**Solution:**
1. Press **Ctrl+Shift+R** to hard reload
2. Or clear cache: **Tools** → **Database** → **Clear Cache**
3. Or in Console:
```javascript
localStorage.clear()
location.reload()
```

## Testing Checklist

- [ ] Server is running (test with browser: open server URL)
- [ ] Admin panel is open (npm start in admin-panel folder)
- [ ] Developer tools open (F12)
- [ ] No errors in Console tab
- [ ] Server status shows "Connected" (green dot)
- [ ] Can see data in Dashboard tab

## Manual Test Commands

### Test 1: Health Check
```javascript
fetch('https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/health')
  .then(r => r.json())
  .then(d => console.log('Health:', d))
```

### Test 2: Get Students
```javascript
fetch(SERVER_URL + '/api/students')
  .then(r => r.json())
  .then(d => console.log('Students:', d.students.length))
```

### Test 3: Get Teachers
```javascript
fetch(SERVER_URL + '/api/teachers')
  .then(r => r.json())
  .then(d => console.log('Teachers:', d.teachers.length))
```

## If Still Not Working

1. **Check Network Tab** (F12 → Network):
   - Look for failed requests (red)
   - Check request URL
   - Check response status

2. **Check Console for Errors**:
   - CORS errors
   - Network errors
   - JavaScript errors

3. **Verify Server is Accessible**:
   - Open in browser: https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/health
   - Should show: `{"status":"ok","timestamp":"..."}`

4. **Use Test Connection Page**:
   - Open `admin-panel/test-connection.html` in browser
   - Click "Test Connection"
   - Check results

## Success Indicators

✅ Green dot in top-right corner
✅ Dashboard shows statistics
✅ Students/Teachers tabs load data
✅ No errors in Console
✅ Network tab shows successful requests (200 status)

## Need More Help?

Check these files:
- `ADMIN_PANEL_CONNECTION_FIX.md` - Detailed troubleshooting
- `admin-panel/test-connection.html` - Standalone connection tester
- `SERVER_URL_UPDATE_GUIDE.md` - How to update server URL
