# Admin Panel Connection Troubleshooting

## Quick Start

### Option 1: Start Admin Panel (Recommended)
```batch
START_ADMIN_PANEL.bat
```

### Option 2: Manual Start
```batch
cd admin-panel
npm start
```

## Connection Issues

### 1. Check Server Status
The admin panel connects to:
```
https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
```

Test the connection:
- Open `test-admin-connection.html` in your browser
- Click "Test Health Endpoint"
- Should show ✅ if server is accessible

### 2. Common Issues

#### Issue: "Cannot connect to server"
**Solution:**
1. Check your internet connection
2. Verify server is running:
   ```
   https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/health
   ```
3. Check if firewall is blocking the connection

#### Issue: "CORS Error"
**Solution:**
- The server has CORS enabled for all origins
- If you see CORS errors, the server might be down
- Try restarting the Azure app service

#### Issue: "Admin panel shows blank screen"
**Solution:**
1. Open DevTools (F12) and check console for errors
2. Clear cache: Tools → Database → Clear Cache
3. Reload: Ctrl+R or Ctrl+Shift+R

#### Issue: "No data loading"
**Solution:**
1. Check server connection indicator (top right)
2. Should show "Connected" in green
3. If red, click "Test Connection" in Tools menu
4. Verify database has data (currently empty after reset)

### 3. Change Server URL

If you need to connect to a different server:

1. Open Admin Panel
2. Go to Settings (Ctrl+,)
3. Enter new server URL
4. Click "Save Settings"
5. Reload the app

### 4. Developer Tools

Open DevTools to see detailed errors:
- Press F12
- Or: View → Toggle Developer Tools
- Check Console tab for errors
- Check Network tab for failed requests

### 5. Test Connection in Browser

Open `test-admin-connection.html` in any browser to test:
- Server health
- API endpoints
- CORS configuration
- Network connectivity

## Current Status

✅ Server is accessible
✅ CORS is configured
✅ Admin panel is installed
✅ Electron dependencies are ready

## Next Steps

1. Start the admin panel: `START_ADMIN_PANEL.bat`
2. Check connection indicator (top right)
3. If connected, start adding data:
   - Students (Ctrl+N)
   - Teachers (Ctrl+Shift+N)
   - Classrooms
   - Timetables

## Support

If issues persist:
1. Check console logs (F12)
2. Verify server URL in Settings
3. Test connection using test-admin-connection.html
4. Restart the admin panel
