# Timer Showing 00:00 - Root Cause Analysis

## Symptoms

1. ✅ Student completes face verification
2. ✅ "TRACKING" badge shows (client thinks timer is running)
3. ❌ Timer displays "00:00" (not counting up)
4. ❌ Teacher dashboard shows "00:00" for all students
5. ✅ "Attendance tracking: 1 min recorded" shows (server IS tracking something)

## Root Cause

**Timer broadcasts are being received but ALL fields are undefined:**

```javascript
// Client logs show:
📡 Timer broadcast received: {
  studentId: undefined,
  enrollmentNo: undefined,
  attendedSeconds: undefined,
  isRunning: undefined,
  status: undefined
}
```

This means ONE of these is happening:

### Possibility 1: No Students with isRunning=true (MOST LIKELY)

The server's timer broadcast loop queries:
```javascript
const activeStudents = await StudentManagement.find({ isRunning: true });
```

If this returns 0 students, no broadcasts are sent with data.

**Why might isRunning be false?**
1. `start_timer` socket event not being received by server
2. `start_timer` failing silently (no active lecture found)
3. Database update failing
4. Student document not found

### Possibility 2: Broadcast Data Structure Issue

The broadcast might be happening but the data object is malformed or not being serialized correctly.

### Possibility 3: Socket Event Name Mismatch

Client listening for `timer_broadcast` but server emitting something else.

## Diagnostic Steps

### Step 1: Check if start_timer is being called

**Client side** (App.js line 1691):
```javascript
socketRef.current.emit('start_timer', {
  studentId: studentId,
  enrollmentNo: userData?.enrollmentNo,
  name: studentName || userData?.name,
  semester: semester,
  branch: branch
});
```

**Check logs:**
```bash
adb logcat | grep "Starting server-side timer"

# Should see:
# ▶️  Starting server-side timer...
```

### Step 2: Check if server receives start_timer

**Server side** (server/index.js line 967):
```javascript
socket.on('start_timer', async (data) => {
  console.log(`▶️  Starting timer for ${name}`);
  // ...
});
```

**Check Azure logs:**
```
# Should see:
# ▶️  Starting timer for Aditya Singhh
# ✅ Timer started for Aditya Singhh - Geography
```

### Step 3: Check if student has isRunning=true in database

**MongoDB Query:**
```javascript
db.studentmanagements.findOne({ 
  enrollmentNo: "0246CS241001" 
})

// Check fields:
{
  isRunning: true,  // ← Should be true
  status: "attending",
  attendanceSession: {
    sessionStartTime: ISODate("..."),
    totalAttendedSeconds: 60  // ← Should be increasing
  }
}
```

### Step 4: Check if timer broadcast loop is running

**Server logs should show every second:**
```
📡 Broadcasting timer for Aditya Singhh: {
  studentId: "507f1f77bcf86cd799439011",
  enrollmentNo: "0246CS241001",
  attendedSeconds: 60,
  subject: "Geography"
}
```

### Step 5: Check if client receives broadcasts

**Client logs:**
```bash
adb logcat | grep "Timer broadcast received - RAW DATA"

# Should see every second:
# 📡 Timer broadcast received - RAW DATA: {"studentId":"507f...","attendedSeconds":60,...}
```

## Most Likely Issue

Based on the symptoms, the most likely issue is:

**The `start_timer` socket event is failing because there's no active lecture at the current time.**

**Evidence:**
- "Attendance tracking: 1 min recorded" suggests server IS tracking something
- But timer shows 00:00, suggesting broadcasts aren't happening
- This matches the pattern of `start_timer` failing the lecture check

**Server code (line 987):**
```javascript
const lectureInfo = await getCurrentLectureInfo(student.semester, student.course);
if (!lectureInfo) {
    socket.emit('error', { message: 'No active lecture right now' });
    return;  // ← Timer NOT started!
}
```

## Solution

### Fix 1: Check Timetable Configuration

1. **Verify timetable exists** for student's semester/branch
2. **Verify current time** falls within a lecture period
3. **Verify lecture is not marked as break**

**Test:**
```bash
# Check current time
date

# Check if it matches any lecture in timetable
# Example: If current time is 08:34, check if there's a lecture at 08:00-09:00
```

### Fix 2: Add Better Error Handling

The client should listen for the `error` event from server:

```javascript
socketRef.current.on('error', (data) => {
  console.error('❌ Server error:', data.message);
  alert(`Timer Error: ${data.message}`);
});
```

### Fix 3: Fallback Timer Mode

If no active lecture, allow timer to run anyway (for testing):

```javascript
// In server start_timer handler:
if (!lectureInfo) {
    console.warn('⚠️  No active lecture, using fallback mode');
    lectureInfo = {
        subject: 'General Attendance',
        teacher: 'N/A',
        room: 'N/A',
        totalSeconds: 3600,  // 1 hour default
        elapsedSeconds: 0,
        remainingSeconds: 3600
    };
}
```

## Quick Test

To verify the issue, check Azure logs for:

```
▶️  Starting timer for Aditya Singhh
❌ No active lecture right now
```

If you see this, the problem is confirmed: **No lecture is active at the current time.**

## Immediate Action

1. **Check current time**: 08:34 AM
2. **Check timetable**: Does Geography class run at 08:34?
3. **Check day**: Is today's schedule configured?
4. **Check server time**: Is server time correct (not timezone issue)?

If timetable shows Geography at 00:00-09:00 but current time is 08:34, there might be a timezone mismatch or the timetable time format is wrong.

## Expected Behavior

When working correctly:

1. Student verifies face at 08:34
2. Client emits `start_timer`
3. Server finds active lecture (Geography, 00:00-09:00)
4. Server sets `isRunning: true` in database
5. Timer broadcast loop finds student
6. Broadcasts every second with attendedSeconds
7. Client receives and displays timer
8. Timer counts up: 00:01, 00:02, 00:03...

## Next Steps

1. Check Azure logs for "No active lecture" error
2. Verify timetable configuration
3. Check server timezone vs device timezone
4. Add error event listener in client
5. Consider fallback timer mode for testing
