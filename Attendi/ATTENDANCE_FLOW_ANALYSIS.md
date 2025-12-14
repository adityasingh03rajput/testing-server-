# Attendance Data Storage Flow Analysis

## Overview
The system uses a **dual-schema approach** for attendance tracking:
1. **AttendanceSession** - Real-time tracking (active sessions)
2. **AttendanceRecord** - Daily summary (historical records)

---

## 📊 Database Schemas

### 1. AttendanceSession Schema (Real-time)
**Collection:** `attendancesessions`

**Purpose:** Track active student sessions in real-time

**Fields:**
```javascript
{
  studentId: String (required),
  studentName: String (required),
  enrollmentNumber: String (required),  // ⚠️ ISSUE: Should be enrollmentNo
  date: Date (required),
  
  sessionStartTime: Date,      // When timer started
  timerValue: Number,           // Current timer in seconds
  isActive: Boolean,            // Is session active?
  lastUpdate: Date,             // Last heartbeat
  
  wifiConnected: Boolean,       // WiFi status
  currentClass: {
    period: String,             // P1, P2, P3
    subject: String,
    teacher: String,            // Teacher ID
    teacherName: String,
    room: String,
    startTime: String,          // HH:MM
    endTime: String,
    classStartedAt: Date
  },
  
  semester: String,
  branch: String
}
```

### 2. AttendanceRecord Schema (Daily Summary)
**Collection:** `attendancerecords`

**Purpose:** Store daily attendance summaries with lecture-wise breakdown

**Fields:**
```javascript
{
  studentId: String (required),
  studentName: String (required),
  enrollmentNumber: String (required),  // ⚠️ ISSUE: Should be enrollmentNo
  date: Date (required),
  status: String (enum: 'present', 'absent', 'leave'),
  
  // Lecture-wise attendance
  lectures: [{
    period: String,              // P1, P2, P3
    subject: String,
    teacher: String,             // Teacher ID
    teacherName: String,
    room: String,
    startTime: String,           // HH:MM
    endTime: String,
    
    // Time tracking (SECONDS)
    lectureStartedAt: Date,
    lectureEndedAt: Date,
    studentCheckIn: Date,
    
    attended: Number,            // seconds attended
    total: Number,               // total lecture seconds (3000 = 50min)
    percentage: Number,          // attendance %
    present: Boolean,            // true if >= 75%
    
    // Verification events
    verifications: [{
      time: Date,
      type: String (enum: 'face', 'random_ring', 'manual'),
      success: Boolean,
      event: String              // 'morning_checkin', 'random_ring', 'periodic'
    }]
  }],
  
  // Daily totals (SECONDS)
  totalAttended: Number,         // total seconds attended
  totalClassTime: Number,        // total class seconds
  dayPercentage: Number,         // daily attendance %
  
  // Timer tracking
  timerValue: Number,            // Total seconds in college
  checkInTime: Date,             // First check-in
  checkOutTime: Date,            // Last check-out
  
  semester: String,
  branch: String,
  createdAt: Date
}
```

---

## 🔄 Attendance Flow (APK → Server → Database)

### Step 1: Morning Face Verification
**APK Action:**
```javascript
// Student opens app and verifies face
POST /api/attendance/start-session
Body: {
  studentId: "673abc...",
  studentName: "AADESH CHOUKSEY",
  enrollmentNumber: "0246CD241001",  // ⚠️ Should be enrollmentNo
  semester: "3",
  branch: "B.Tech Data Science",
  faceData: "base64..."
}
```

**Server Action:**
1. Check if `AttendanceSession` exists for today
2. If exists → Resume session
3. If not → Create new session:
   - Set `sessionStartTime` = now
   - Set `timerValue` = 0
   - Set `isActive` = true
4. Create/update `AttendanceRecord`:
   - Set `status` = 'present'
   - Set `checkInTime` = now
   - Initialize empty `lectures` array

**Database Result:**
- ✅ New `AttendanceSession` document created
- ✅ New `AttendanceRecord` document created

---

### Step 2: Timer Heartbeat (Every 5 minutes)
**APK Action:**
```javascript
// APK sends timer updates every 5 minutes
POST /api/attendance/update-timer
Body: {
  studentId: "673abc...",
  timerValue: 300,        // seconds (5 minutes)
  wifiConnected: true
}
```

**Server Action:**
1. Find `AttendanceSession` for today
2. Update:
   - `timerValue` = new value
   - `wifiConnected` = status
   - `isActive` = wifiConnected
   - `lastUpdate` = now
3. Update `AttendanceRecord`:
   - `timerValue` = new value
   - `checkOutTime` = now

**Database Result:**
- ✅ `AttendanceSession` updated with latest timer
- ✅ `AttendanceRecord` updated with latest timer

---

### Step 3: Lecture Starts (Teacher/System Triggered)
**Server Action:**
```javascript
POST /api/attendance/lecture-start
Body: {
  period: "P1",
  subject: "Data Structures",
  teacher: "TEACH001",
  teacherName: "Prof. Kumar",
  room: "Lab 101",
  startTime: "09:00",
  endTime: "09:50",
  semester: "3",
  branch: "B.Tech Data Science"
}
```

**Server Action:**
1. Find all active `AttendanceSession` for semester/branch
2. Update each session's `currentClass` field
3. Add lecture to `AttendanceRecord.lectures[]`:
   - Set `lectureStartedAt` = now
   - Set `studentCheckIn` = session.sessionStartTime
   - Set `total` = 3000 seconds (50 min)
   - Set `attended` = 0 (will be calculated)

**Database Result:**
- ✅ All active sessions updated with current class
- ✅ New lecture entry added to attendance records

---

### Step 4: Lecture Ends (Teacher/System Triggered)
**Server Action:**
```javascript
POST /api/attendance/lecture-end
Body: {
  period: "P1",
  semester: "3",
  branch: "B.Tech Data Science"
}
```

**Server Action:**
1. Find all sessions with this lecture
2. Calculate attended time for each student
3. Update lecture in `AttendanceRecord`:
   - Set `lectureEndedAt` = now
   - Calculate `attended` seconds
   - Calculate `percentage` = (attended / total) * 100
   - Set `present` = (percentage >= 75%)
4. Update daily totals:
   - `totalAttended` += attended
   - `totalClassTime` += total
   - `dayPercentage` = (totalAttended / totalClassTime) * 100

**Database Result:**
- ✅ Lecture marked complete with attendance %
- ✅ Daily totals updated

---

### Step 5: Random Ring Verification
**APK Action:**
```javascript
// Student receives notification and verifies face
POST /api/attendance/add-verification
Body: {
  studentId: "673abc...",
  period: "P1",
  verificationType: "random_ring",
  success: true
}
```

**Server Action:**
1. Find today's `AttendanceRecord`
2. Find lecture by period
3. Add verification to `lectures[].verifications[]`:
   - `time` = now
   - `type` = 'random_ring'
   - `success` = true
   - `event` = 'random_ring'

**Database Result:**
- ✅ Verification event recorded in lecture

---

## 🚨 Critical Issues Found

### Issue 1: Field Name Mismatch
**Problem:** Schemas use `enrollmentNumber` but database has `enrollmentNo`

**Location:**
- `AttendanceSession` schema (line 152)
- `AttendanceRecord` schema (line 182)

**Impact:**
- Attendance records won't link to students properly
- Admin panel queries will fail
- Reports will show "N/A" for enrollment numbers

**Fix Required:**
```javascript
// Change in both schemas:
enrollmentNumber: { type: String, required: true }
// TO:
enrollmentNo: { type: String, required: true }
```

### Issue 2: Index Mismatch
**Problem:** Index uses `enrollmentNumber` but should use `enrollmentNo`

**Location:**
- Line 231: `attendanceRecordSchema.index({ enrollmentNumber: 1, date: -1 });`

**Fix Required:**
```javascript
attendanceRecordSchema.index({ enrollmentNo: 1, date: -1 });
```

---

## ✅ How It Works (Summary)

1. **Morning Check-in:**
   - Student verifies face → Session starts → Timer begins
   - Creates `AttendanceSession` + `AttendanceRecord`

2. **During Day:**
   - APK sends heartbeat every 5 minutes → Updates timer
   - Lectures start/end → Updates lecture attendance
   - Random rings → Adds verification events

3. **End of Day:**
   - Final timer update → Session marked complete
   - Daily totals calculated → Attendance % computed
   - Record stored permanently in `AttendanceRecord`

4. **Admin Panel:**
   - Queries `AttendanceRecord` for historical data
   - Shows lecture-wise breakdown
   - Displays attendance percentages

---

## 📝 Data Flow Diagram

```
APK (Student)
    ↓
    ↓ POST /api/attendance/start-session
    ↓
Server (index.js)
    ↓
    ↓ Create/Update
    ↓
MongoDB
    ├── AttendanceSession (real-time)
    └── AttendanceRecord (daily summary)
    ↓
    ↓ Query
    ↓
Admin Panel
    └── Display attendance reports
```

---

## 🔧 Required Fixes

1. **Change `enrollmentNumber` to `enrollmentNo` in:**
   - `attendanceSessionSchema` (line 152)
   - `attendanceRecordSchema` (line 182)
   - Index definition (line 231)

2. **Update all API endpoints that use `enrollmentNumber`:**
   - `/api/attendance/start-session`
   - `/api/attendance/record`
   - Any queries using `enrollmentNumber`

3. **Test the flow:**
   - Start session from APK
   - Send timer updates
   - Verify data is stored correctly
   - Check admin panel displays correctly
