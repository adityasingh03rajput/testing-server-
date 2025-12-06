# Teacher UI/UX Flow & API Endpoints - Complete Guide

## 🎯 Teacher Dashboard Flow

### 1. Login Flow
**Screen:** Login Screen
**UI Elements:**
- Employee ID input field
- Password input field
- Login button
- Remember me checkbox

**API Endpoint:**
```
POST /api/teacher/login
Body: { employeeId, password }
Response: { success: true, teacher: {...}, token: "..." }
```

**After Login:**
- Store teacher data in AsyncStorage
- Navigate to Teacher Dashboard (Home Tab)
- Initialize Socket.IO connection

---

### 2. Home Tab (Main Dashboard)

**Screen Components:**
1. **TeacherHeader** (Top)
   - Teacher profile photo (clickable)
   - App name "LetsBunk"
   - Theme toggle button
   - Three-dot menu (⋮)

2. **StudentSearch** (Below Header)
   - Search input with 🔍 icon
   - Placeholder: "Search student by name or roll number..."
   - Dropdown results when typing

3. **StudentList** (Main Content)
   - Filter buttons: All | Active | Present | Absent | Left
   - Student count: "X / Y Present"
   - Student cards with:
     - Profile photo
     - Name
     - Status badge
     - Live timer (MM:SS)

4. **Floating Action Button** (Bottom Right)
   - Bell icon 🔔
   - Opens Random Ring Dialog

5. **BottomNavigation** (Bottom)
   - Home | Calendar | Timetable | Notifications

**API Endpoints:**

**Get Current Class Students:**
```
GET /api/teacher/current-class-students/:teacherId
Response: {
  success: true,
  hasActiveClass: true,
  currentClass: {
    subject: "Data Structures",
    semester: "3",
    branch: "CSE",
    period: 2,
    room: "101",
    startTime: "09:45",
    endTime: "10:30",
    bssid: "aa:bb:cc:dd:ee:ff"
  },
  students: [...],
  totalStudents: 45
}
```

**Socket.IO Events (Listen):**
- `student_registered` - New student joined
- `timer_updated` - Student timer updated
- `student_status_change` - Status changed
- `random_ring_triggered` - Random ring started

---

### 3. Teacher Profile Dialog

**Trigger:** Click on profile photo in TeacherHeader

**UI Elements:**
- Profile photo (large, 96x96)
- Teacher name
- Employee ID (in card)
- Email (in card)
- Department (in card)
- Phone (in card)
- Change Password button (🔑)
- Logout button (🚪, red)

**API Endpoints:**

**Get Teacher Profile:**
```
GET /api/teacher/profile/:teacherId
Response: {
  success: true,
  teacher: {
    name: "Dr. Sarah Johnson",
    employeeId: "TCH-2024-001",
    email: "sarah@school.edu",
    department: "Computer Science",
    phone: "1234567890",
    profilePhoto: "https://..."
  }
}
```

**Change Password:**
```
POST /api/teacher/change-password
Body: { teacherId, oldPassword, newPassword }
Response: { success: true, message: "Password changed" }
```

**Logout:**
```
POST /api/teacher/logout
Body: { teacherId }
Response: { success: true }
```

---

### 4. Student Profile Dialog

**Trigger:** Click on any student card in StudentList

**UI Elements:**
- Profile photo (large, 128x128)
- Student name
- Enrollment number
- Email
- Attendance percentage (circular display)
- Close button (✕)

**API Endpoints:**

**Get Student Details:**
```
GET /api/student/:studentId
Response: {
  success: true,
  student: {
    name: "Aarav Sharma",
    enrollmentNo: "CS001",
    email: "aarav@college.edu",
    profilePhoto: "https://...",
    attendancePercentage: 92,
    semester: "3",
    branch: "CSE"
  }
}
```

**Get Student Attendance History:**
```
GET /api/attendance/student/:studentId
Response: {
  success: true,
  records: [...],
  totalClasses: 50,
  attended: 46,
  percentage: 92
}
```

---

### 5. Random Ring Feature

**Trigger:** Click floating bell button (🔔)

**Dialog UI:**
- Title: "🔔 Random Ring"
- Description: "Choose how many students to randomly select"
- Option 1: "👥 All Students" (button)
- Option 2: "#️⃣ Select Number" (button)
  - If selected, show number input
  - Input: "Enter number (e.g., 5)"
- Cancel button
- "Start Random Ring" button (disabled until selection)

**API Endpoints:**

**Trigger Random Ring:**
```
POST /api/random-ring/trigger
Body: {
  teacherId: "TCH-2024-001",
  classId: "CSE-3-101",
  type: "all" | "select",
  count: 5,  // if type is "select"
  semester: "3",
  branch: "CSE",
  subject: "Data Structures",
  room: "101",
  bssid: "aa:bb:cc:dd:ee:ff"
}
Response: {
  success: true,
  selectedStudents: [...],
  notificationsSent: 5,
  message: "Random ring triggered for 5 students"
}
```

**Get Random Ring History:**
```
GET /api/random-ring/history/:teacherId
Query: ?date=2024-01-15&limit=10
Response: {
  success: true,
  history: [
    {
      _id: "...",
      teacherId: "TCH-2024-001",
      timestamp: "2024-01-15T10:30:00Z",
      type: "select",
      count: 5,
      selectedStudents: [...],
      verifiedStudents: [...],
      subject: "Data Structures"
    }
  ]
}
```

**Socket.IO Events (Emit):**
- `random_ring_trigger` - Notify server to start random ring

**Socket.IO Events (Listen):**
- `random_ring_started` - Confirmation that ring started
- `random_ring_student_verified` - Student verified biometric
- `random_ring_completed` - All students responded

---

### 6. Three-Dot Menu Options

**Trigger:** Click ⋮ in TeacherHeader

**Menu Items:**
1. View Records
2. Notification
3. Updates
4. Help and Support
5. Feedback

#### 6.1 View Records Screen

**UI Elements:**
- Back button (←)
- Title: "View Records"
- Semester dropdown
- Branch dropdown
- Student list (filtered by semester/branch)
- Each student shows:
  - Profile photo
  - Name
  - Roll number
  - Status badge
  - Attendance percentage

**API Endpoints:**

**Get Students by Semester/Branch:**
```
GET /api/students/filter
Query: ?semester=3&branch=CSE
Response: {
  success: true,
  students: [...],
  totalStudents: 45
}
```

**Get Attendance Records:**
```
GET /api/attendance/records
Query: ?semester=3&branch=CSE&date=2024-01-15
Response: {
  success: true,
  records: [...],
  summary: {
    totalStudents: 45,
    present: 40,
    absent: 5,
    percentage: 88.9
  }
}
```

#### 6.2 Notifications Screen

**UI Elements:**
- Back button (←)
- Title: "Notifications"
- List of notifications:
  - Icon
  - Title
  - Message
  - Timestamp
  - Read/Unread indicator

**API Endpoints:**

**Get Notifications:**
```
GET /api/notifications/:teacherId
Query: ?limit=20&offset=0
Response: {
  success: true,
  notifications: [
    {
      _id: "...",
      type: "random_ring",
      title: "Random Ring Completed",
      message: "5 students verified successfully",
      timestamp: "2024-01-15T10:35:00Z",
      read: false
    }
  ],
  unreadCount: 3
}
```

**Mark as Read:**
```
PUT /api/notifications/:notificationId/read
Response: { success: true }
```

#### 6.3 Updates Screen

**UI Elements:**
- Back button (←)
- Title: "Updates"
- List of app updates/announcements
- Each update shows:
  - Version number
  - Title
  - Description
  - Date

**API Endpoints:**

**Get Updates:**
```
GET /api/updates
Response: {
  success: true,
  updates: [
    {
      version: "2.0.0",
      title: "New Teacher UI",
      description: "Complete redesign...",
      date: "2024-01-15",
      features: [...]
    }
  ]
}
```

#### 6.4 Help and Support Screen

**UI Elements:**
- Back button (←)
- Title: "Help and Support"
- FAQ sections
- Contact support button
- Email: support@letsbunk.com
- Phone: +91 1234567890

**API Endpoints:**

**Get FAQ:**
```
GET /api/support/faq
Response: {
  success: true,
  faqs: [
    {
      question: "How to use Random Ring?",
      answer: "Click the bell icon..."
    }
  ]
}
```

**Submit Support Ticket:**
```
POST /api/support/ticket
Body: {
  teacherId: "TCH-2024-001",
  subject: "Issue with...",
  description: "...",
  priority: "medium"
}
Response: {
  success: true,
  ticketId: "TICKET-001"
}
```

#### 6.5 Feedback Screen

**UI Elements:**
- Back button (←)
- Title: "Feedback"
- Rating stars (1-5)
- Feedback text area
- Submit button

**API Endpoints:**

**Submit Feedback:**
```
POST /api/feedback
Body: {
  teacherId: "TCH-2024-001",
  rating: 5,
  feedback: "Great app!",
  category: "feature_request"
}
Response: {
  success: true,
  message: "Thank you for your feedback"
}
```

---

### 7. Calendar Tab

**UI Elements:**
- Calendar view (month)
- Date selection
- Attendance summary for selected date
- Color coding:
  - Green: High attendance (>80%)
  - Yellow: Medium attendance (60-80%)
  - Red: Low attendance (<60%)

**API Endpoints:**

**Get Attendance Calendar:**
```
GET /api/attendance/calendar/:teacherId
Query: ?month=1&year=2024
Response: {
  success: true,
  calendar: {
    "2024-01-15": {
      totalClasses: 3,
      present: 120,
      total: 135,
      percentage: 88.9
    }
  }
}
```

**Get Date Details:**
```
GET /api/attendance/date/:date
Query: ?teacherId=TCH-2024-001
Response: {
  success: true,
  classes: [
    {
      subject: "Data Structures",
      time: "09:45-10:30",
      present: 40,
      total: 45,
      percentage: 88.9
    }
  ]
}
```

---

### 8. Timetable Tab

**Flow:**
1. Show TimetableSelector (if no selection)
2. Select Branch (dropdown with 6 options)
3. Select Semester (dropdown with 8 options)
4. Click "View Timetable" button
5. Show TimetableScreen with schedule

**API Endpoints:**

**Get Timetable:**
```
GET /api/timetable/:semester/:branch
Response: {
  success: true,
  timetable: {
    semester: "3",
    branch: "CSE",
    periods: [
      { number: 1, startTime: "08:00", endTime: "08:45" }
    ],
    timetable: {
      monday: [
        { period: 1, subject: "DS", room: "101", teacher: "Dr. Smith" }
      ]
    }
  }
}
```

**Update Timetable (if canEditTimetable):**
```
PUT /api/timetable/:semester/:branch
Body: { timetable: {...}, periods: [...] }
Response: { success: true }
```

---

### 9. Notifications Tab

**UI Elements:**
- List of notifications
- Filter: All | Unread | Read
- Each notification:
  - Icon based on type
  - Title
  - Message
  - Timestamp
  - Tap to mark as read

**API Endpoints:**
Same as section 6.2

---

## 🔔 Random Ring Feature - Detailed Flow

### Student Side (When Random Ring Triggered):

1. **Notification Received:**
   - Push notification: "Random Ring! Verify your attendance"
   - In-app notification banner

2. **Verification Screen:**
   - Timer: 5 minutes countdown
   - "Verify Now" button
   - Face verification camera
   - WiFi BSSID check (must be on college WiFi)

3. **Verification Process:**
   - Check WiFi BSSID matches authorized
   - Capture face photo
   - Send to server for verification
   - Show success/failure message

4. **If Failed:**
   - Show error: "Verification failed" or "Not on college WiFi"
   - Parent notification scheduled

### Teacher Side (After Random Ring):

1. **Real-time Updates:**
   - Student cards update with verification status
   - Green checkmark for verified
   - Red X for failed/timeout

2. **Summary:**
   - "5/5 students verified" or "3/5 students verified"
   - List of non-verified students

3. **Actions:**
   - View verification photos
   - Mark manual attendance
   - Send reminder notification

### Backend Processing:

1. **Select Random Students:**
   - Filter students connected to WiFi today
   - Randomly select N students
   - Store in RandomRing collection

2. **Send Notifications:**
   - Push notifications via FCM
   - Socket.IO events to connected students
   - SMS backup (optional)

3. **Track Responses:**
   - Store verification attempts
   - Update attendance records
   - Calculate response time

4. **Parent Notifications:**
   - Schedule end-of-day job
   - Check unverified students
   - Send automated calls/SMS to parents

---

## 📊 Data Models

### RandomRing Schema:
```javascript
{
  _id: ObjectId,
  teacherId: String,
  teacherName: String,
  classId: String,
  subject: String,
  semester: String,
  branch: String,
  room: String,
  bssid: String,
  type: "all" | "select",
  count: Number,
  selectedStudents: [
    {
      studentId: String,
      name: String,
      enrollmentNo: String,
      notificationSent: Boolean,
      notificationTime: Date,
      verified: Boolean,
      verificationTime: Date,
      verificationPhoto: String,
      responseTime: Number, // seconds
      failureReason: String
    }
  ],
  timestamp: Date,
  completedAt: Date,
  status: "pending" | "completed" | "expired"
}
```

### Notification Schema:
```javascript
{
  _id: ObjectId,
  userId: String,
  userType: "teacher" | "student",
  type: "random_ring" | "attendance" | "announcement",
  title: String,
  message: String,
  data: Object,
  read: Boolean,
  timestamp: Date
}
```

---

## 🔐 Security & Validation

### WiFi BSSID Validation:
- Store authorized BSSIDs in Classroom collection
- Validate student's current BSSID before verification
- Log all verification attempts with BSSID

### Face Verification:
- Use MediaPipe or Face-API.js
- Compare with stored profile photo
- Minimum confidence threshold: 0.7
- Store verification photos for audit

### Rate Limiting:
- Random Ring: Max 5 per hour per teacher
- Verification attempts: Max 3 per student per ring
- API calls: 100 requests/minute per user

---

## 📱 Push Notifications

### Setup:
- Use Firebase Cloud Messaging (FCM)
- Store device tokens in User collection
- Send via server using FCM Admin SDK

### Notification Types:
1. **Random Ring:** "Verify your attendance now!"
2. **Attendance Marked:** "Your attendance has been marked"
3. **Low Attendance:** "Your attendance is below 75%"
4. **Parent Alert:** "Your child was absent today"

---

## 🎨 Theme Support

All screens support both themes:
- **Dark Theme:** #0a1628 background, #00f5ff primary
- **Light Theme:** #fef3e2 background, #d97706 primary

Toggle in TeacherHeader affects all screens immediately.

---

## ✅ Complete Feature Checklist

- ✅ Teacher Login
- ✅ Current Class Students Display
- ✅ Live Timer Updates
- ✅ Student Search
- ✅ Student Filtering
- ✅ Student Profile View
- ✅ Teacher Profile View
- ✅ Random Ring (All Students)
- ✅ Random Ring (Select Number)
- ✅ WiFi BSSID Validation
- ✅ Face Verification
- ✅ Attendance Records
- ✅ Calendar View
- ✅ Timetable View
- ✅ Notifications
- ✅ Updates
- ✅ Help & Support
- ✅ Feedback
- ✅ Theme Toggle
- ✅ Socket.IO Real-time Updates
- ✅ Parent Notifications

All endpoints and UI flows are now documented!
