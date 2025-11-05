# Deploy to Render with MongoDB Atlas

## Current Setup

- **Main Repo:** `native-bunk` (React Native app + server in `/server` folder)
- **Render Repo:** `cool-satifying` (Server files in root)
- **Database:** MongoDB Atlas (already configured)

## Option 1: Push Server Files to Render Repo (Recommended)

### Step 1: Copy Updated Server Files

You need to copy your updated `server/index.js` to the render repo. The render repo expects files in root, not in a `server/` folder.

```bash
# Navigate to your render repo directory
cd path/to/cool-satifying

# Copy the updated index.js
copy "D:\fingerprint - Copy\server\index.js" index.js

# Copy package.json if updated
copy "D:\fingerprint - Copy\server\package.json" package.json

# Copy other necessary files
copy "D:\fingerprint - Copy\server\face-api-service.js" face-api-service.js
```

### Step 2: Add Environment Variables in Render Dashboard

1. Go to https://dashboard.render.com
2. Select your service
3. Go to "Environment" tab
4. Add these variables:
   ```
   MONGODB_URI=mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk
   PORT=3000
   ```

### Step 3: Update index.js for Render

The render repo's index.js needs to load environment variables. Make sure it has:

```javascript
require('dotenv').config();
// ... rest of the code
```

### Step 4: Commit and Push

```bash
git add .
git commit -m "Update to MongoDB Atlas"
git push origin main
```

Render will automatically deploy!

## Option 2: Use Current Repo Structure

Keep your files in the `server/` folder and update Render settings:

### In Render Dashboard:

1. **Build Command:** `cd server && npm install`
2. **Start Command:** `cd server && npm start`
3. **Root Directory:** Leave empty or set to `server`

### Push to Render Repo:

```bash
# From your main project
git add server/
git commit -m "Update server with MongoDB Atlas"
git push render main:main
```

## Environment Variables for Render

Add these in Render Dashboard → Environment:

```
MONGODB_URI=mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk
PORT=3000
NODE_ENV=production
```

## Important Notes

### 1. Remove Hardcoded IP Address

In your `server/index.js`, find this line:
```javascript
const photoUrl = `http://192.168.9.31:3000/uploads/${filename}`;
```

Change it to use Render URL:
```javascript
const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
const photoUrl = `${baseUrl}/uploads/${filename}`;
```

### 2. Face-API Models

Make sure face-api models are in the repo or download them on startup.

### 3. Uploads Directory

Render's filesystem is ephemeral. Consider using cloud storage (AWS S3, Cloudinary) for uploads.

## Testing After Deployment

1. Check Render logs for "✅ Connected to MongoDB Atlas"
2. Test health endpoint: `https://your-app.onrender.com/api/health`
3. Test time endpoint: `https://your-app.onrender.com/api/time`

## Update Mobile App

Once deployed, update your mobile app to use Render URL:

```javascript
// In your React Native app
const API_URL = 'https://your-app.onrender.com';
```

## Troubleshooting

### "Cannot find module 'dotenv'"
Add to package.json dependencies:
```json
"dotenv": "^16.0.0"
```

### "MongoDB connection timeout"
- Check if MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Verify MONGODB_URI in Render environment variables

### "Face-API models not found"
- Ensure models are in repo or
- Download on startup with a script

## Quick Deploy Script

Create `deploy-to-render.bat`:

```batch
@echo off
echo Deploying to Render...
cd server
git add .
git commit -m "Deploy: %date% %time%"
git push render main:main
echo Done!
pause
```

## Render Free Tier Limitations

- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start takes 30-60 seconds
- ⚠️ 750 hours/month free
- ⚠️ Ephemeral filesystem (uploads deleted on restart)

## Recommended: Use Cloud Storage

For production, use cloud storage for uploads:

### Cloudinary (Free tier: 25GB)
```bash
npm install cloudinary
```

### AWS S3
```bash
npm install @aws-sdk/client-s3
```

This prevents losing uploaded photos when Render restarts.
