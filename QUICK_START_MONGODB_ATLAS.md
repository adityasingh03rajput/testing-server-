# Quick Start: MongoDB Atlas Migration

## ✅ What's Done

Your server is now configured to use MongoDB Atlas! Here's what changed:

1. ✅ Installed `dotenv` package
2. ✅ Created `.env` file for configuration
3. ✅ Updated `server/index.js` to use environment variables
4. ✅ Created setup guide and test script

## 🚀 Quick Setup (5 minutes)

### 1. Create MongoDB Atlas Account
Go to: https://www.mongodb.com/cloud/atlas
- Sign up (free)
- Create a FREE cluster (M0)
- Takes 3-5 minutes to provision

### 2. Setup Database Access
- Create a database user with username and password
- Remember these credentials!

### 3. Setup Network Access
- Whitelist your IP address
- For testing: Allow access from anywhere (0.0.0.0/0)

### 4. Get Connection String
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy the connection string

### 5. Update .env File
Open `.env` and update:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/attendance_app?retryWrites=true&w=majority
```

Replace:
- `YOUR_USERNAME` with your database username
- `YOUR_PASSWORD` with your database password
- `cluster0.xxxxx` with your actual cluster address

### 6. Test Connection
```bash
cd server
npm run test-db
```

You should see: ✅ Successfully connected to MongoDB!

### 7. Start Server
```bash
npm start
```

## 📱 Update Mobile App

Your mobile app doesn't need any changes! It connects to the same server URL.
The server will now use MongoDB Atlas instead of local MongoDB.

## 🔧 Commands

```bash
# Test MongoDB connection
cd server
npm run test-db

# Start server with Atlas
npm start

# Development mode with auto-reload
npm run dev
```

## 🆘 Troubleshooting

### "Connection timeout"
- Check if your IP is whitelisted in Atlas Network Access
- Try allowing access from anywhere (0.0.0.0/0)

### "Authentication failed"
- Verify username and password in .env
- Check for special characters (URL encode if needed)

### "Cannot find module 'dotenv'"
```bash
cd server
npm install
```

## 📖 Detailed Guide

For step-by-step instructions with screenshots, see:
- `MONGODB_ATLAS_SETUP.md`

## 🎯 Benefits

✅ Access database from anywhere
✅ No need to run local MongoDB
✅ Automatic backups
✅ Better security
✅ Scalable as you grow
✅ Free tier available

## 🔐 Security Note

- Never commit `.env` file to Git (already in .gitignore)
- Use strong passwords
- Whitelist only necessary IPs in production
- Keep your connection string secret
