# Attendance System Migration Plan

## Old System (Being Removed)
- ❌ Single countdown timer (2 hours)
- ❌ All-or-nothing attendance (complete timer = present)
- ❌ No lecture-wise tracking
- ❌ No partial credit

## New System (Implementing)

### 1. Automatic Lecture Detection
- ✅ Detects current lecture from timetable
- ✅ Auto-starts tracking when lecture begins
- ✅ Auto-stops when lecture ends
- ✅ Handles multiple lectures per day

### 2. Per-Lecture Tracking
- ✅ Tracks attendance for each lecture separately
- ✅ Default threshold: 75% of lecture time
- ✅ Admin can configure per-subject thresholds
- ✅ Example: 60-min lecture → need 45 min for present

### 3. Daily Attendance
- ✅ Aggregates all lectures for the day
- ✅ Threshold: 75% of total class time
- ✅ Excludes break times
- ✅ Only counts active session time

### 4. Real-Time Tracking
- ✅ Tracks every second student is connected
- ✅ Handles disconnections (saves segments)
- ✅ Auto-saves every 30 seconds
- ✅ Cumulative time calculation

### 5. Admin Configuration
- ✅ Set default lecture threshold (75%)
- ✅ Set subject-specific thresholds
- ✅ Set daily threshold (75%)
- ✅ Configure grace period (5 minutes)

## Implementation Steps

### Phase 1: Server-Side (Complete)
- ✅ AttendanceTracking.js model created
- ✅ AttendanceTracker.js service created
- ✅ API endpoints created
- ✅ Redis caching integrated

### Phase 2: Client-Side (In Progress)
- 🔄 Remove countdown timer UI
- 🔄 Add lecture status display
- 🔄 Integrate useAttendanceTracking hook
- 🔄 Update UI to show per-lecture status

### Phase 3: Integration
- 🔄 Connect timetable to attendance tracker
- 🔄 Auto-start/stop tracking per lecture
- 🔄 Display real-time attendance percentage
- 🔄 Show daily summary

### Phase 4: Admin Panel
- 🔄 Add threshold configuration UI
- 🔄 Add attendance reports
- 🔄 Add per-lecture analytics

## Migration Strategy

### For Existing Data
- Keep old attendance records for history
- New system starts fresh from migration date
- Both systems visible in reports (with labels)

### For Students
- No action required
- Face verification still mandatory
- App automatically tracks attendance
- Can see real-time status per lecture

### For Teachers
- See per-lecture attendance
- See daily attendance percentage
- Can view detailed time logs
- Can export reports

## Timeline
- Phase 1: ✅ Complete
- Phase 2: 🔄 In Progress (Today)
- Phase 3: 📅 Next
- Phase 4: 📅 After testing

## Success Criteria
- ✅ No countdown timer visible
- ✅ Automatic lecture tracking works
- ✅ 75% threshold applied correctly
- ✅ Admin can configure thresholds
- ✅ Reports show detailed data
