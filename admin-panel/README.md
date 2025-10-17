# College Admin Panel - Desktop Application

A standalone desktop application for managing college data including students, teachers, classrooms, and timetables.

## Features

- 👨‍🎓 **Student Management**: Add, edit, delete students (single or bulk import via CSV)
- 👨‍🏫 **Teacher Management**: Manage teachers with timetable editing permissions
- 🏫 **Classroom Management**: Track classrooms with WiFi BSSID for attendance
- 📅 **Timetable Management**: Create and edit timetables, assign teacher permissions
- 📊 **Dashboard**: Overview of all college data
- 🔄 **Real-time Sync**: Connects to backend server for live updates

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running on localhost:27017)
- Backend server running on port 3000

### Setup

1. Install dependencies:
```bash
cd admin-panel
npm install
```

2. Start the application:
```bash
npm start
```

### Building Executables

Build for Windows:
```bash
npm run build-win
```

Build for Linux:
```bash
npm run build-linux
```

Build for macOS:
```bash
npm run build-mac
```

The built application will be in the `dist` folder.

## Usage

### Student Management

**Single Entry:**
1. Click "Students" in sidebar
2. Click "➕ Add Student"
3. Fill in the form:
   - Enrollment Number (required)
   - Full Name (required)
   - Email (required)
   - Password (required)
   - Course (required)
   - Semester (required)
   - Date of Birth (required)
   - Phone Number (optional)

**Bulk Import:**
1. Click "📤 Bulk Import"
2. Upload CSV file with columns:
   ```
   enrollmentNo,name,email,password,course,semester,dob,phone
   2021001,John Doe,john@example.com,pass123,CSE,3,2003-05-15,1234567890
   2021002,Jane Smith,jane@example.com,pass456,ECE,3,2003-06-20,0987654321
   ```

### Teacher Management

**Single Entry:**
1. Click "Teachers" in sidebar
2. Click "➕ Add Teacher"
3. Fill in the form including "Can Edit Timetable" checkbox

**Bulk Import:**
CSV format:
```
employeeId,name,email,password,department,dob,phone,canEditTimetable
EMP001,Dr. Smith,smith@example.com,pass123,CSE,1980-01-15,1234567890,true
EMP002,Prof. Johnson,johnson@example.com,pass456,ECE,1975-03-20,0987654321,false
```

**Timetable Access:**
- Click the "Enabled/Disabled" badge to toggle timetable editing permission
- Only teachers with "Enabled" can edit timetables in the mobile app

### Classroom Management

Add classrooms with:
- Room Number (e.g., "101", "Lab-A")
- Building name
- Capacity
- WiFi BSSID (for location-based attendance)
- Active status

### Timetable Management

1. Select Semester and Course
2. Click "Load Timetable" (if exists) or "➕ Create Timetable"
3. Click any cell to edit:
   - Subject name
   - Room number
   - Mark as break
4. Click "Save Timetable"

**Timetable Structure:**
- 8 periods per day (45 minutes each)
- 6 days (Monday to Saturday)
- Default timing: 8:00 AM to 2:00 PM

## Configuration

### Server Settings
1. Click "Settings" in sidebar
2. Update "Server URL" (default: http://localhost:3000)
3. Click "Save"

### Database
- MongoDB URI: mongodb://localhost:27017/attendance_app
- Automatic fallback to in-memory storage if MongoDB is unavailable

## CSV Format Examples

### Students CSV
```csv
enrollmentNo,name,email,password,course,semester,dob,phone
2021001,John Doe,john@college.edu,securepass1,CSE,3,2003-05-15,9876543210
2021002,Jane Smith,jane@college.edu,securepass2,ECE,3,2003-06-20,9876543211
```

### Teachers CSV
```csv
employeeId,name,email,password,department,dob,phone,canEditTimetable
EMP001,Dr. Robert Smith,robert@college.edu,teachpass1,CSE,1980-01-15,9876543220,true
EMP002,Prof. Mary Johnson,mary@college.edu,teachpass2,ECE,1975-03-20,9876543221,false
```

## Keyboard Shortcuts

- `Ctrl+S`: Save current form/timetable
- `Esc`: Close modal
- `Ctrl+F`: Focus search bar

## Troubleshooting

### Server Connection Failed
- Ensure backend server is running on port 3000
- Check firewall settings
- Verify server URL in Settings

### Database Not Connected
- Start MongoDB service
- Check MongoDB is running on localhost:27017
- Application will work with in-memory storage as fallback

### Bulk Import Fails
- Verify CSV format matches examples
- Check for duplicate enrollment/employee IDs
- Ensure all required fields are present

## Tech Stack

- **Electron**: Desktop application framework
- **HTML/CSS/JavaScript**: Frontend
- **Node.js**: Backend integration
- **MongoDB**: Database (optional, has fallback)

## Support

For issues or questions, contact your system administrator.
