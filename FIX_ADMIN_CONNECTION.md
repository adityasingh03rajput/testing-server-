# Fix Admin Panel Connection - Step by Step

## Current Status:
- ✅ Server is running: https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
- ✅ Server health check: Working (tested successfully)
- ✅ Admin panel is open
- ❌ Admin panel showing zeros (not connected)

## Quick Fix (2 Minutes):

### Method 1: Use Developer Console (Recommended)

1. **Open Developer Tools in Admin Panel:**
   - Press `F12` or `Ctrl+Shift+I`
   - Click on **Console** tab

2. **Copy and paste this entire script:**
   ```javascript
   // Fix connection script
   const AZURE_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
   localStorage.setItem('serverUrl', AZURE_URL);
   SERVER_URL = AZURE_URL;
   console.log('✅ Server URL updated to:', AZURE_URL);
   
   // Test connection
   fetch(AZURE_URL + '/api/health')
     .then(r => r.json())
     .then(d => {
       console.log('✅ Server connected:', d);
       console.log('🔄 Reloading page...');
       setTimeout(() => location.reload(), 1000);
     })
     .catch(e => console.error('❌ Connection failed:', e));
   ```

3. **Press Enter** - The page will reload automatically

4. **Verify Connection:**
   - Look at top-right corner
   - Should show 🟢 Green dot = Connected
   - Dashboard should show data

### Method 2: Use Settings Tab

1. **Click on "Settings" tab** (gear icon on left sidebar)

2. **Verify Server URL:**
   ```
   https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
   ```

3. **Click "Test Connection" button**
   - Should show: ✅ Connection successful

4. **Click "Save" button**

5. **Refresh the page:**
   - Press `Ctrl+R` or `F5`

### Method 3: Manual Reload

1. **Press `Ctrl+Shift+R`** (Hard reload)
   - This clears cache and reloads

2. **Wait 5 seconds** for connection check

3. **Check top-right corner** for green dot

## Verification Steps:

After applying the fix, verify these:

### 1. Check Connection Status
- **Location:** Top-right corner of admin panel
- **Expected:** 🟢 Green dot with "Connected" text
- **If Red:** Connection failed, try Method 1 again

### 2. Check Dashboard Data
- **Total Students:** Should show a number (not 0)
- **Total Teachers:** Should show a number (not 0)
- **Timetables:** Should show a number (not 0)

### 3. Check Console (F12)
Look for these messages:
```
✅ Server connected via /api/health
✅ Dashboard data loaded
```

If you see errors:
```
❌ Server connection error: ...
```
Then follow the troubleshooting section below.

## Troubleshooting:

### Issue 1: Still Showing Zeros

**Cause:** No data in database yet

**Solution:** Add some test data:

1. Go to **Students** tab
2. Click **"Add Student"** button
3. Fill in details and save

Or use the API to add data:
```javascript
// In Console (F12)
fetch(SERVER_URL + '/api/student-management', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'Test Student',
    enrollmentNo: 'TEST001',
    semester: '1',
    course: 'CSE',
    email: 'test@example.com',
    phone: '1234567890'
  })
})
.then(r => r.json())
.then(d => console.log('Student added:', d));
```

### Issue 2: CORS Error in Console

**Symptom:** Console shows:
```
Access to fetch at '...' from origin 'file://' has been blocked by CORS policy
```

**Solution:** Server CORS is already enabled, but try:

1. Close admin panel completely
2. Restart it:
   ```bash
   cd admin-panel
   npm start
   ```

### Issue 3: Network Error

**Symptom:** Console shows:
```
Failed to fetch
TypeError: NetworkError
```

**Solution:**
1. Check internet connection
2. Verify server is accessible:
   - Open browser
   - Go to: https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/health
   - Should show: `{"status":"ok","timestamp":"..."}`

### Issue 4: Old URL Cached

**Symptom:** Console shows old localhost URL

**Solution:**
```javascript
// In Console (F12)
localStorage.clear();
location.reload();
```

## Advanced Debugging:

### Check All Endpoints:

Run this in Console (F12):
```javascript
const SERVER = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testAll() {
  console.log('🧪 Testing all endpoints...\n');
  
  // Test 1: Health
  try {
    const r1 = await fetch(SERVER + '/api/health');
    const d1 = await r1.json();
    console.log('✅ Health:', d1);
  } catch(e) { console.error('❌ Health failed:', e.message); }
  
  // Test 2: Students
  try {
    const r2 = await fetch(SERVER + '/api/students');
    const d2 = await r2.json();
    console.log('✅ Students:', d2.students?.length || 0, 'found');
  } catch(e) { console.error('❌ Students failed:', e.message); }
  
  // Test 3: Teachers
  try {
    const r3 = await fetch(SERVER + '/api/teachers');
    const d3 = await r3.json();
    console.log('✅ Teachers:', d3.teachers?.length || 0, 'found');
  } catch(e) { console.error('❌ Teachers failed:', e.message); }
  
  console.log('\n✅ All tests complete!');
}

testAll();
```

### Force Reload Data:

```javascript
// In Console (F12)
loadDashboardData();
loadStudents();
loadTeachers();
```

## Success Checklist:

- [ ] Admin panel window is open
- [ ] F12 Developer Tools is open
- [ ] Console tab is selected
- [ ] Fix script has been run
- [ ] Page has reloaded
- [ ] Top-right shows 🟢 Green dot
- [ ] Dashboard shows numbers (not zeros)
- [ ] No errors in Console
- [ ] Can navigate to Students/Teachers tabs
- [ ] Data loads in tables

## Still Not Working?

If none of the above works:

1. **Close admin panel completely**
2. **Stop the process:**
   ```bash
   taskkill /F /IM electron.exe
   ```

3. **Restart admin panel:**
   ```bash
   cd admin-panel
   npm start
   ```

4. **Wait 10 seconds** for it to fully load

5. **Press F12** and run the fix script again

## Contact Support:

If the issue persists:
1. Take a screenshot of the Console (F12)
2. Take a screenshot of the Network tab (F12 → Network)
3. Note any error messages
4. Check server logs on Azure

---

**Quick Reference:**

- **Server URL:** https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
- **Health Check:** /api/health
- **Fix Script:** See Method 1 above
- **Reload:** Ctrl+R or F5
- **Hard Reload:** Ctrl+Shift+R
- **Console:** F12 → Console tab

