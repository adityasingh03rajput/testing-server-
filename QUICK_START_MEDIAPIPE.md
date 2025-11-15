# MediaPipe Quick Start - 5 Minutes

## Step 1: Install (1 minute)

```bash
npm install
```

## Step 2: Add to Server (2 minutes)

Open `server.js` and add at the top:

```javascript
// Add MediaPipe
const { initializeMediaPipe } = require('./server/init-mediapipe');
const mediaPipeRoutes = require('./server/routes/mediapipe-verification');
```

Then after the server starts, add:

```javascript
// Initialize MediaPipe (add after server.listen)
initializeMediaPipe();

// Add MediaPipe routes
app.use('/api/mediapipe', mediaPipeRoutes);
```

## Step 3: Start Server (30 seconds)

```bash
npm start
```

**Look for:**
```
✅ MediaPipe initialized successfully!
```

## Step 4: Test (1 minute)

### Test 1: Health Check
```bash
curl http://localhost:3000/api/mediapipe/health
```

Should return: `"ready": true`

### Test 2: Real Face
- Open mobile app
- Login
- Verify face
- Should work ✅

### Test 3: Photo (Should Fail)
- Show photo to camera
- Try to verify
- Should reject with "Liveness check failed" ❌

## Done! 🎉

Your system now has anti-spoofing protection!

---

## What Changed?

**Before:**
- Students could cheat with photos ❌

**After:**
- Photos are detected and rejected ✅
- Only real faces work ✅

---

## Need Help?

- Full guide: `MEDIAPIPE_MIGRATION.md`
- Testing: `TEST_MEDIAPIPE.md`
- Summary: `MEDIAPIPE_SUMMARY.md`

---

**That's it!** Your attendance system is now secure. 🔒
