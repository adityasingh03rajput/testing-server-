# College Attendance System

A comprehensive attendance management system with face recognition, real-time tracking, and admin panel.

## Features

- 📱 **Mobile App** (React Native/Expo)
  - Student & Teacher login
  - Face verification for attendance
  - Real-time attendance tracking
  - Timetable view
  - Attendance history & statistics
  - Digital lanyard card
  - Push notifications

- 🖥️ **Admin Panel** (Electron)
  - Student management
  - Teacher management
  - Classroom management
  - Timetable creation & editing
  - Attendance reports
  - Photo upload with face detection
  - Bulk import (CSV)

- 🔧 **Backend Server** (Node.js/Express)
  - RESTful API
  - WebSocket for real-time updates
  - MongoDB database
  - Face recognition (face-api.js)
  - Photo storage & management

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Android Studio (for Android builds)
- Python & UV (for face recognition models)

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd attendance-system
```

### 2. Install Server Dependencies
```bash
cd server
npm install
```

### 3. Download Face Recognition Models
```bash
node download-models.js
```

### 4. Install Mobile App Dependencies
```bash
cd ..
npm install
```

### 5. Install Admin Panel Dependencies
```bash
cd admin-panel
npm install
```

## Configuration

### Server Configuration
1. Copy `.env.example` to `.env` in the `server` directory
2. Update MongoDB URI and other settings as needed

### Mobile App Configuration
1. Update `API_URL` and `SOCKET_URL` in `App.js` with your server IP
2. Update the same URLs in other screen files

### Admin Panel Configuration
1. Update `SERVER_URL` in `admin-panel/renderer.js` with your server IP

## Running the Application

### Start MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Start Server
```bash
# Option 1: Using batch file (Windows)
server_start.bat

# Option 2: Manual
cd server
node index.js
```

### Start Mobile App
```bash
# Option 1: Using batch file (Windows)
START_APP.bat

# Option 2: Manual
npm start
# Then press 'a' for Android or 'i' for iOS
```

### Start Admin Panel
```bash
# Option 1: Using batch file (Windows)
cd admin-panel
start-admin.bat

# Option 2: Manual
cd admin-panel
npm start
```

## Building Android APK

### Debug Build
```bash
BUILD_DEBUG_APK.bat
```

### Release Build
```bash
BUILD_APK_NOW.bat
```

### Quick Build & Install
```bash
BUILD_AND_INSTALL.bat
```

## Seeding Data

### Seed Students & Teachers
```bash
cd server
node seed-data.js
```

### Seed Attendance Records
```bash
node seed-attendance.js
# or
node seed-detailed-attendance.js
# or
node seed-complete-attendance-history.js
```

### Assign Teachers to Timetable
```bash
node assign-teachers-to-timetable.js
```

## Utility Scripts

### Check Server Health
```bash
CHECK_SERVER_HEALTH.bat
```

### Restart Server
```bash
RESTART_SERVER.bat
```

### Fix Connection Issues
```bash
FIX_CONNECTION_NOW.bat
```

### Kill & Restart All
```bash
kill-and-restart.bat
```

## API Endpoints

### Authentication
- `POST /api/login` - Student/Teacher login

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Add student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk` - Bulk import students
- `GET /api/student-management` - Get student by enrollment number

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Add teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher
- `POST /api/teachers/bulk` - Bulk import teachers
- `PUT /api/teachers/:id/timetable-access` - Toggle timetable access

### Timetable
- `GET /api/timetable/:semester/:branch` - Get timetable
- `POST /api/timetable` - Create/Update timetable
- `GET /api/teacher-schedule/:teacherId/:day` - Get teacher schedule

### Attendance
- `POST /api/attendance/record` - Save attendance record
- `GET /api/attendance/records` - Get attendance records (with filters)
- `GET /api/attendance/stats` - Get attendance statistics

### Face Verification
- `POST /api/verify-face` - Verify face for attendance

### Classrooms
- `GET /api/classrooms` - Get all classrooms
- `POST /api/classrooms` - Add classroom
- `PUT /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom

### Uploads
- `POST /api/upload-photo` - Upload photo with face detection
- `GET /api/photo/:filename` - Get photo by filename

### Health
- `GET /api/health` - Server health check
- `GET /api/config` - Get SDUI configuration

## WebSocket Events

### Client → Server
- `timer_update` - Update student timer status

### Server → Client
- `student_update` - Student status changed
- `student_registered` - New student registered
- `timetable_updated` - Timetable updated

## Database Schema

### Student
- enrollmentNo (unique)
- name
- email
- password (hashed)
- course
- semester
- dob
- phone
- photoUrl

### Teacher
- employeeId (unique)
- name
- email
- password (hashed)
- department
- subject
- dob
- phone
- photoUrl
- canEditTimetable

### Timetable
- semester
- branch
- periods (array)
- timetable (object with days)

### AttendanceRecord
- studentId
- studentName
- enrollmentNumber
- date
- status (present/absent/leave)
- lectures (array)
- totalAttended
- totalClassTime
- dayPercentage

### Classroom
- roomNumber (unique)
- building
- capacity
- wifiBSSID
- status

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check MongoDB URI in `.env`
- Verify MongoDB port (default: 27017)

### Face Recognition Not Working
- Run `node server/download-models.js` to download models
- Check if `server/models` directory exists
- Verify face-api.js dependencies are installed

### Mobile App Can't Connect
- Update IP addresses in `App.js` and other screen files
- Ensure server is running
- Check firewall settings
- Verify devices are on same network

### Admin Panel Not Loading Data
- Update `SERVER_URL` in `admin-panel/renderer.js`
- Check server connection status indicator
- Verify API endpoints are responding

## Tech Stack

### Frontend (Mobile)
- React Native
- Expo
- Socket.io-client
- AsyncStorage
- Expo Camera
- Expo Notifications

### Frontend (Admin)
- Electron
- Vanilla JavaScript
- HTML/CSS

### Backend
- Node.js
- Express
- MongoDB/Mongoose
- Socket.io
- face-api.js
- TensorFlow.js

## License

MIT

## Contributors

[Your Name/Team]

## Support

For issues and questions, please open an issue on GitHub.
