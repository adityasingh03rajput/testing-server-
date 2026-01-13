# Render Deployment Guide - LetsBunk Server

## Service URL
https://dashboard.render.com/web/srv-d35h9hd6ubrc73a0rp2g/deploys/dep-d5itlkp4tr6s73dvhqhg

## Quick Deployment Steps

### 1. Environment Variables (Set in Render Dashboard)
Go to your service settings and add these environment variables:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk
CLOUDINARY_CLOUD_NAME=cloudinary
CLOUDINARY_API_KEY=445132764832368
CLOUDINARY_API_SECRET=0OXqzNMmfifBAjqUUIIQft8P3l0
REDIS_HOST=redis-11769.crce206.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=11769
REDIS_USERNAME=default
REDIS_PASSWORD=zZdSNJordmy0BIE52S7LUy4TKWWphNi2
FACE_DETECTION_THRESHOLD=0.6
FACE_MATCH_THRESHOLD=0.6
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
JWT_SECRET=letsbunk-jwt-secret-2024-secure-key
SESSION_SECRET=letsbunk-session-secret-2024-secure-key
ALLOWED_ORIGINS=*
```

### 2. Service Configuration
- **Build Command**: `npm ci`
- **Start Command**: `npm start`
- **Node Version**: 18.20.4
- **Branch**: master
- **Auto Deploy**: Enabled

### 3. Manual Deployment Trigger
Since the code is already pushed to GitHub, you can:
1. Go to your Render service dashboard
2. Click "Manual Deploy" 
3. Select "Deploy latest commit"

### 4. Check Deployment Status
Monitor the build logs for:
- ✅ Dependencies installed successfully
- ✅ Face-API models loaded
- ✅ MongoDB connection established
- ✅ Server started on port

## Troubleshooting

### If bcrypt error persists:
The package.json now uses `bcryptjs` which should resolve the issue.

### If face-api models fail:
The models directory should be included in the deployment.

### If MongoDB connection fails:
Verify the MONGODB_URI environment variable is set correctly.

## Expected Server Output
```
🌍 Environment: production
✅ Face-api.js models loaded successfully
✅ Connected to MongoDB Atlas
📍 Database: attendance_app
🚀 Server running on port 3000
```

## Service Health Check
Once deployed, test: `https://your-render-url.onrender.com/api/health`