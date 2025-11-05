# Render Environment Variables Setup

## ✅ Code Pushed Successfully!

Your updated code with MongoDB Atlas support has been pushed to the render repository.

## 🔧 Next Step: Add Environment Variables in Render

### 1. Go to Render Dashboard
Visit: https://dashboard.render.com

### 2. Select Your Service
- Click on your service (cool-satifying or your service name)

### 3. Go to Environment Tab
- Click "Environment" in the left sidebar

### 4. Add These Environment Variables

Click "Add Environment Variable" and add each of these:

#### Variable 1: MONGODB_URI
```
Key: MONGODB_URI
Value: mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk
```

#### Variable 2: PORT (Optional - Render sets this automatically)
```
Key: PORT
Value: 3000
```

#### Variable 3: NODE_ENV
```
Key: NODE_ENV
Value: production
```

#### Variable 4: RENDER_EXTERNAL_URL (Optional - for photo URLs)
```
Key: RENDER_EXTERNAL_URL
Value: https://your-service-name.onrender.com
```
(Replace with your actual Render URL)

### 5. Save Changes
- Click "Save Changes" button
- Render will automatically redeploy

### 6. Check Deployment Logs
- Go to "Logs" tab
- Look for these success messages:
  ```
  ✅ Connected to MongoDB Atlas
  📍 Database: attendance_app
  🚀 Attendance SDUI Server Running
  ```

## 🔍 Verify Deployment

Once deployed, test these endpoints:

### Health Check
```
https://your-service-name.onrender.com/api/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### Time Sync
```
https://your-service-name.onrender.com/api/time
```
Should return server time

### Config
```
https://your-service-name.onrender.com/api/config
```
Should return app configuration

## 📱 Update Mobile App

Once Render is deployed, update your React Native app:

### Find and Replace
In your mobile app code, replace:
```javascript
// Old
const API_URL = 'http://192.168.9.31:3000';

// New
const API_URL = 'https://your-service-name.onrender.com';
```

### Files to Update
- `App.js`
- Any file that makes API calls
- Socket.IO connection URLs

## ⚠️ Important Notes

### 1. MongoDB Atlas IP Whitelist
Make sure MongoDB Atlas allows connections from anywhere:
- Go to MongoDB Atlas → Network Access
- Add IP: `0.0.0.0/0` (Allow from anywhere)
- This is required for Render to connect

### 2. Render Free Tier
- Spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month free

### 3. File Uploads
Render's filesystem is ephemeral. Uploaded photos will be deleted when:
- Service restarts
- New deployment
- Service spins down

**Solution:** Use cloud storage (Cloudinary, AWS S3) for production

### 4. Face-API Models
Make sure face-api models are in the repository or downloaded on startup.

## 🐛 Troubleshooting

### Error: "Cannot find module 'dotenv'"
✅ **Fixed!** The package.json now includes dotenv.

### Error: "MongoDB connection timeout"
- Check if MONGODB_URI is set correctly in Render
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check MongoDB Atlas cluster is running

### Error: "Face-API models not found"
- Ensure models folder is in repository
- Or download models on startup

### Service Won't Start
- Check Render logs for errors
- Verify all environment variables are set
- Check if MongoDB connection string is correct

## 📊 Monitor Your Service

### Render Dashboard
- **Metrics:** View CPU, memory, bandwidth usage
- **Logs:** Real-time server logs
- **Events:** Deployment history

### MongoDB Atlas Dashboard
- **Metrics:** Database operations, connections
- **Collections:** Browse your data
- **Performance:** Query performance insights

## 🚀 Deployment Complete Checklist

- [ ] Code pushed to render repository
- [ ] MONGODB_URI added in Render environment
- [ ] Deployment successful (check logs)
- [ ] Health endpoint responding
- [ ] MongoDB Atlas connected
- [ ] Mobile app updated with Render URL
- [ ] Tested login functionality
- [ ] Tested face verification
- [ ] Tested attendance recording

## 🎉 Success!

Once all environment variables are set and deployment is successful, your app will be:
- ✅ Running on Render (cloud server)
- ✅ Connected to MongoDB Atlas (cloud database)
- ✅ Accessible from anywhere
- ✅ Automatically backed up
- ✅ Production ready!

---

**Your Render URL:** https://cool-satifying.onrender.com (or your custom URL)
**MongoDB Atlas:** letsbunk.cdxihb7.mongodb.net
**Status:** Ready for environment variable configuration
