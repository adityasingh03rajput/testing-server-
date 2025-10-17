# 🚀 Admin Panel Quick Start Guide

## What You Got

A complete **standalone desktop application** for college management - just like Kiro IDE, no browser needed!

## 📁 Project Structure

```
fingerprint/
├── server/                    # Backend server
│   ├── index.js              # Server with all APIs
│   └── server_start.bat      # Start server
│
├── admin-panel/              # Desktop Application
│   ├── main.js               # Electron main process
│   ├── index.html            # UI layout
│   ├── styles.css            # Modern dark theme
│   ├── renderer.js           # All functionality
│   ├── package.json          # Dependencies
│   ├── start-admin.bat       # Quick start
│   ├── README.md             # Full documentation
│   ├── INSTALLATION.md       # Setup guide
│   └── FEATURES.md           # Complete feature list
│
└── App.js                    # Mobile app (React Native)
```

## ⚡ Quick Start (3 Steps)

### Step 1: Start the Server
```bash
cd server
npm install          # First time only
node index.js        # Or double-click server_start.bat
```
Server runs on: http://localhost:3000

### Step 2: Start Admin Panel
```bash
cd admin-panel
npm install          # First time only
npm start            # Or double-click start-admin.bat
```

### Step 3: Use the App!
- Desktop window opens automatically
- No browser needed
- Works like any desktop software

## 🎯 What You Can Do

### 1. **Manage Students**
- Add single student with all details
- Bulk import from CSV
- Search and filter
- Edit/Delete

**Fields:**
- Enrollment Number
- Name, Email, Password
- Course (CSE/ECE/ME/CE)
- Semester (1-8)
- Date of Birth
- Phone Number

### 2. **Manage Teachers**
- Add single teacher
- Bulk import from CSV
- **Assign timetable editing permission**
- Search and filter
- Edit/Delete

**Fields:**
- Employee ID
- Name, Email, Password
- Department
- Date of Birth
- Phone Number
- Can Edit Timetable (Yes/No)

### 3. **Manage Classrooms**
- Add classrooms
- Set WiFi BSSID for attendance
- Track capacity
- Active/Inactive status

**Fields:**
- Room Number
- Building
- Capacity
- WiFi BSSID (for location-based attendance)

### 4. **Manage Timetables**
- Create timetable for any semester/course
- 8 periods × 6 days grid
- Click any cell to edit
- Set subject, room, or mark as break
- **Only teachers with permission can edit in mobile app**

### 5. **Dashboard**
- See total counts
- Recent activity
- Server connection status

## 📊 CSV Import Format

### Students CSV:
```csv
enrollmentNo,name,email,password,course,semester,dob,phone
2021001,John Doe,john@college.edu,pass123,CSE,3,2003-05-15,9876543210
2021002,Jane Smith,jane@college.edu,pass456,ECE,3,2003-06-20,9876543211
```

### Teachers CSV:
```csv
employeeId,name,email,password,department,dob,phone,canEditTimetable
EMP001,Dr. Smith,smith@college.edu,pass123,CSE,1980-01-15,9876543220,true
EMP002,Prof. Johnson,johnson@college.edu,pass456,ECE,1975-03-20,9876543221,false
```

## 🎨 UI Features

- **Modern Dark Theme** - Cyberpunk aesthetic with neon accents
- **Sidebar Navigation** - Easy access to all sections
- **Real-time Status** - Server connection indicator
- **Search & Filter** - Find anything quickly
- **Modal Forms** - Clean data entry
- **Responsive Tables** - Smooth scrolling

## 🔧 Building Standalone .exe

Want to distribute without Node.js?

```bash
cd admin-panel
npm install
npm run build-win
```

Find installer in `admin-panel/dist/` folder!

## 🌐 Network Setup

### Same Computer:
- Server: http://localhost:3000
- Everything works out of the box

### Different Computers:
1. **On Server PC:**
   - Find IP: `ipconfig` (e.g., 192.168.1.100)
   - Allow port 3000 in firewall

2. **On Admin Panel PC:**
   - Open Settings in app
   - Change Server URL to: `http://192.168.1.100:3000`
   - Save

## 🔑 Key Features

✅ **Standalone Desktop App** - No browser, runs like native software  
✅ **Bulk Import** - CSV upload for students and teachers  
✅ **Permission System** - Control who can edit timetables  
✅ **WiFi BSSID** - Location-based attendance support  
✅ **Real-time Sync** - Updates mobile app instantly  
✅ **Dark Theme** - Modern, professional look  
✅ **Offline Fallback** - Works without MongoDB  
✅ **Cross-platform** - Windows, Linux, macOS  

## 📱 Mobile App Integration

The admin panel syncs with your React Native mobile app:
- Students can see their timetable
- Teachers with permission can edit timetables
- Real-time attendance tracking
- All data synced via server

## 🆘 Troubleshooting

### "Cannot connect to server"
- Make sure server is running (`node index.js`)
- Check server URL in Settings
- Default: http://localhost:3000

### "Port 3000 already in use"
- Close other applications using port 3000
- Or change port in `server/index.js`

### Admin panel window is blank
- Press `Ctrl+Shift+I` to see errors
- Reinstall: `npm install` in admin-panel folder

### MongoDB not connected
- App works without MongoDB (uses memory)
- Install MongoDB for persistent storage
- Or ignore - it's optional!

## 📚 Full Documentation

- **README.md** - Complete usage guide
- **INSTALLATION.md** - Detailed setup instructions
- **FEATURES.md** - All 100+ features explained

## 🎯 Next Steps

1. ✅ Start server
2. ✅ Start admin panel
3. ✅ Add some classrooms
4. ✅ Add teachers (assign timetable permission)
5. ✅ Add students (single or bulk)
6. ✅ Create timetables
7. ✅ Test with mobile app

## 💡 Pro Tips

- Use bulk import for large datasets
- Assign timetable permission carefully
- Set WiFi BSSID for accurate attendance
- Keep server running for mobile app sync
- Build .exe for easy distribution

## 🎉 You're Ready!

You now have a complete college management system:
- ✅ Desktop admin panel (this)
- ✅ Backend server (Node.js)
- ✅ Mobile app (React Native)
- ✅ Database (MongoDB optional)

Everything syncs in real-time!

---

**Need Help?** Check the full documentation in `admin-panel/` folder.

**Want More Features?** The codebase is modular and easy to extend!

**Enjoy!** 🚀
