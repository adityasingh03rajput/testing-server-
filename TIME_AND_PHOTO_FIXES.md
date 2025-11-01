# Time and Photo Verification Fixes

## Critical Server Fix

**Problem**: The `/api/time` endpoint was returning 404 because it was defined AFTER `server.listen()` in `server/index.js`. In Express.js, all routes must be registered BEFORE calling `server.listen()`.

**Solution**: Moved `server.listen()` to the very end of `server/index.js` after all route definitions. This fixed 24 routes that were not being registered, including the critical `/api/time` endpoint needed for time synchronization.

**Files Changed**:
- `server/index.js`: Moved `server.listen()` from line 795 to the end of the file (after all routes)

## Issues Fixed

### 1. Reference Photo Error in Face Verification
**Problem**: Face verification was showing unclear error messages when reference photo was missing.

**Solution**: Enhanced error handling in `FaceVerificationScreen.js`:
- Added clearer error messages with ❌ emoji for visibility
- Properly handles cases where:
  - Student not found in database
  - Student found but no photoUrl
  - Network errors
  - Server response errors
- Sets `isInitializing` to false to allow user to cancel and go back

**Changes**:
- Improved error messages to guide users to upload photo in admin panel
- Better logging for debugging photo loading issues

### 2. Android System Time vs Server Time
**Problem**: Multiple components were using Android device time (`new Date()`, `Date.now()`) instead of synchronized server time, allowing time manipulation.

**Solution**: Replaced all device time usage with server time throughout the app:

#### Files Fixed:

**FaceVerificationScreen.js**
- Added import: `import { getServerTime } from './ServerTime';`
- Now uses server time for verification timestamps

**TimetableScreen.js**
- Added import: `import { getServerTime } from './ServerTime';`
- `getCurrentDayIndex()`: Uses `getServerTime().nowDate().getDay()` with fallback
- `getCurrentPeriod()`: Uses `getServerTime().nowDate()` with fallback

**CircularTimer.js**
- Added import: `import { useServerTime } from './useServerTime';`
- Replaced `useState(new Date())` with `useServerTime(1000)` hook
- Removed manual `setInterval` for time updates (now handled by hook)
- Clock hands now move based on server time

**App.js**
- `isLeaveDay()`: Uses `serverTime.nowDate().getDay()` instead of `new Date().getDay()`
- `updateClassProgress()`: Uses `serverTime.nowDate()` instead of `new Date()`
- Attendance tracking: Uses `serverTime.now()` instead of `Date.now()`
- Background time tracking: Uses `serverTime.now()` for accurate time calculation
- Face verification timestamp: Uses `serverTime.now()` when marking class start

## How It Works

### Server Time Synchronization
1. App initializes `ServerTime` on startup
2. Syncs with server every 5 minutes
3. Calculates offset between server and device time
4. All time operations use: `serverTime.now()` or `serverTime.nowDate()`
5. Persists offset to AsyncStorage for continuity across restarts

### Fallback Mechanism
All time-related code includes try-catch blocks:
```javascript
try {
  const now = getServerTime().nowDate();
  // Use server time
} catch {
  const now = new Date();
  // Fallback to device time if server unavailable
}
```

## Benefits

1. **Security**: Students cannot manipulate device time to cheat attendance
2. **Consistency**: All users see the same time regardless of device settings
3. **Reliability**: Continues working even if server temporarily disconnects
4. **Accuracy**: Attendance tracking is based on actual server time
5. **Better UX**: Clear error messages guide users when photos are missing

## Testing Checklist

- [ ] Face verification shows clear error when photo missing
- [ ] Timetable shows correct current day based on server time
- [ ] Timer uses server time (not device time)
- [ ] Attendance tracking uses server time
- [ ] Background/foreground transitions use server time
- [ ] App works offline with last known time offset
- [ ] Time doesn't jump when changing device time
- [ ] Clock hands move smoothly based on server time

## Notes

- Server time is the source of truth for all time-dependent operations
- Device time is only used as fallback when server is unreachable
- Time offset is persisted across app restarts
- All critical attendance and verification operations use server time
