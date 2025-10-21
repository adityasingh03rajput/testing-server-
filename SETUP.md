# Complete Project Setup Guide

**College Attendance System with Face Recognition**

A comprehensive attendance management system with face recognition, real-time tracking, and admin panel for Indian colleges.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Building APK](#building-apk)
6. [Database Setup](#database-setup)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Project Structure](#project-structure)
10. [API Documentation](#api-documentation)
11. [Features](#features)

---

## 🖥️ System Requirements

### Hardware
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 10GB free space
- **Processor**: Intel i3 or equivalent
- **Webcam**: For admin panel photo capture
- **Android Device**: For mobile app testing

### Software
- **OS**: Windows 10/11, macOS, or Linux
- **Node.js**: v16 or higher
- **MongoDB**: v4.4 or higher
- **Android Studio**: Latest version (for APK building)
- **Git**: Latest version

---

## 🚀 Installation Steps

### Step 1: Install Prerequisites

#### 1.1 Install Node.js
```bash
# Download from https://nodejs.org/
# Verify installation
node --version
npm --version
```

#### 1.2 Install MongoDB
**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Install as Windows Service
# Verify
mongod --version
```

**Linux (Ubuntu/Debian):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### 1.3 Install Android Studio (Optional - for APK building)
- Download from https://developer.android.com/studio
- Install Android SDK
- Set environment variables:
  - `ANDROID_HOME` = path to Android SDK
  - Add `%ANDROID_HOME%\platform-tools` to PATH

### Step 2: Clone Repository

```bash
git clone https://github.com/adityasingh03rajput/native-bunk.git
cd native-bunk
```

### Step 3: Install Dependencies

#### 3.1 Mobile App Dependencies
```bash
npm install
```

#### 3.2 Server Dependencies
```bash
cd server
npm install
cd ..
```

#### 3.3 Admin Panel Dependencies
```bash
cd admin-panel
npm install
cd ..
```

### Step 4: Download Face Recognition Models

```bash
cd server
node download-models.js
cd ..
```

This downloads ~10MB of face-api.js models required for face recognition.

### Step 5: Initialize Database

```bash
cd server
node init-db.js
```

This creates necessary indexes for optimal performance.

### Step 6: Seed Sample Data (Optional)

```bash
cd server

# Seed students and teachers
node seed-data.js

# Seed attendance records
node seed-detailed-attendance.js

# Assign teachers to timetable
node assign-teachers-to-timetable.js

cd ..
```

---

## ⚙️ Configuration

### 1. Find Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Linux/macOS:**
```bash
ifconfig
# or
ip addr show
```

### 2. Update Configuration Files

Replace `YOUR_IP` with your actual IP address (e.g., `192.168.1.100`) in these files:

#### 2.1 App.js (lines 13-14)
```javascript
const API_URL = 'http://YOUR_IP:3000/api/config';
const SOCKET_URL = 'http://YOUR_IP:3000';
```

#### 2.2 FaceVerificationScreen.js (line 8)
```javascript
const SERVER_URL = 'http://YOUR_IP:3000';
```

#### 2.3 ProfileScreen.js (line 7)
```javascript
const SERVER_URL = 'http://YOUR_IP:3000';
```

#### 2.4 CalendarScreen.js (line 7)
```javascript
const SERVER_URL = 'http://YOUR_IP:3000';
```

#### 2.5 admin-panel/renderer.js (line 4)
```javascript
let SERVER_URL = 'http://YOUR_IP:3000';
```

### 3. Environment Variables (Optional)

Create `server/.env` file:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/attendance_app
```

---

## 🏃 Running the Application

### Start MongoDB (if not running as service)
```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community
```

### Start Server
```bash
# Option 1: Using batch file (Windows)
server_start.bat

# Option 2: Manual
cd server
node index.js
```

Server will start on `http://localhost:3000`

### Start Mobile App
```bash
# Option 1: Using batch file (Windows)
START_APP.bat

# Option 2: Manual
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for Web

### Start Admin Panel
```bash
# Option 1: Using batch file (Windows)
cd admin-panel
start-admin.bat

# Option 2: Manual
cd admin-panel
npm start
```

---

## 📦 Building APK

### Debug Build (for testing)
```bash
BUILD_DEBUG_APK.bat
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for distribution)

1. Generate keystore:
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore attendance-release.keystore -alias attendance-key -keyalg RSA -keysize 2048 -validity 10000
```

2. Update `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=attendance-release.keystore
MYAPP_RELEASE_KEY_ALIAS=attendance-key
MYAPP_RELEASE_STORE_PASSWORD=your-password
MYAPP_RELEASE_KEY_PASSWORD=your-password
```

3. Build:
```bash
BUILD_APK_NOW.bat
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Quick Build & Install
```bash
BUILD_AND_INSTALL.bat
```

---

## 🗄️ Database Setup

### Default Credentials (After Seeding)

**Students:**
- Enrollment: `0246CS241001` to `0246CS241050`
- Password: `aditya`

**Teachers:**
- Employee ID: `T001` to `T020`
- Password: `aditya`

### Database Collections

- `studentmanagements` - Student profiles
- `teachers` - Teacher profiles
- `attendancerecords` - Attendance data
- `timetables` - Class schedules
- `classrooms` - Room information
- `holidays` - Calendar events

### Backup Database
```bash
mongodump --uri="mongodb://localhost:27017/attendance_app" --out="backup_$(date +%Y%m%d)"
```

### Restore Database
```bash
mongorestore --uri="mongodb://localhost:27017/attendance_app" --drop /path/to/backup
```

---

## 🧪 Testing

### Test Server Health
```bash
CHECK_SERVER_HEALTH.bat
```

Or visit: `http://localhost:3000/api/health`

### Test Login

**Admin Panel:**
1. Open admin panel
2. Check "Connected" status (green)
3. View dashboard statistics

**Mobile App:**
- Student: `0246CS241001` / `aditya`
- Teacher: `T001` / `aditya`

---

## 🔧 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
# Windows
sc query MongoDB

# Linux
sudo systemctl status mongod

# Start MongoDB
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### Port 3000 Already in Use
```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
lsof -i :3000
kill -9 <PID>
```

### Face Recognition Not Working
```bash
cd server
node download-models.js
```

Ensure `server/models` directory exists with model files.

### Mobile App Can't Connect
1. Check server is running
2. Verify IP address is correct
3. Ensure devices on same WiFi
4. Disable firewall temporarily
5. Check Windows Firewall allows Node.js

### Admin Panel Shows Disconnected
1. Check server is running
2. Update `SERVER_URL` in `admin-panel/renderer.js`
3. Check browser console for errors
4. Try `Ctrl+R` to reload

---

## 📁 Project Structure

```
attendance-system/
├── server/                     # Backend server
│   ├── index.js               # Main server file
│   ├── models/                # Face recognition models
│   ├── uploads/               # Profile photos
│   ├── seed-data.js           # Data seeding scripts
│   └── package.json           # Server dependencies
│
├── admin-panel/               # Admin desktop app
│   ├── index.html             # Main HTML
│   ├── renderer.js            # Main logic
│   ├── styles.css             # Styles
│   ├── main.js                # Electron main
│   └── package.json           # Admin dependencies
│
├── android/                   # Android build files
│   ├── app/                   # App configuration
│   └── gradle/                # Gradle wrapper
│
├── App.js                     # Mobile app main file
├── CalendarScreen.js          # Calendar component
├── ProfileScreen.js           # Profile component
├── TimetableScreen.js         # Timetable component
├── FaceVerificationScreen.js  # Face verification
├── Colors.js                  # Color system
├── package.json               # Mobile app dependencies
└── SETUP.md                   # This file
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
```http
POST /api/login
Content-Type: application/json

{
  "id": "CSE001",
  "password": "password123"
}
```

### Students
```http
GET    /api/students              # Get all students
POST   /api/students              # Add student
PUT    /api/students/:id          # Update student
DELETE /api/students/:id          # Delete student
GET    /api/student-management    # Get by enrollment
```

### Teachers
```http
GET    /api/teachers              # Get all teachers
POST   /api/teachers              # Add teacher
PUT    /api/teachers/:id          # Update teacher
DELETE /api/teachers/:id          # Delete teacher
```

### Timetable
```http
GET    /api/timetable/:semester/:branch    # Get timetable
POST   /api/timetable                      # Save timetable
GET    /api/teacher-schedule/:id/:day     # Teacher schedule
```

### Attendance
```http
POST   /api/attendance/record              # Save attendance
GET    /api/attendance/records             # Get records
GET    /api/attendance/stats               # Get statistics
```

### Face Verification
```http
POST   /api/verify-face                    # Verify face
POST   /api/upload-photo                   # Upload photo
```

### Holidays
```http
GET    /api/holidays                       # Get all holidays
POST   /api/holidays                       # Add holiday
PUT    /api/holidays/:id                   # Update holiday
DELETE /api/holidays/:id                   # Delete holiday
GET    /api/holidays/range                 # Get by date range
```

---

## ✨ Features

### Mobile App (Student)
- ✅ Face verification for attendance
- ✅ Real-time attendance tracking
- ✅ Lecture-wise attendance breakdown
- ✅ Calendar with holidays
- ✅ Timetable view
- ✅ Profile with digital lanyard
- ✅ Notifications
- ✅ Dark/Light themes
- ✅ Offline support

### Mobile App (Teacher)
- ✅ Live attendance monitoring
- ✅ Student management
- ✅ Attendance reports
- ✅ Personal schedule
- ✅ Real-time updates

### Admin Panel
- ✅ Student management
- ✅ Teacher management
- ✅ Timetable editor
- ✅ Classroom management
- ✅ Calendar with holidays
- ✅ Photo upload with face detection
- ✅ Bulk import (CSV)
- ✅ Attendance reports
- ✅ Analytics dashboard

### Backend
- ✅ RESTful API
- ✅ WebSocket real-time updates
- ✅ Face recognition (face-api.js)
- ✅ MongoDB database
- ✅ Photo storage
- ✅ Indian holidays support

---

## 🎨 Color System

The app uses an Indian-themed color palette:
- **Primary**: Saffron Orange (#FF6B35)
- **Secondary**: Indian Green (#138808)
- **Accent**: Navy Blue (#000080)
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)

See `Colors.js` for complete color system.

---

## 📞 Support

### Common Issues
1. **MongoDB not connecting** - Ensure MongoDB is running
2. **Port conflicts** - Kill process using port 3000
3. **Face recognition fails** - Download models again
4. **App can't connect** - Check IP address and firewall

### Resources
- GitHub: https://github.com/adityasingh03rajput/native-bunk
- Issues: Open GitHub issue with error details

---

## 🔄 Updating

```bash
# Pull latest changes
git pull

# Update dependencies
npm install
cd server && npm install
cd ../admin-panel && npm install

# Restart services
```

---

## 📝 Notes

- All passwords are `aditya` for testing
- Attendance data includes detailed lecture-wise breakdown
- Each day has 6 classes with varying durations
- Attendance calculated based on 75% rule
- Sundays automatically marked as leave days
- Indian date format (DD/MM/YYYY) used throughout
- Indian holidays pre-configured

---

## 🚀 Quick Start Commands

```bash
# Complete setup
npm install
cd server && npm install && node download-models.js && node init-db.js && node seed-data.js
cd ../admin-panel && npm install
cd ..

# Start everything
server_start.bat          # Terminal 1
npm start                 # Terminal 2 (press 'a' for Android)
cd admin-panel && npm start  # Terminal 3

# Build APK
BUILD_DEBUG_APK.bat
```

---

**That's it! You're ready to go! 🎉**

For detailed information about specific features, check the inline code comments or open a GitHub issue.
