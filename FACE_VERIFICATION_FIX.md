# Face Verification Reference Image Fix

## Problem
Face verification was failing because the reference image uploaded via admin panel wasn't loading during verification. The profile picture was setting correctly, but the face verification couldn't access it.

## Root Cause
When photos are uploaded through the admin panel, they're stored on **Cloudinary** and return URLs like:
```
https://res.cloudinary.com/your-cloud/image/upload/v123456/attendance/student_ABC123_789.jpg
```

However, the face verification endpoint in `server/index.js` only handled **local file paths** (localhost/192.168.x.x URLs) and didn't know how to download and process Cloudinary URLs.

## Solution
Updated `server/index.js` to handle three types of photo URLs:

1. **Cloudinary URLs** - Downloads from Cloudinary and converts to base64
2. **Local file paths** - Reads from local filesystem (existing functionality)
3. **Generic HTTP/HTTPS URLs** - Downloads from any URL and converts to base64

### Changes Made

#### 1. Added axios dependency
**File:** `server/package.json`
```json
"dependencies": {
  "axios": "^1.6.2",
  ...
}
```

#### 2. Imported axios
**File:** `server/index.js` (top of file)
```javascript
const axios = require('axios');
```

#### 3. Updated face verification endpoint
**File:** `server/index.js` (around line 993)

**Before:**
```javascript
// Only handled local files
if (photoUrl.includes('localhost') || photoUrl.includes('192.168')) {
    const filename = photoUrl.split('/uploads/')[1];
    const filepath = path.join(__dirname, 'uploads', filename);
    referenceImageBase64 = fs.readFileSync(filepath, 'base64');
}
```

**After:**
```javascript
// Handle Cloudinary URLs
if (photoUrl.includes('cloudinary.com')) {
    console.log('📥 Downloading reference photo from Cloudinary...');
    const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
    referenceImageBase64 = Buffer.from(response.data, 'binary').toString('base64');
    console.log('✅ Reference photo downloaded from Cloudinary');
}
// Handle local file paths
else if (photoUrl.includes('localhost') || photoUrl.includes('192.168')) {
    const filename = photoUrl.split('/uploads/')[1];
    const filepath = path.join(__dirname, 'uploads', filename);
    if (fs.existsSync(filepath)) {
        referenceImageBase64 = fs.readFileSync(filepath, 'base64');
        console.log('✅ Reference photo loaded from local filesystem');
    }
}
// Handle other URLs (generic HTTP/HTTPS)
else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    console.log('📥 Downloading reference photo from URL...');
    const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
    referenceImageBase64 = Buffer.from(response.data, 'binary').toString('base64');
    console.log('✅ Reference photo downloaded from URL');
}

// Validate that we got the image
if (!referenceImageBase64) {
    console.log('❌ Failed to load reference photo from:', photoUrl);
    return res.json({
        success: false,
        match: false,
        confidence: 0,
        message: 'Could not load reference photo. Please re-upload your photo in admin panel.'
    });
}
```

## How It Works Now

1. **Admin uploads photo** → Stored on Cloudinary → URL saved to database
2. **Student logs in** → Gets photoUrl from database (Cloudinary URL)
3. **Face verification starts** → Server detects Cloudinary URL
4. **Server downloads image** → Converts to base64 using axios
5. **Face comparison runs** → Uses downloaded reference image
6. **Verification succeeds** ✅

## Testing
To verify the fix works:

1. Upload a student photo via admin panel
2. Check the student's photoUrl in the database (should be Cloudinary URL)
3. Try face verification from the mobile app
4. Check server logs for: `✅ Reference photo downloaded from Cloudinary`

## Benefits
- ✅ Works with Cloudinary (cloud storage)
- ✅ Works with local file storage (development)
- ✅ Works with any HTTP/HTTPS image URL
- ✅ Better error messages
- ✅ Proper validation that image was loaded

## Installation
Run in the server directory:
```bash
npm install
```

This will install the new axios dependency.
