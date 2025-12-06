# Teacher API Endpoints - For Figma Integration

## Base Server URL
```
https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
```

## Teacher Authentication & Management

### 1. Get All Teachers
**GET** `/api/teachers`
- Returns list of all teachers
- Response: `{ success: true, teachers: [...] }`

### 2. Create Teacher
**POST** `/api/teachers`
- Body: `{ name, employeeId, email, phone, department, canEditTimetable }`
- Response: `{ success: true, teacher: {...} }`

### 3. Bulk Create Teachers
**POST** `/api/teachers/bulk`
- Body: `{ teachers: [...] }`
- Response: `{ success: true, teachers: [...] }`

### 4. Update Teacher
**PUT** `/api/teachers/:id`
- Body: `{ name, email, phone, department, canEditTimetable }`
- Response: `{ success: true, teacher: {...} }`

### 5. Delete Teacher
**DELETE** `/api/teachers/:id`
- Response: `{ success: true }`

### 6. Update Timetable Access
**PUT** `/api/teachers/:id/timetable-access`
- Body: `{ canEditTimetable: true/false }`
- Response: `{ success: true, teacher: {...} }`

## Teacher Schedule & Classes

### 7. Get Teacher Schedule for a Day
**GET** `/api/teacher-schedule/:teacherId/:day`
- Parameters:
  - `teacherId`: Teacher's employee ID or name
  - `day`: Day of week (monday, tuesday, etc.)
- Returns: Teacher's schedule for that day
- Response:
```json
{
  "success": true,
  "schedule": [
    {
      "subject": "Data Structures",
      "room": "101",
      "startTime": "09:00",
      "endTime": "09:45",
      "period": 1,
      "course": "CSE",
      "semester": "3",
      "day": "monday"
    }
  ]
}
```

### 8. Get Current Class Students (CRITICAL FOR TEACHER DASHBOARD)
**GET** `/api/teacher/current-class-students/:teacherId`
- Parameters:
  - `teacherId`: Teacher's employee ID
- Returns: Students in teacher's current active class
- Response:
```json
{
  "success": true,
  "hasActiveClass": true,
  "currentClass": {
    "subject": "Data Structures",
    "semester": "3",
    "branch": "CSE",
    "period": 2,
    "room": "101",
    "startTime": "09:45",
    "endTime": "10:30",
    "isBreak": false,
    "day": "monday",
    "capacity": 60,
    "bssid": "aa:bb:cc:dd:ee:ff"
  },
  "students": [
    {
      "_id": "...",
      "name": "Aarav Sharma",
      "enrollmentNo": "CS001",
      "semester": "3",
      "course": "CSE",
      "email": "aarav@college.edu",
      "phone": "1234567890",
      "status": "active",
      "timerValue": 1800,
      "isRunning": true,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ],
  "totalStudents": 45,
  "teacherName": "Dr. Smith"
}
```

## Student Management (Teacher Access)

### 9. Get All Students
**GET** `/api/students`
- Returns all students in the system
- Response: `{ success: true, students: [...] }`

### 10. Get Students by Semester/Branch
**GET** `/api/students?semester=3&course=CSE`
- Query params: `semester`, `course`
- Returns filtered students

### 11. Update Student Status
**PUT** `/api/students/:id`
- Body: `{ status, timerValue, isRunning }`
- Response: `{ success: true, student: {...} }`

## Attendance Management

### 12. Get Attendance Records
**GET** `/api/attendance/records`
- Query params: `date`, `semester`, `branch`, `studentId`
- Returns attendance records

### 13. Mark Attendance
**POST** `/api/attendance/mark`
- Body:
```json
{
  "studentId": "...",
  "date": "2024-01-15",
  "status": "present",
  "semester": "3",
  "branch": "CSE",
  "lectures": [...]
}
```

### 14. Get Student Attendance Summary
**GET** `/api/attendance/summary/:studentId`
- Returns attendance percentage and history

## Timetable Management

### 15. Get Timetable
**GET** `/api/timetable/:semester/:branch`
- Returns timetable for specific semester/branch

### 16. Update Timetable
**PUT** `/api/timetable/:semester/:branch`
- Body: `{ timetable: {...}, periods: [...] }`
- Response: `{ success: true, timetable: {...} }`

### 17. Update Periods for All Timetables
**POST** `/api/periods/update-all`
- Body: `{ periods: [...] }`
- Updates period timings across all timetables

## Classroom Management

### 18. Get All Classrooms
**GET** `/api/classrooms`
- Returns list of classrooms with BSSID

### 19. Create Classroom
**POST** `/api/classrooms`
- Body: `{ roomNumber, capacity, bssid, building, floor }`

### 20. Update Classroom
**PUT** `/api/classrooms/:id`
- Body: `{ roomNumber, capacity, bssid }`

## Random Ring Feature

### 21. Trigger Random Ring
**POST** `/api/random-ring`
- Body:
```json
{
  "teacherId": "...",
  "classId": "...",
  "type": "all" | "select",
  "count": 5,
  "semester": "3",
  "branch": "CSE"
}
```
- Sends notifications to selected students

### 22. Get Random Ring History
**GET** `/api/random-ring/history/:teacherId`
- Returns past random ring events

## Real-Time Updates (Socket.IO)

### Socket Connection
```javascript
const socket = io('https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net');
```

### Socket Events (Emit)
- `timer_update` - Student updates their timer
- `student_status_change` - Student status changes
- `attendance_marked` - Attendance marked

### Socket Events (Listen)
- `student_registered` - New student joined
- `timer_updated` - Student timer updated
- `timetable_updated` - Timetable changed
- `periods_updated` - Period timings changed
- `random_ring_triggered` - Random ring initiated

## Configuration

### 23. Get App Configuration
**GET** `/api/config`
- Returns UI configuration (SDUI)

### 24. Get Server Time
**GET** `/api/time`
- Returns server timestamp (prevents time manipulation)

### 25. Health Check
**GET** `/api/health`
- Returns: `{ status: "ok", timestamp: "..." }`

## Authentication Headers (If Implemented)
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>'
}
```

## Error Responses
All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Rate Limiting
- Most endpoints: 100 requests/minute
- Socket connections: 10 connections/IP

## CORS
- Enabled for all origins (*)
- Methods: GET, POST, PUT, DELETE

## Notes for Figma Integration

1. **Base URL**: Always use `https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net`

2. **Critical Endpoint**: `/api/teacher/current-class-students/:teacherId`
   - This is the main endpoint for teacher dashboard
   - Returns current class info + student list
   - Updates in real-time via Socket.IO

3. **Teacher ID**: Use `employeeId` field from teacher object

4. **Student Status Values**:
   - `active` - Currently in class, timer running
   - `present` - Attended, timer stopped
   - `absent` - Not in class
   - `left` - Left early

5. **Real-Time Updates**: Use Socket.IO for live student status updates

6. **Date Format**: ISO 8601 (e.g., "2024-01-15T10:30:00Z")

7. **Time Format**: 24-hour (e.g., "09:45", "14:30")

## Example Usage in Figma

```javascript
// Fetch current class students
const teacherId = "EMP001";
const response = await fetch(
  `https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/teacher/current-class-students/${teacherId}`
);
const data = await response.json();

if (data.hasActiveClass) {
  console.log("Current Class:", data.currentClass.subject);
  console.log("Students:", data.students.length);
  // Display student list in UI
}
```
