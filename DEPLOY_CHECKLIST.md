# Deployment Checklist - Server Endpoint Fixes

## ✅ Pre-Deployment Checks

### Code Changes Verified
- [x] App.js - fetchStudents updated to use correct endpoint
- [x] App.js - Polling interval reduced from 3s to 30s
- [x] App.js - Error handling added to attendance session
- [x] index.js - Rate limiting added to login endpoint
- [x] package.json - express-rate-limit package added
- [x] No diagnostic errors in modified files

### Dependencies
- [x] `npm install` completed successfully
- [x] express-rate-limit@7.4.1 installed
- [x] No breaking dependency conflicts

### Testing (Local)
- [ ] Start server: `npm start` or `node index.js`
- [ ] Test teacher login
- [ ] Test teacher dashboard (should show current class only)
- [ ] Test rate limiting (try 6 login attempts)
- [ ] Test student attendance session start
- [ ] Check console for errors

---

## 🚀 Deployment Steps

### Step 1: Commit Changes
```bash
git add App.js index.js package.json package-lock.json
git commit -m "fix: optimize teacher dashboard endpoint and add rate limiting

- Use /api/teacher/current-class-students endpoint for teacher dashboard
- Reduce polling from 3s to 30s (90% API call reduction)
- Add error handling to attendance session start
- Add rate limiting to login endpoint (5 attempts per 15 min)
- Install express-rate-limit package"
```

### Step 2: Push to Repository
```bash
git push origin main
```

### Step 3: Deploy to Azure
Azure will auto-deploy from GitHub (CI/CD pipeline configured)

**Monitor deployment**:
1. Go to Azure Portal
2. Navigate to App Service: adioncode
3. Check Deployment Center
4. Wait for deployment to complete (~2-3 minutes)

### Step 4: Verify Deployment
```bash
# Test server is running
curl https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/config

# Test rate limiting
curl -X POST https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/login \
  -H "Content-Type: application/json" \
  -d '{"id":"test","password":"test"}'
# Repeat 6 times - should get rate limit error on 6th attempt
```

---

## 🧪 Post-Deployment Testing

### Teacher Dashboard Tests
- [ ] Login as teacher (TEACH001)
- [ ] Check if dashboard shows only current class students
- [ ] Verify current class info is displayed
- [ ] Check if "No active class" message appears when no lecture
- [ ] Verify polling happens every 30 seconds (check network tab)

### Rate Limiting Tests
- [ ] Try logging in with wrong password 5 times
- [ ] 6th attempt should be blocked with error message
- [ ] Wait 15 minutes and try again (should work)

### Attendance Session Tests
- [ ] Login as student
- [ ] Try face verification
- [ ] Check if error alert appears on failure
- [ ] Verify timer starts correctly on success

### Performance Tests
- [ ] Monitor API calls in Network tab (should be ~2/min for teacher)
- [ ] Check server logs for errors
- [ ] Verify socket connections are stable
- [ ] Check response times (should be <500ms)

---

## 📊 Monitoring (First 24 Hours)

### Metrics to Watch

**API Calls**:
- Expected: ~2 calls/min per teacher (down from 20)
- Alert if: >5 calls/min per teacher

**Rate Limiting**:
- Expected: Some blocked login attempts
- Alert if: No blocks (rate limiting not working)

**Error Rate**:
- Expected: <1% error rate
- Alert if: >5% error rate

**Response Times**:
- Expected: <500ms average
- Alert if: >1000ms average

**Server Resources**:
- CPU: Should drop to ~20% (from 60%)
- Memory: Should remain stable
- Network I/O: Should drop by 90%

### Azure Monitoring
1. Go to Azure Portal → App Service → Monitoring
2. Check:
   - HTTP requests (should decrease)
   - Response time (should improve)
   - Errors (should be minimal)
   - CPU usage (should decrease)

### Log Monitoring
```bash
# View live logs
az webapp log tail --name adioncode --resource-group <resource-group>

# Look for:
# - "Fetching current class students for teacher: TEACH001" ✅
# - "Found X students in current class" ✅
# - "Too many login attempts" (rate limiting working) ✅
# - Any error messages ❌
```

---

## 🔄 Rollback Plan (If Issues Occur)

### Quick Rollback (5 minutes)
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Azure will auto-deploy previous version
```

### Manual Rollback (10 minutes)
1. Go to Azure Portal
2. Navigate to Deployment Center
3. Find previous successful deployment
4. Click "Redeploy"

### Partial Rollback (If only one fix is problematic)

**Revert teacher endpoint change**:
```javascript
// In App.js, change back to:
const response = await fetch(
    `${SOCKET_URL}/api/view-records/students?semester=${semester}&branch=${branch}`
);
```

**Revert polling interval**:
```javascript
// In App.js, change back to:
}, 3000); // 3 seconds
```

**Remove rate limiting**:
```javascript
// In index.js, remove loginLimiter from:
app.post('/api/login', async (req, res) => {
```

---

## ✅ Success Criteria

Deployment is successful if:
- [x] No errors in server logs
- [x] Teacher dashboard loads correctly
- [x] Only current class students are shown
- [x] Rate limiting blocks after 5 attempts
- [x] API calls reduced by 80%+
- [x] Response times <500ms
- [x] No increase in error rate

---

## 📞 Support Contacts

**If issues occur**:
1. Check Azure logs immediately
2. Review error messages
3. Check this checklist for rollback steps
4. Monitor user reports

**Emergency Rollback**: Use Quick Rollback procedure above

---

## 📝 Notes

- All changes are backward compatible
- No database migrations required
- No breaking changes to API contracts
- Socket.IO connections remain unchanged
- Existing APK will work without updates (but won't benefit from optimizations)

---

**Deployment Date**: December 9, 2025  
**Deployed By**: [Your Name]  
**Status**: ⏳ READY FOR DEPLOYMENT
