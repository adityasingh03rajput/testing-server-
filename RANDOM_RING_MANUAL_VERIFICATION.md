# Random Ring Manual Accept/Reject Feature - Implementation Complete

## Overview
Added manual verification feature for Random Ring where teachers can accept or reject student presence, with a 5-minute face verification window for rejected students.

## What Was Implemented

### 1. Database Schema Updates (server/index.js)

**Added to RandomRing Schema:**
```javascript
selectedStudents: [{
  // ... existing fields
  teacherAction: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  teacherActionTime: Date,
  teacherActionReason: String,
  faceVerifiedAfterRejection: Boolean,
  faceVerificationTime: Date
}]
```

### 2. New API Endpoints (server/index.js)

**POST /api/random-ring/teacher-action**
- Teacher manually accepts or rejects student presence
- Parameters: `randomRingId`, `studentId`, `action` ('accepted' or 'rejected')
- If accepted: Marks student as verified, resumes timer
- If rejected: Notifies student to verify face within 5 minutes

**POST /api/random-ring/verify-after-rejection**
- Student verifies face after teacher rejection
- Parameters: `randomRingId`, `studentId`, `verificationPhoto`, `bssid`
- Validates 5-minute window
- Resumes timer if verification successful

### 3. Teacher UI Updates (StudentList.js)

**Accept/Reject Buttons:**
- Show for each student during active random ring
- Only visible when `teacherAction === 'pending'` and not verified
- Buttons disappear after teacher takes action or student verifies

**Status Display:**
- "✓ Accepted by teacher" - Green
- "✕ Rejected - Waiting for face verification" - Red
- "✓ Face verified after rejection" - Green

**UI Components:**
```javascript
<TouchableOpacity style={styles.acceptButton}>
  <Text>✓ Accept</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.rejectButton}>
  <Text>✕ Reject</Text>
</TouchableOpacity>
```

### 4. Student App Updates (App.js)

**Socket Listeners:**
- `random_ring_teacher_accepted` - Teacher accepted presence
- `random_ring_teacher_rejected` - Teacher rejected, need face verification
- `random_ring_teacher_action_update` - Update teacher dashboard
- `random_ring_face_verified_after_rejection` - Student verified after rejection

**Face Verification Flow:**
- If rejected: Auto-opens face verification screen
- 5-minute countdown timer
- Uses `/api/random-ring/verify-after-rejection` endpoint
- Resumes timer on successful verification

### 5. Real-Time Updates

**Socket.IO Events:**
```javascript
// Teacher accepts student
io.emit('random_ring_teacher_accepted', {
  studentId, enrollmentNo, message, randomRingId
});

// Teacher rejects student
io.emit('random_ring_teacher_rejected', {
  studentId, enrollmentNo, message, randomRingId, expiresAt
});

// Teacher action update (for dashboard)
io.emit('random_ring_teacher_action_update', {
  randomRingId, studentId, action, teacherActionTime
});

// Student verified face after rejection
io.emit('random_ring_face_verified_after_rejection', {
  teacherId, randomRingId, studentId, studentName, message
});
```

## User Flow

### Teacher Flow:

1. **Initiate Random Ring**
   - Press Random Ring button
   - Select "All Students" or "Select Number"
   - Students receive notification

2. **Manual Verification**
   - See list of selected students
   - Each student has Accept/Reject buttons
   - Click Accept → Student marked present, timer resumes
   - Click Reject → Student gets 5-minute window to verify face

3. **Monitor Status**
   - Buttons disappear after action taken
   - See status: "Accepted", "Rejected - Waiting", or "Face verified"
   - Get notification when student verifies face after rejection

### Student Flow:

1. **Receive Random Ring Notification**
   - Get push notification
   - Face verification screen opens automatically

2. **If Teacher Accepts:**
   - Receive notification: "Teacher verified your presence"
   - Timer resumes automatically
   - No action needed

3. **If Teacher Rejects:**
   - Receive notification: "Teacher marked you absent. Verify face within 5 minutes"
   - Face verification screen opens
   - 5-minute countdown starts
   - Must verify face to resume timer

4. **Face Verification After Rejection:**
   - Complete face verification
   - If successful: Timer resumes, teacher notified
   - If failed or timeout: Marked absent

## Technical Details

### Timer Resume Logic:

**Teacher Accepts:**
```javascript
await StudentManagement.findByIdAndUpdate(student._id, {
  isRunning: true,
  status: 'attending'
});
```

**Face Verified After Rejection:**
```javascript
await StudentManagement.findByIdAndUpdate(studentDoc._id, {
  isRunning: true,
  status: 'attending'
});
```

### 5-Minute Window Validation:

```javascript
const now = new Date();
const elapsed = (now - student.teacherActionTime) / 1000;

if (elapsed > 300) { // 5 minutes
  return res.status(400).json({
    success: false,
    error: 'Verification window expired (5 minutes)'
  });
}
```

### State Management:

**Teacher Dashboard:**
```javascript
const [activeRandomRing, setActiveRandomRing] = useState({
  _id: randomRingId,
  selectedStudents: [{
    studentId, enrollmentNo, name,
    teacherAction: 'pending',
    verified: false,
    faceVerifiedAfterRejection: false
  }]
});
```

**Student App:**
```javascript
const [randomRingData, setRandomRingData] = useState({
  randomRingId,
  teacherId,
  timestamp,
  expiresAt,
  isRejection: true // Flag for rejection case
});
```

## Benefits

### ✅ Manual Override
- Teachers can manually verify presence
- Useful when face verification fails
- Handles edge cases (poor lighting, camera issues)

### ✅ Second Chance
- Students get 5 minutes to verify after rejection
- Prevents false absences
- Fair verification process

### ✅ Real-Time Feedback
- Instant notifications to students
- Live status updates on teacher dashboard
- Transparent verification process

### ✅ Automatic Timer Management
- Timer resumes automatically on acceptance
- Timer resumes after successful face verification
- No manual intervention needed

## Testing

### Test Teacher Accept:
1. Initiate random ring
2. Click "Accept" for a student
3. Verify student receives notification
4. Check student timer resumes
5. Verify buttons disappear

### Test Teacher Reject:
1. Initiate random ring
2. Click "Reject" for a student
3. Verify student receives notification
4. Check face verification opens on student device
5. Verify 5-minute countdown

### Test Face Verification After Rejection:
1. Teacher rejects student
2. Student completes face verification
3. Verify timer resumes
4. Check teacher receives notification
5. Verify status updates on dashboard

## Files Modified

1. **server/index.js** - Added schema fields and API endpoints
2. **StudentList.js** - Added accept/reject buttons and status display
3. **App.js** - Added socket listeners and face verification logic

## Next Steps

1. ✅ Commit and push changes
2. ✅ Wait for Azure deployment
3. ✅ Test on real devices
4. ✅ Build new APK
5. ✅ Distribute to users

## Notes

- Accept/Reject buttons only show during active random ring
- Buttons disappear after action or verification
- 5-minute window is strict (server-side validation)
- Face verification uses existing biometric system
- All actions logged in database for audit trail
