# Installation Guide

Complete step-by-step guide to set up the College Attendance System.

## System Requirements

### Hardware
- Minimum 4GB RAM
- 10GB free disk space
- Webcam (for admin panel photo capture)
- Android device or emulator (for mobile app)

### Software
- Windows 10/11, macOS, or Linux
- Node.js v16 or higher
- MongoDB v4.4 or higher
- Android Studio (for Android builds)
- Git

## Step-by-Step Installation

### 1. Install Prerequisites

#### Install Node.js
1. Download from https://nodejs.org/
2. Install LTS version
3. Verify installation:
```bash
node --version
npm --version
```

#### Install MongoDB
**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Run installer
3. Install as Windows Service
4. Verify installation:
```bash
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

#### Install Android Studio (Optional - for building APK)
1. Download from https://developer.android.com/studio
2. Install Android SDK
3. Set up environment variables:
   - `ANDROID_HOME` = path to Android SDK
   - Add `%ANDROID_HOME%\platform-tools` to PATH

### 2. Clone Repository

```bash
git clone <repository-url>
cd attendance-system
```

### 3. Install Dependencies

#### Server
```bash
cd server
npm install
```

#### Mobile App
```bash
cd ..
npm install
```

#### Admin Panel
```bash
cd admin-panel
npm install
```

### 4. Download Face Recognition Models

```bash
cd server
node download-models.js
```

This will download required face-api.js models (~10MB).

### 5. Initialize Database

```bash
cd server
node init-db.js
```

This creates necessary indexes for optimal performance.

### 6. Seed Sample Data (Optional)

```bash
# Seed students and teachers
node seed-data.js

# Seed attendance records
node seed-detailed-attendance.js

# Assign teachers to timetable
node assign-teachers-to-timetable.js
```

### 7. Configure Network

#### Find Your IP Address

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

#### Update Configuration Files

1. **App.js** (line 13-14):
```javascript
const API_URL = 'http://YOUR_IP:3000/api/config';
const SOCKET_URL = 'http://YOUR_IP:3000';
```

2. **FaceVerificationScreen.js** (line 8):
```javascript
const SERVER_URL = 'http://YOUR_IP:3000';
```

3. **ProfileScreen.js** (line 7):
```javascript
const SERVER_URL = 'http://YOUR_IP:3000';
```

4. **CalendarScreen.js** (line 7):
```javascript
const SERVER_URL = 'http://YOUR_IP:3000';
```

5. **admin-panel/renderer.js** (line 4):
```javascript
let SERVER_URL = 'http://YOUR_IP:3000';
```

Replace `YOUR_IP` with your actual IP address (e.g., `192.168.1.100`).

### 8. Start the System

#### Terminal 1 - Start MongoDB (if not running as service)
```bash
mongod
```

#### Terminal 2 - Start Server
```bash
# Windows
server_start.bat

# Linux/macOS
cd server
node index.js
```

#### Terminal 3 - Start Mobile App
```bash
# Windows
START_APP.bat

# Linux/macOS
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for Web

#### Terminal 4 - Start Admin Panel
```bash
# Windows
cd admin-panel
start-admin.bat

# Linux/macOS
cd admin-panel
npm start
```

## Verification

### 1. Check Server
Open browser: `http://localhost:3000/api/health`

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 2. Check Admin Panel
- Server status indicator should show "Connected" (green)
- Dashboard should load with statistics

### 3. Check Mobile App
- Should show login screen
- Try logging in with seeded credentials

## Default Credentials (After Seeding)

### Students
- Enrollment: `CSE001` to `CSE050`
- Password: `password123`

### Teachers
- Employee ID: `T001` to `T020`
- Password: `password123`

## Troubleshooting

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

### Port Already in Use
```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :3000
kill -9 <PID>
```

### Face Recognition Models Not Found
```bash
cd server
node download-models.js
```

### Mobile App Can't Connect
1. Ensure server is running
2. Check IP address is correct
3. Ensure devices are on same network
4. Disable firewall temporarily to test
5. Check Windows Firewall allows Node.js

### Admin Panel Shows Disconnected
1. Check server is running
2. Update `SERVER_URL` in `admin-panel/renderer.js`
3. Check browser console for errors

## Building for Production

### Android APK

#### Debug Build (for testing)
```bash
BUILD_DEBUG_APK.bat
```

#### Release Build (for distribution)
1. Generate keystore:
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Update `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your-password
MYAPP_RELEASE_KEY_PASSWORD=your-password
```

3. Build:
```bash
BUILD_APK_NOW.bat
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Admin Panel Executable

```bash
cd admin-panel
npm run build
```

This creates a standalone executable in `admin-panel/dist/`.

## Next Steps

1. Add your own students and teachers via admin panel
2. Upload profile photos for face recognition
3. Create timetables for each semester/course
4. Configure classrooms with WiFi BSSIDs
5. Test attendance marking with face verification

## Support

For issues:
1. Check logs in server console
2. Check browser console (admin panel)
3. Check React Native logs (mobile app)
4. Open GitHub issue with error details

## Security Notes

⚠️ **Important for Production:**

1. Change default passwords
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Implement proper authentication
5. Set up MongoDB authentication
6. Configure firewall rules
7. Regular backups

## Performance Tips

1. Use MongoDB indexes (already created by init-db.js)
2. Limit photo sizes (max 2MB recommended)
3. Clean old attendance records periodically
4. Monitor server resources
5. Use production build for mobile app

## Updating

```bash
# Pull latest changes
git pull

# Update dependencies
npm install
cd server && npm install
cd ../admin-panel && npm install

# Restart services
```

## Uninstallation

```bash
# Stop all services
# Delete project folder
# Optionally drop MongoDB database:
mongo
use attendance_app
db.dropDatabase()
```
