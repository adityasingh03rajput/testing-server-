# Server Time Implementation - Anti-Spoofing

## 🔒 Security Problem

**Current Issue:** App uses device time (`Date.now()`, `new Date()`)
- ✗ Students can change phone time settings
- ✗ Can bypass attendance time windows
- ✗ Can fake timestamps in verification
- ✗ Can manipulate session durations

**Solution:** Use server time for ALL time-sensitive operations

## 🎯 Key Design Principles

### 1. Time Continuity
**Problem:** If server disconnects, falling back to device time causes time jumps
- Device time: 25 Dec 2025 10:00 AM
- Server time: 26 Oct 2025 02:01 PM
- Server disconnects → Time jumps back to 25 Dec (WRONG!)

**Solution:** Keep using last known offset
- Server syncs: Offset = -60 days
- Server disconnects: Continue using offset
- Time continues from 26 Oct 2025 02:01 PM (CORRECT!)
- When server reconnects: Update offset smoothly

### 2. Persistence Across Restarts
**Problem:** App restart loses time offset
**Solution:** Save offset to AsyncStorage
- Offset persists across app restarts
- Time continuity maintained
- No time jumps on app launch

### 3. Graceful Degradation
**Problem:** Server unreachable on first launch
**Solution:** Use device time initially, sync when available
- First launch: Use device time (offset = 0)
- Server syncs: Update offset
- Save to storage
- Future launches: Use saved offset

---

## 🎯 Implementation Steps

### 1. Server-Side (Already Done ✅)

**File:** `server/index.js`

```javascript
// Server time endpoint (for time synchronization)
app.get('/api/time', (req, res) => {
    const serverTime = Date.now();
    res.json({
        success: true,
        serverTime: serverTime,
        serverTimeISO: new Date(serverTime).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
});
```

---

### 2. Client-Side Time Sync (Already Created ✅)

**File:** `ServerTime.js`

Features:
- Syncs with server on app start
- Re-syncs every 5 minutes
- Uses median of 3 samples for accuracy
- Calculates network latency
- Provides secure time methods

---

### 3. Integration in App.js

**Add Import:**
```javascript
import { initializeServerTime, getServerTime } from './ServerTime';
```

**Initialize in useEffect:**
```javascript
useEffect(() => {
  // Initialize server time sync
  const serverTime = initializeServerTime(SOCKET_URL);
  serverTime.initialize().then(() => {
    console.log('✅ Server time synchronized');
  });

  // ... rest of initialization
}, []);
```

**Replace ALL Date.now() and new Date() with:**
```javascript
// OLD (Insecure):
const now = new Date();
const currentTime = Date.now();

// NEW (Secure):
const serverTime = getServerTime();
const now = serverTime.nowDate();
const currentTime = serverTime.now();
```

---

### 4. Critical Places to Update

#### A. Timetable Current Class Detection

**File:** `App.js` (around line 400-450)

```javascript
// OLD:
const now = new Date();
const currentHour = now.getHours();
const currentMinute = now.getMinutes();

// NEW:
const serverTime = getServerTime();
const now = serverTime.nowDate();
const currentHour = now.getHours();
const currentMinute = now.getMinutes();
```

#### B. Random Ring Session Creation

**File:** `App.js` or `RandomRingScreen.js`

```javascript
// OLD:
const sessionId = generateUUID();
const timestamp = Date.now();

// NEW:
const serverTime = getServerTime();
const sessionId = generateUUID();
const timestamp = serverTime.now();

// Validate timestamp on server
if (!serverTime.validateTimestamp(timestamp)) {
  alert('Time manipulation detected!');
  return;
}
```

#### C. Attendance Record Timestamps

**File:** `App.js` (saveAttendanceToServer function)

```javascript
// OLD:
const record = {
  date: new Date().toDateString(),
  timestamp: Date.now(),
  // ...
};

// NEW:
const serverTime = getServerTime();
const record = {
  date: serverTime.nowDate().toDateString(),
  timestamp: serverTime.now(),
  serverTimeISO: serverTime.nowISO(),
  // ...
};
```

#### D. Face Verification Timestamps

**File:** `FaceVerificationScreen.js`

```javascript
// OLD:
const verificationData = {
  timestamp: Date.now(),
  // ...
};

// NEW:
const serverTime = getServerTime();
const verificationData = {
  timestamp: serverTime.now(),
  serverTimeISO: serverTime.nowISO(),
  // ...
};
```

#### E. Timer Display

**File:** `CircularTimer.js` and `TeacherDashboardNew.js`

```javascript
// OLD:
const getCurrentTime = () => {
  return new Date().toLocaleTimeString();
};

// NEW:
const getCurrentTime = () => {
  const serverTime = getServerTime();
  return serverTime.format('HH:mm:ss');
};
```

#### F. Day Detection

**File:** `App.js` (currentDay state)

```javascript
// OLD:
const [currentDay, setCurrentDay] = useState(() => {
  const dayIndex = new Date().getDay();
  const days = ['Monday', 'Monday', 'Tuesday', ...];
  return days[dayIndex];
});

// NEW:
const [currentDay, setCurrentDay] = useState(() => {
  const serverTime = getServerTime();
  return serverTime.getCurrentDay();
});
```

---

### 5. Server-Side Validation

**File:** `server/index.js`

Add timestamp validation to critical endpoints:

```javascript
// Middleware to validate timestamps
const validateTimestamp = (req, res, next) => {
  const clientTimestamp = req.body.timestamp || req.query.timestamp;
  
  if (!clientTimestamp) {
    return res.status(400).json({
      success: false,
      message: 'Timestamp required'
    });
  }

  const serverTime = Date.now();
  const drift = Math.abs(serverTime - clientTimestamp);
  const maxDrift = 60 * 1000; // 60 seconds

  if (drift > maxDrift) {
    console.warn(`⚠️ Time manipulation detected: ${drift}ms drift`);
    return res.status(400).json({
      success: false,
      message: 'Time synchronization error. Please restart app.',
      drift: drift
    });
  }

  next();
};

// Apply to critical endpoints
app.post('/api/attendance/record', validateTimestamp, async (req, res) => {
  // ... existing code
});

app.post('/api/verify-face', validateTimestamp, async (req, res) => {
  // ... existing code
});

app.post('/api/random-ring/verify', validateTimestamp, async (req, res) => {
  // ... existing code
});
```

---

### 6. Ultrasonic Beacon Timestamp

**File:** `TeacherBottomNav.js` or `RandomRingScreen.js`

```javascript
// When generating ultrasonic beacon
const generateUltrasonicBeacon = () => {
  const serverTime = getServerTime();
  
  const beacon = {
    sessionId: generateUUID(),
    timestamp: serverTime.now(), // Server time, not device time
    locationId: classroomId,
    // ... encode in ultrasonic signal
  };
  
  return beacon;
};
```

**File:** `StudentApp.js` (when detecting beacon)

```javascript
// When student detects ultrasonic signal
const verifyUltrasonicBeacon = (decodedBeacon) => {
  const serverTime = getServerTime();
  
  // Check if beacon is fresh (within 60 seconds)
  const beaconAge = serverTime.now() - decodedBeacon.timestamp;
  
  if (beaconAge > 60000) {
    console.warn('⚠️ Beacon too old, possible replay attack');
    return false;
  }
  
  // Validate timestamp with server
  if (!serverTime.validateTimestamp(decodedBeacon.timestamp)) {
    console.warn('⚠️ Beacon timestamp invalid');
    return false;
  }
  
  return true;
};
```

---

### 7. Testing Time Sync

**Add Debug Screen:**

```javascript
// TimeDebugScreen.js
import { getServerTime } from './ServerTime';

export default function TimeDebugScreen() {
  const [info, setInfo] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const serverTime = getServerTime();
      setInfo({
        deviceTime: new Date().toISOString(),
        serverTime: serverTime.nowISO(),
        offset: serverTime.serverTimeOffset,
        isSynced: serverTime.isSynchronized(),
        lastSync: serverTime.getTimeSinceLastSync(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <Text>Device Time: {info.deviceTime}</Text>
      <Text>Server Time: {info.serverTime}</Text>
      <Text>Offset: {info.offset}ms</Text>
      <Text>Synced: {info.isSynced ? 'Yes' : 'No'}</Text>
      <Text>Last Sync: {info.lastSync}s ago</Text>
    </View>
  );
}
```

---

## 🎯 Benefits

### Security:
- ✅ Prevents time manipulation
- ✅ Validates all timestamps server-side
- ✅ Detects replay attacks
- ✅ Ensures session freshness

### Accuracy:
- ✅ Accounts for network latency
- ✅ Uses median of multiple samples
- ✅ Auto-syncs every 5 minutes
- ✅ Handles clock drift

### Reliability:
- ✅ Fallback to device time if sync fails
- ✅ Warns user if not synced
- ✅ Automatic retry on failure
- ✅ Works offline (with warning)

---

## 🚀 Deployment Checklist

- [ ] Add ServerTime.js to project
- [ ] Add /api/time endpoint to server
- [ ] Initialize ServerTime in App.js
- [ ] Replace Date.now() in all files
- [ ] Replace new Date() in all files
- [ ] Add timestamp validation middleware
- [ ] Update ultrasonic beacon generation
- [ ] Update face verification
- [ ] Update attendance recording
- [ ] Update timetable detection
- [ ] Test with device time changed
- [ ] Test with network latency
- [ ] Test offline behavior
- [ ] Add time sync indicator in UI

---

## 📝 Files to Update

1. **App.js** - Initialize ServerTime, replace all Date usage
2. **CircularTimer.js** - Use server time for display
3. **TimetableScreen.js** - Use server time for current period
4. **FaceVerificationScreen.js** - Use server time for timestamps
5. **TeacherDashboardNew.js** - Use server time for display
6. **NotificationsScreen.js** - Use server time for scheduling
7. **CalendarScreen.js** - Use server time for date display
8. **server/index.js** - Add validation middleware

---

## 🔒 Patent Protection

This server-time synchronization is part of the **LetsBunk patent**:

**Claim 10:** "wherein said verification session has a limited validity window of 60 seconds, and wherein timestamps embedded in ultrasonic signals are validated against server time with tolerance of ±5 seconds to prevent replay attacks."

**Claim 38(f):** "replay attacks (prevented by time-limited cryptographic sessions)"

The server time sync ensures:
- Ultrasonic beacons expire after 60 seconds
- Timestamps cannot be manipulated
- Replay attacks are impossible
- Session freshness is guaranteed

---

## 🎯 Next Steps

1. **Immediate:** Add ServerTime initialization to App.js
2. **High Priority:** Update all Date.now() calls
3. **Medium Priority:** Add server-side validation
4. **Low Priority:** Add time sync UI indicator

**Estimated Time:** 2-3 hours to implement fully
**Impact:** Eliminates major security vulnerability
**Difficulty:** Medium (requires careful testing)
