# API Documentation

Complete API reference for the College Attendance System.

## Base URL

```
http://localhost:3000
```

Replace `localhost` with your server IP for network access.

## Authentication

Most endpoints require authentication. Include credentials in request body for login endpoints.

### Login
```http
POST /api/login
Content-Type: application/json

{
  "id": "CSE001",        // Enrollment No or Employee ID
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "John Doe",
    "role": "student",
    "enrollmentNo": "CSE001",
    "course": "CSE",
    "semester": "3",
    "email": "john@example.com",
    "photoUrl": "http://..."
  }
}
```

## Students

### Get All Students
```http
GET /api/students
```

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "_id": "...",
      "enrollmentNo": "CSE001",
      "name": "John Doe",
      "email": "john@example.com",
      "course": "CSE",
      "semester": "3",
      "dob": "2000-01-01",
      "phone": "1234567890",
      "photoUrl": "http://..."
    }
  ]
}
```

### Get Student by Enrollment Number
```http
GET /api/student-management?enrollmentNo=CSE001
```

**Response:**
```json
{
  "success": true,
  "student": {
    "_id": "...",
    "enrollmentNo": "CSE001",
    "name": "John Doe",
    ...
  }
}
```

### Add Student
```http
POST /api/students
Content-Type: application/json

{
  "enrollmentNo": "CSE051",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "course": "CSE",
  "semester": "1",
  "dob": "2002-05-15",
  "phone": "9876543210",
  "photoUrl": "http://..."
}
```

**Response:**
```json
{
  "success": true,
  "student": { ... }
}
```

### Update Student
```http
PUT /api/students/:id
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "semester": "2",
  ...
}
```

### Delete Student
```http
DELETE /api/students/:id
```

### Bulk Import Students
```http
POST /api/students/bulk
Content-Type: application/json

{
  "students": [
    {
      "enrollmentNo": "CSE051",
      "name": "Student 1",
      ...
    },
    {
      "enrollmentNo": "CSE052",
      "name": "Student 2",
      ...
    }
  ]
}
```

### Register Student (for timer session)
```http
POST /api/student/register
Content-Type: application/json

{
  "name": "John Doe"
}
```

## Teachers

### Get All Teachers
```http
GET /api/teachers
```

**Response:**
```json
{
  "success": true,
  "teachers": [
    {
      "_id": "...",
      "employeeId": "T001",
      "name": "Dr. Smith",
      "email": "smith@example.com",
      "department": "CSE",
      "subject": "Data Structures",
      "canEditTimetable": true,
      ...
    }
  ]
}
```

### Add Teacher
```http
POST /api/teachers
Content-Type: application/json

{
  "employeeId": "T021",
  "name": "Dr. Johnson",
  "email": "johnson@example.com",
  "password": "password123",
  "department": "CSE",
  "subject": "Algorithms",
  "dob": "1980-03-20",
  "phone": "1234567890",
  "canEditTimetable": false
}
```

### Update Teacher
```http
PUT /api/teachers/:id
Content-Type: application/json

{
  "subject": "Advanced Algorithms",
  ...
}
```

### Delete Teacher
```http
DELETE /api/teachers/:id
```

### Toggle Timetable Access
```http
PUT /api/teachers/:id/timetable-access
Content-Type: application/json

{
  "canEditTimetable": true
}
```

### Bulk Import Teachers
```http
POST /api/teachers/bulk
Content-Type: application/json

{
  "teachers": [ ... ]
}
```

## Timetable

### Get Timetable
```http
GET /api/timetable/:semester/:branch

Example: GET /api/timetable/3/CSE
```

**Response:**
```json
{
  "success": true,
  "timetable": {
    "semester": "3",
    "branch": "CSE",
    "periods": [
      {
        "number": 1,
        "startTime": "08:00",
        "endTime": "08:45"
      },
      ...
    ],
    "timetable": {
      "monday": [
        {
          "period": 1,
          "subject": "Data Structures",
          "room": "101",
          "teacher": "Dr. Smith",
          "isBreak": false
        },
        ...
      ],
      ...
    }
  }
}
```

### Create/Update Timetable
```http
POST /api/timetable
Content-Type: application/json

{
  "semester": "3",
  "branch": "CSE",
  "periods": [ ... ],
  "timetable": {
    "monday": [ ... ],
    "tuesday": [ ... ],
    ...
  }
}
```

### Get Teacher Schedule
```http
GET /api/teacher-schedule/:teacherId/:day

Example: GET /api/teacher-schedule/T001/Monday
```

**Response:**
```json
{
  "success": true,
  "schedule": [
    {
      "subject": "Data Structures",
      "room": "101",
      "startTime": "08:00",
      "endTime": "08:45",
      "period": 1,
      "course": "CSE",
      "semester": "3",
      "day": "Monday"
    },
    ...
  ]
}
```

## Attendance

### Record Attendance
```http
POST /api/attendance/record
Content-Type: application/json

{
  "studentId": "...",
  "studentName": "John Doe",
  "enrollmentNumber": "CSE001",
  "status": "present",
  "timerValue": 0,
  "semester": "3",
  "branch": "CSE",
  "lectures": [
    {
      "subject": "Data Structures",
      "room": "101",
      "startTime": "08:00",
      "endTime": "08:45",
      "attended": 40,
      "total": 45,
      "percentage": 89,
      "present": true
    }
  ],
  "totalAttended": 240,
  "totalClassTime": 270,
  "dayPercentage": 89
}
```

**Response:**
```json
{
  "success": true,
  "record": { ... }
}
```

### Get Attendance Records
```http
GET /api/attendance/records?studentId=...&startDate=2024-01-01&endDate=2024-12-31&semester=3&branch=CSE
```

**Query Parameters:**
- `studentId` (optional): Filter by student
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `semester` (optional): Filter by semester
- `branch` (optional): Filter by branch

**Response:**
```json
{
  "success": true,
  "records": [
    {
      "_id": "...",
      "studentId": "...",
      "studentName": "John Doe",
      "date": "2024-01-15",
      "status": "present",
      "lectures": [ ... ],
      "totalAttended": 240,
      "totalClassTime": 270,
      "dayPercentage": 89,
      ...
    }
  ]
}
```

### Get Attendance Statistics
```http
GET /api/attendance/stats?studentId=...&semester=3&branch=CSE&startDate=...&endDate=...
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 30,
    "present": 27,
    "absent": 3,
    "percentage": 90
  }
}
```

## Face Verification

### Verify Face
```http
POST /api/verify-face
Content-Type: application/json

{
  "userId": "CSE001",
  "capturedImage": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "match": true,
  "confidence": 85,
  "distance": 0.35,
  "message": "Face verified successfully",
  "method": "face-api.js"
}
```

**Error Response:**
```json
{
  "success": false,
  "match": false,
  "confidence": 0,
  "message": "No face detected in captured image"
}
```

## Photo Upload

### Upload Photo
```http
POST /api/upload-photo
Content-Type: application/json

{
  "photoData": "data:image/jpeg;base64,...",
  "type": "student",
  "id": "CSE001"
}
```

**Response:**
```json
{
  "success": true,
  "photoUrl": "http://192.168.1.100:3000/uploads/student_CSE001_1234567890.jpg",
  "filename": "student_CSE001_1234567890.jpg"
}
```

**Error Response (No Face Detected):**
```json
{
  "success": false,
  "error": "No face detected in the photo. Please use a clear, well-lit photo showing your face."
}
```

### Get Photo
```http
GET /api/photo/:filename

Example: GET /api/photo/student_CSE001_1234567890.jpg
```

Returns the image file.

## Classrooms

### Get All Classrooms
```http
GET /api/classrooms
```

**Response:**
```json
{
  "success": true,
  "classrooms": [
    {
      "_id": "...",
      "roomNumber": "101",
      "building": "A Block",
      "capacity": 60,
      "wifiBSSID": "00:11:22:33:44:55",
      "status": "available"
    }
  ]
}
```

### Add Classroom
```http
POST /api/classrooms
Content-Type: application/json

{
  "roomNumber": "201",
  "building": "B Block",
  "capacity": 50,
  "wifiBSSID": "AA:BB:CC:DD:EE:FF",
  "status": "available"
}
```

### Update Classroom
```http
PUT /api/classrooms/:id
Content-Type: application/json

{
  "capacity": 55,
  "status": "maintenance"
}
```

### Delete Classroom
```http
DELETE /api/classrooms/:id
```

## Configuration

### Get SDUI Config
```http
GET /api/config
```

**Response:**
```json
{
  "version": "2.0.0",
  "roleSelection": { ... },
  "studentNameInput": { ... },
  "studentScreen": { ... },
  "teacherScreen": { ... }
}
```

## Health Check

### Server Health
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Client → Server Events

#### Timer Update
```javascript
socket.emit('timer_update', {
  studentId: '...',
  studentName: 'John Doe',
  timerValue: 120,
  isRunning: true,
  status: 'attending'
});
```

### Server → Client Events

#### Student Update
```javascript
socket.on('student_update', (data) => {
  // data: { studentId, timerValue, isRunning, status }
});
```

#### Student Registered
```javascript
socket.on('student_registered', (data) => {
  // data: { name }
});
```

#### Timetable Updated
```javascript
socket.on('timetable_updated', (data) => {
  // data: { semester, branch }
});
```

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## CORS

CORS is enabled for all origins (`*`). Configure `ALLOWED_ORIGINS` in `.env` for production.

## Data Validation

### Student Data
- `enrollmentNo`: Required, unique, string
- `name`: Required, string
- `email`: Required, valid email format
- `password`: Required, min 6 characters
- `course`: Required, one of: CSE, ECE, ME, CE
- `semester`: Required, 1-8
- `dob`: Required, valid date
- `phone`: Optional, string

### Teacher Data
- `employeeId`: Required, unique, string
- `name`: Required, string
- `email`: Required, valid email format
- `password`: Required, min 6 characters
- `department`: Required, one of: CSE, ECE, ME, CE
- `subject`: Optional, string
- `dob`: Required, valid date
- `canEditTimetable`: Optional, boolean

### Attendance Data
- `studentId`: Required, string
- `status`: Required, one of: present, absent, leave
- `date`: Auto-generated
- `lectures`: Optional, array of lecture objects
- `dayPercentage`: Optional, number 0-100

## Best Practices

1. **Always validate input** on client side before sending
2. **Handle errors gracefully** with try-catch blocks
3. **Use proper HTTP methods** (GET for reading, POST for creating, PUT for updating, DELETE for deleting)
4. **Include proper headers** especially Content-Type for JSON
5. **Check response status** before processing data
6. **Implement retry logic** for network failures
7. **Cache responses** where appropriate
8. **Use WebSocket** for real-time updates instead of polling

## Example Usage

### JavaScript (Fetch API)
```javascript
// Get students
const response = await fetch('http://localhost:3000/api/students');
const data = await response.json();
console.log(data.students);

// Add student
const response = await fetch('http://localhost:3000/api/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    enrollmentNo: 'CSE051',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    course: 'CSE',
    semester: '1',
    dob: '2002-05-15'
  })
});
const data = await response.json();
```

### React Native
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login
const login = async (id, password) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      return data.user;
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### Socket.io Client
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Listen for updates
socket.on('student_update', (data) => {
  console.log('Student updated:', data);
  updateUI(data);
});

// Send update
socket.emit('timer_update', {
  studentId: '123',
  timerValue: 100,
  isRunning: true,
  status: 'attending'
});
```
