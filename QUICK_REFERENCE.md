# 📋 Quick Reference Card

## ⚡ Quick Start Commands

```bash
# Setup (first time only)
SETUP_EVERYTHING.bat

# Start Server
cd server
node index.js

# Start Admin Panel
cd admin-panel
npm start

# Build Executable
cd admin-panel
npm run build-win
```

---

## 🔗 URLs

- **Server:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health
- **Admin Panel:** Desktop window (auto-opens)

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save timetable |
| `Ctrl+F` | Focus search |
| `Escape` | Close modal/notification |

---

## 📊 CSV Format Examples

### Students
```csv
enrollmentNo,name,email,password,course,semester,dob,phone
2021001,John Doe,john@college.edu,pass123,CSE,3,2003-05-15,9876543210
```

### Teachers
```csv
employeeId,name,email,password,department,dob,phone,canEditTimetable
EMP001,Dr. Smith,smith@college.edu,pass123,CSE,1980-01-15,9876543210,true
```

### Classrooms
```csv
roomNumber,building,capacity,wifiBSSID,isActive
101,Main Block,60,AA:BB:CC:DD:EE:FF,true
```

---

## 🔧 API Endpoints

### Students
```
GET    /api/students
POST   /api/students
POST   /api/students/bulk
PUT    /api/students/:id
DELETE /api/students/:id
```

### Teachers
```
GET    /api/teachers
POST   /api/teachers
POST   /api/teachers/bulk
PUT    /api/teachers/:id
PUT    /api/teachers/:id/timetable-access
DELETE /api/teachers/:id
```

### Classrooms
```
GET    /api/classrooms
POST   /api/classrooms
PUT    /api/classrooms/:id
DELETE /api/classrooms/:id
```

### Timetables
```
GET    /api/timetable/:semester/:branch
POST   /api/timetable
```

---

## 🎯 Common Tasks

### Add Student
1. Click "Students"
2. Click "➕ Add Student"
3. Fill form
4. Click "Add Student"

### Bulk Import
1. Click "📤 Bulk Import"
2. Upload CSV
3. Click "Import"

### Edit Record
1. Click "Edit" button
2. Modify fields
3. Click "Update"

### Export Data
1. Click "📥 Export CSV"
2. File downloads

### Create Timetable
1. Click "Timetable"
2. Select semester & course
3. Click "➕ Create Timetable"
4. Click cells to edit
5. Click "Save Timetable"

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Server won't start | Check port 3000 is free |
| Admin panel blank | Press Ctrl+Shift+I, check console |
| Can't connect | Verify server is running |
| MongoDB error | It's optional, app works without it |
| Port in use | Change port in server/index.js |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `ADMIN_PANEL_QUICKSTART.md` | Start here! |
| `FINAL_SUMMARY.md` | Complete overview |
| `TEST_ADMIN_PANEL.md` | Testing guide |
| `admin-panel/renderer.js` | All functionality |
| `server/index.js` | All APIs |

---

## 🎨 UI Sections

1. **Dashboard** - Statistics & activity
2. **Students** - Student management
3. **Teachers** - Teacher management
4. **Timetable** - Timetable editor
5. **Classrooms** - Classroom management
6. **Settings** - Configuration

---

## 💡 Pro Tips

- Use Ctrl+S to save quickly
- Export data regularly for backup
- Use bulk import for large datasets
- Assign timetable permissions carefully
- Set WiFi BSSID for attendance
- Use global search for quick access

---

## 📞 Quick Help

**Documentation:** Check .md files in root folder  
**Testing:** Use TEST_ADMIN_PANEL.md  
**Features:** See admin-panel/FEATURES.md  
**Setup:** Run SETUP_EVERYTHING.bat  

---

## ✅ Quick Test (2 Minutes)

1. Start server & admin panel
2. Add one student
3. Edit the student
4. Export to CSV
5. Delete the student

If all work → System is ready! ✅

---

**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Support:** Check documentation files
