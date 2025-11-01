# 🚀 College Attendance System - Complete Deployment Guide

## 📋 Tabl  ntents
1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Server Setup](#server-setup)
4. [Mobile App Setup](#mobile-app-setup)
5. [Admin Panel Setup](#admin-panel-setup)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

The College Attendance System consists of three components:

1. **Backend Server** (Node.js + MongoDB)
2. **Mobile App** (React Native - Android)
3. **Admin Panel** (Electron - Windows Desktop)

---

## 📦 Prerequisites

### Required Software:

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **MongoDB** v4.4+ ([Download](https://www.mongodb.com/try/download/community))
- **Android Studio** (for building mobile app)
- **Git** ([Download](https://git-scm.com/))

### For Mobile App Build:
- **Java JDK** 11+
- **Android SDK**
- **Gradle** (comes with Android Studio)

---

## 🖥️ Server Setup

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

### Step 2: Install Server Dependencies

```bash
cd server
npm install
```

### Step 3: Download Face Detection Models

```bash
node download-models.js
```

This downloads face-api.js models (~30MB) to `server/models/`

### Step 4: Start MongoDB

**Windows:**
```bash
mongod
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
```

### Step 5: Seed Database (Optional)

```bash
node seed-data.js
```

This creates sample data:
- 33 students across different semesters
- 10 teachers
- 12 timetables
- Attendance records

### Step 6: Start Server

```bash
node index.js
```

Server will run on: `http://localhost:3000`

### Step 7: Find Your Server IP

**Windows:**
```bash
ipconfig
```

**Linux/Mac:**
```bash
ifconfig
```

Note your IPv4 address (e.g., `192.168.1.100`)

---

## 📱 Mobile App Setup

### Step 1: Install Dependencies

```bash
# From project root
npm install
```

### Step 2: Update Server URL

Edit these files and replace `192.168.9.31` with your server IP:

- `App.js` (line with `SOCKET_URL`)
- `FaceVerificationScreen.js` (if applicable)

### Step 3: Build APK

**Debug Build (for testing):**
```bash
cd android
gradlew assembleDebug
```

**Release Build (for distribution):**
```bash
cd android
gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Install on Android Device

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Or copy APK to device and install manually.

---

## 💻 Admin Panel Setup

### Option 1: Build Installer (Recommended)

```bash
# Run the build script
QUICK_INSTALL_ADMIN.bat

# Or manually:
cd admin-panel
npm install
npm install --save-dev electron electron-builder electron-squirrel-startup
copy package-electron.json package.json
npm run build-win
```

Installer location: `admin-panel/dist/College Attendance Admin Setup 1.0.0.exe`

### Option 2: Run Directly (Development)

```bash
cd admin-panel
npm install
npm start
```

### Distribution

Share the installer from `Admin-Panel-Installer/` folder:
- Contains standalone .exe installer
- Includes documentation
- No additional files needed

---

## ✅ Testing

### 1. Test Server

Open browser: `http://localhost:3000/api/health`

Should return: `{"status":"ok"}`

### 2. Test Mobile App

**Login Credentials:**
- Student: `0246CS241001` / `aditya`
- Teacher: `TEACH001` / `aditya`

**Test Flow:**
1. Login
2. Face verification (first time)
3. View timetable
4. Start attendance timer
5. Check dashboard

### 3. Test Admin Panel

1. Launch admin panel
2. Configure server URL in Settings
3. Add a test student
4. Upload photo
5. Create timetable
6. View dashboard

---

## 🐛 Troubleshooting

### Server Issues

**MongoDB connection failed:**
```bash
# Check if MongoDB is running
mongo

# If not, start it
mongod
```

**Port 3000 already in use:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F
```

### Mobile App Issues

**Build failed:**
```bash
# Clean build
cd android
gradlew clean
gradlew assembleRelease
```

**Cannot connect to server:**
- Check server is running
- Verify IP address is correct
- Check firewall settings
- Ensure phone and server on same network

### Admin Panel Issues

**Cannot connect to server:**
- Verify server URL in Settings
- Check server is running
- Test URL in browser first

**Build failed:**
```bash
# Clean and rebuild
cd admin-panel
rm -rf node_modules dist
npm install
npm run build-win
```

---

## 🔐 Security Notes

### For Production:

1. **Change default passwords** in seed-data.js
2. **Enable MongoDB authentication**
3. **Use HTTPS** instead of HTTP
4. **Implement rate limiting**
5. **Regular backups** of database
6. **Update dependencies** regularly

---

## 📁 Project Structure

```
project/
├── server/                 # Backend server
│   ├── models/            # Face detection models
│   ├── uploads/           # User photos
│   ├── index.js           # Main server file
│   └── seed-data.js       # Database seeding
├── android/               # Android app build
├── admin-panel/           # Admin panel source
│   └── dist/             # Built installer
├── Admin-Panel-Installer/ # Distribution package
├── App.js                 # Main React Native app
└── package.json           # Dependencies
```

---

## 🌐 Network Configuration

### Local Network Setup:

1. **Server PC**: Run server on `http://192.168.x.x:3000`
2. **Mobile Devices**: Connect to same WiFi
3. **Admin Panel**: Configure server URL

### Internet Setup:

1. **Port Forwarding**: Forward port 3000 on router
2. **Dynamic DNS**: Use service like No-IP
3. **Update URLs**: Use public IP or domain

---

## 📊 System Requirements

### Server:
- OS: Windows/Linux/Mac
- RAM: 2GB minimum
- Disk: 1GB free space
- Network: Stable connection

### Mobile App:
- Android 7.0+
- 2GB RAM
- 100MB free space
- Camera access

### Admin Panel:
- Windows 7/8/10/11 (64-bit)
- 2GB RAM
- 500MB free space

---

## 🎓 Default Credentials

After running `seed-data.js`:

**Students:**
- `0246CS241001` / `aditya` (CSE Sem 1)
- `0246CS231001` / `aditya` (CSE Sem 3)
- `0246CS221001` / `aditya` (CSE Sem 5)

**Teachers:**
- `TEACH001` / `aditya` (Can edit timetables)
- `TEACH003` / `aditya` (Can edit timetables)

---

## 📞 Support

For issues:
1. Check this guide
2. Review error messages
3. Check server logs
4. Verify network connectivity

---

## 📝 License

MIT License - See LICENSE file

---

**Version**: 1.0.0  
**Last Updated**: October 25, 2025
