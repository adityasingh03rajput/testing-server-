# 🎓 College Attendance System

A comprehensive attendance management system with fingerprint authentication, real-time tracking, and admin panel.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Start MongoDB
Make sure MongoDB is running on `localhost:27017`

### 3. Seed Database
```bash
node server/seed-data.js
```

### 4. Start Server
```bash
node server/index.js
```

### 5. Open Admin Panel
Open `admin-panel/index.html` in your browser

---

## 📊 System Overview

### Data Included
- **33 Students** across 4 courses (CSE, ECE, ME, Civil)
- **10 Teachers** from all departments
- **12 Timetables** (3 semesters × 4 courses)
- **51 Classrooms** with WiFi BSSID
- **4,323 Attendance Records** (6 months of data)

### College Timings
```
Period 1:  09:40 - 10:40
Period 2:  10:40 - 11:40
Period 3:  11:40 - 12:10
Lunch:     12:10 - 13:10  🍽️
Period 5:  13:10 - 14:10
Break:     14:10 - 14:20  ☕
Period 7:  14:20 - 15:30
Period 8:  15:30 - 16:10
```

---

## 🔐 Test Credentials

### Students (Password: aditya)
- `0246CS241001` - Aditya Singh (CSE Sem 1)
- `0246CS231001` - Sneha Patel (CSE Sem 3)
- `0246CS221001` - Ravi Shankar (CSE Sem 5)
- `0246EC241001` - Ananya Gupta (ECE Sem 1)
- `0246ME241001` - Arjun Nair (ME Sem 1)
- `0246CE241001` - Rohit Verma (Civil Sem 1)

### Teachers (Password: aditya)
- `TEACH001` - Dr. Rajesh Kumar (CSE)
- `TEACH003` - Dr. Sunil Patil (CSE)
- `TEACH005` - Dr. Amit Patel (ECE)

---

## 🎯 Features

### Admin Panel
- **Dashboard**: Real-time statistics and analytics
- **Students**: Manage students with profile photos
- **Teachers**: Manage teachers and permissions
- **Timetables**: Create and edit timetables (8 periods/day)
- **Classrooms**: 51 rooms with BSSID and capacity
- **Attendance Reports**: Click student names for detailed reports
- **Bulk Import**: CSV upload for classrooms

### Mobile App (React Native)
- Fingerprint authentication
- Real-time attendance tracking
- WiFi-based location verification
- Student dashboard
- Attendance history

---

## 📁 Project Structure

```
fingerprint/
├── server/                 # Backend server
│   ├── index.js           # Main server file
│   ├── seed-data.js       # Database seeding
│   ├── clear-data.js      # Clear database
│   └── test-new-data.js   # Test data verification
├── admin-panel/           # Admin web interface
│   ├── index.html         # Main HTML
│   ├── renderer.js        # JavaScript logic
│   └── styles.css         # Styling
├── android/               # React Native Android
├── App.js                 # React Native main app
├── package.json           # RN dependencies
└── README.md             # This file
```

---

## 🔧 Management Commands

### Database
```bash
# Seed database with sample data
node server/seed-data.js

# Clear all data
node server/clear-data.js

# Test/verify data
node server/test-new-data.js
```

### Server
```bash
# Start server
node server/index.js

# Kill server (Windows)
taskkill /F /IM node.exe
```

### React Native App
```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android
```

---

## 📱 API Endpoints

### Students
- `GET /api/students` - List all students
- `GET /api/student-management?enrollmentNo=XXX` - Get student details
- `POST /api/students` - Add student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - List all teachers
- `POST /api/teachers` - Add teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Timetables
- `GET /api/timetable/:semester/:branch` - Get timetable
- `POST /api/timetable` - Save timetable

### Attendance
- `GET /api/attendance/records` - Get attendance records
- `GET /api/attendance/stats` - Get statistics
- `POST /api/attendance/record` - Record attendance

### Authentication
- `POST /api/login` - Student/Teacher login

---

## 🎨 Admin Panel Features

### Dashboard
- Total students, teachers, timetables
- Course-wise student distribution
- Semester-wise student distribution
- Attendance overview with rates

### Student Management
- View all students with profile photos
- Click name for detailed attendance report
- Add/Edit/Delete students
- Filter by course and semester
- Search functionality

### Classroom Management
- 51 rooms with complete details
- Room number, building, capacity
- WiFi BSSID for each room
- Bulk import via CSV
- Download CSV template

### Timetable Editor
- Visual timetable grid
- 8 periods per day
- Monday to Friday schedule
- Break indicators
- Export to JSON

---

## 💾 Database Schema

### Students
```javascript
{
  enrollmentNo: String,
  name: String,
  email: String,
  password: String,
  course: String,
  semester: String,
  dob: Date,
  phone: String,
  photoUrl: String
}
```

### Attendance Records
```javascript
{
  studentId: String,
  studentName: String,
  date: Date,
  status: 'present' | 'absent',
  checkInTime: Date,
  checkOutTime: Date,
  lecturesAttended: Number,
  totalLectures: Number,
  semester: String,
  branch: String
}
```

### Timetables
```javascript
{
  semester: String,
  branch: String,
  periods: [{ number, startTime, endTime }],
  timetable: {
    monday: [{ period, subject, room, isBreak }],
    tuesday: [...],
    // ... other days
  }
}
```

---

## 🔍 Troubleshooting

### MongoDB Not Connected
```bash
# Check MongoDB status
mongod --version

# Start MongoDB (Windows)
net start MongoDB
```

### Port Already in Use
```bash
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Admin Panel Not Loading Data
1. Check server is running on port 3000
2. Check browser console for errors
3. Verify MongoDB is connected
4. Reseed database if needed

---

## 📈 Statistics

### System Capacity
- **Total Rooms**: 51
- **Total Capacity**: 2,740 seats
- **60-seat rooms**: 35
- **40-seat rooms**: 16

### Data Volume
- **Students**: 33
- **Teachers**: 10
- **Timetables**: 12
- **Attendance Records**: 4,323
- **Date Range**: April 18 - Oct 18, 2025 (6 months)
- **Overall Attendance**: 79.02%

---

## 🎓 Courses & Semesters

### Available Courses
- **CSE** - Computer Science Engineering
- **ECE** - Electronics & Communication
- **ME** - Mechanical Engineering
- **Civil** - Civil Engineering

### Semesters
- Semester 1, 3, and 5 for each course
- Unique subjects per semester
- Complete timetables for all

---

## 🛠️ Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io for real-time updates

### Frontend (Admin Panel)
- HTML5
- CSS3
- Vanilla JavaScript
- No frameworks (lightweight)

### Mobile App
- React Native
- React Navigation
- Fingerprint authentication
- WiFi detection

---

## 📝 Notes

- All passwords are set to "aditya" for testing
- Attendance data is randomly generated (70-90% rate)
- Weekends excluded from attendance
- BSSID format: `XX:XX:XX:XX:XX:XX`
- Profile photos use UI Avatars API as fallback

---

## 🎉 Ready to Use!

Your attendance system is fully set up with:
- ✅ Database populated with realistic data
- ✅ Server running on port 3000
- ✅ Admin panel with all features
- ✅ 6 months of attendance history
- ✅ Profile photos for students
- ✅ Bulk import functionality
- ✅ 51 classrooms with BSSID

**Start using the system now!** 🚀

---

**Version**: 2.3.0  
**Last Updated**: October 18, 2025  
**Status**: ✅ Production Ready
