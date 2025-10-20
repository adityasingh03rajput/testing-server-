# Quick Start Guide

Get the College Attendance System running in 10 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (`node --version`)
- ✅ MongoDB installed and running
- ✅ Git installed
- ✅ 10GB free disk space

## 5-Minute Setup

### 1. Clone & Install (2 minutes)

```bash
# Clone repository
git clone <repository-url>
cd attendance-system

# Install all dependencies
npm install
cd server && npm install
cd ../admin-panel && npm install
cd ..
```

### 2. Download Models (1 minute)

```bash
cd server
node download-models.js
```

### 3. Initialize Database (1 minute)

```bash
# Still in server directory
node init-db.js
node seed-data.js
```

### 4. Configure Network (1 minute)

Find your IP address:
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

Update these files with your IP (e.g., `192.168.1.100`):
- `App.js` (lines 13-14)
- `admin-panel/renderer.js` (line 4)

### 5. Start Everything (30 seconds)

Open 3 terminals:

**Terminal 1 - Server:**
```bash
server_start.bat
```

**Terminal 2 - Mobile App:**
```bash
START_APP.bat
# Press 'a' for Android
```

**Terminal 3 - Admin Panel:**
```bash
cd admin-panel
start-admin.bat
```

## Test Login

### Admin Panel
1. Open admin panel
2. Check "Connected" status (green)
3. View dashboard statistics

### Mobile App
**Student Login:**
- Enrollment: `CSE001`
- Password: `password123`

**Teacher Login:**
- Employee ID: `T001`
- Password: `password123`

## Common Issues

### MongoDB Not Running
```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### Port 3000 Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
lsof -i :3000
kill -9 <PID>
```

### Mobile App Can't Connect
1. Check server is running (Terminal 1)
2. Verify IP address is correct
3. Ensure devices on same WiFi
4. Disable firewall temporarily

### Face Recognition Not Working
```bash
cd server
node download-models.js
```

## Next Steps

1. **Add Your Data**
   - Open admin panel
   - Add students via "Students" tab
   - Add teachers via "Teachers" tab
   - Upload profile photos

2. **Create Timetables**
   - Go to "Timetable" tab
   - Select semester and course
   - Click "Create Timetable"
   - Fill in subjects and rooms

3. **Test Attendance**
   - Login as student on mobile
   - Take profile photo
   - Verify face
   - Start attendance timer

## Quick Commands

### Server
```bash
# Start
server_start.bat

# Restart
RESTART_SERVER.bat

# Check health
CHECK_SERVER_HEALTH.bat
```

### Mobile App
```bash
# Start
START_APP.bat

# Build APK
BUILD_DEBUG_APK.bat

# Quick build & install
BUILD_AND_INSTALL.bat
```

### Database
```bash
cd server

# Seed data
node seed-data.js

# Seed attendance
node seed-detailed-attendance.js

# Assign teachers
node assign-teachers-to-timetable.js
```

## File Structure

```
attendance-system/
├── server/              # Backend server
│   ├── index.js        # Main server file
│   ├── models/         # Face recognition models
│   └── uploads/        # Profile photos
├── admin-panel/        # Admin desktop app
│   ├── index.html
│   ├── renderer.js
│   └── styles.css
├── App.js              # Mobile app main file
├── package.json        # Mobile app dependencies
└── android/            # Android build files
```

## Default Ports

- Server: `3000`
- MongoDB: `27017`
- Admin Panel: Electron app (no port)
- Mobile App: Expo dev server (19000, 19001, 19002)

## Useful URLs

- Server Health: `http://localhost:3000/api/health`
- API Config: `http://localhost:3000/api/config`
- Uploaded Photos: `http://localhost:3000/uploads/`

## Keyboard Shortcuts

### Admin Panel
- `Ctrl+R` - Refresh
- `Ctrl+Shift+I` - Developer tools
- `Ctrl+Q` - Quit

### Mobile App (Expo)
- `a` - Open on Android
- `i` - Open on iOS
- `w` - Open in web browser
- `r` - Reload app
- `m` - Toggle menu

## Tips

1. **Keep terminals open** - Don't close the terminal windows
2. **Check logs** - Watch terminal output for errors
3. **Use same network** - All devices must be on same WiFi
4. **Update IP** - If IP changes, update config files
5. **Clear cache** - If issues, clear app cache and restart

## Getting Help

1. Check error messages in terminals
2. Read full documentation in `README.md`
3. Check `INSTALL.md` for detailed setup
4. Review `API_DOCUMENTATION.md` for API details
5. See `TROUBLESHOOTING.md` for common issues

## Production Deployment

For production deployment, see `DEPLOYMENT.md`.

## Video Tutorial

[Link to video tutorial if available]

## Support

- GitHub Issues: [repository-url]/issues
- Email: [support-email]
- Documentation: All `.md` files in root directory

---

**That's it! You're ready to go! 🚀**

If everything is working:
- ✅ Server shows "Connected to MongoDB"
- ✅ Admin panel shows "Connected" (green)
- ✅ Mobile app shows login screen
- ✅ You can login with test credentials

Happy coding! 🎓
