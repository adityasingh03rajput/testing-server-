# 🔐 Login Credentials - Attendance System

## 📱 Mobile App Login

### 👨‍🎓 Students

**Format:** Enrollment Number + Password

| Enrollment No | Name | Password | Course | Semester |
|--------------|------|----------|--------|----------|
| 0246CS241001 | Aditya Singh | aditya | CSE | 1 |
| 0246CS241002 | Priya Sharma | aditya | CSE | 1 |
| 0246CS241003 | Rahul Kumar | aditya | CSE | 1 |
| 0246CS241004 | Ankit Jain | aditya | CSE | 1 |
| 0246CS231001 | Sneha Patel | aditya | CSE | 3 |
| 0246CS231002 | Vikram Reddy | aditya | CSE | 3 |
| 0246CS231003 | Amit Verma | aditya | CSE | 3 |
| 0246CS231004 | Ritu Gupta | aditya | CSE | 3 |
| 0246CS221001 | Ravi Shankar | aditya | CSE | 5 |

**All students have password:** `aditya`

### 👨‍🏫 Teachers

**Format:** Employee ID + Password

| Employee ID | Name | Password | Department | Subject |
|------------|------|----------|------------|---------|
| TEACH001 | Dr. Rajesh Kumar | aditya | CSE | Data Structures |
| TEACH002 | Prof. Meera Singh | aditya | CSE | Database Management |
| TEACH003 | Dr. Amit Patel | aditya | CSE | Operating Systems |
| TEACH004 | Prof. Sunita Rao | aditya | CSE | Computer Networks |

**All teachers have password:** `aditya`

---

## 💻 Admin Panel

### Access Admin Panel

**Location:** `admin-panel/index.html`

**To Start:**
```bash
cd admin-panel
npm install
npm start
```

**Or use batch file:**
```bash
admin-panel\start-admin.bat
```

### Admin Features
- View all students
- View all teachers
- Manage attendance records
- View statistics
- Edit timetables
- Generate reports

---

## 🚀 Quick Start

### 1. Start Server
```bash
cd server
npm install
npm start
```

### 2. Seed Database (First Time)
```bash
cd server
node seed-data.js
```

### 3. Start Admin Panel
```bash
cd admin-panel
start-admin.bat
```

### 4. Login to Mobile App
- Open app on phone
- Select role (Student/Teacher)
- Enter credentials above

---

## 📊 Server Endpoints

**Base URL:** `http://192.168.9.31:3000`

### Login
```
POST /api/login
Body: { "id": "0246CS241001", "password": "aditya" }
```

### Get Students
```
GET /api/students
```

### Get Teachers
```
GET /api/teachers
```

### Mark Attendance
```
POST /api/attendance
Body: { "studentId": "0246CS241001", "status": "present" }
```

---

## 🔒 Security Notes

⚠️ **IMPORTANT:** These are default credentials for development/testing only!

**For Production:**
1. Change all default passwords
2. Use strong passwords (min 12 characters)
3. Enable MongoDB authentication
4. Use environment variables for secrets
5. Implement password reset functionality

---

## 📝 Notes

- All passwords are hashed with bcrypt in database
- Default password: `aditya` (for easy testing)
- Server must be running for login to work
- Phone and PC must be on same WiFi network
- IP Address: `192.168.9.31:3000`

---

## 🆘 Troubleshooting

### Can't Login?
1. Check server is running: `http://192.168.9.31:3000/health`
2. Verify database is seeded: `node server/seed-data.js`
3. Check WiFi connection
4. Verify IP address matches

### Admin Panel Not Working?
1. Install dependencies: `cd admin-panel && npm install`
2. Check server is running
3. Open browser console for errors

---

**Last Updated:** October 25, 2025
