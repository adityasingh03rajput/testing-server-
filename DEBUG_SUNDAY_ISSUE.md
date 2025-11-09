# Debug: Sunday Not Showing Issue

## Problem
Sunday is in the database but:
1. Not showing in the app
2. CircularTimer not displaying Sunday lectures

## Investigation

### Data Flow
1. **Database** → Has Sunday data ✅
2. **API Response** → Returns Sunday data (need to verify)
3. **convertTimetableFormat()** → Converts to `schedule.Sunday` ✅
4. **currentDay state** → Should be "Sunday" on Sundays
5. **CircularTimer** → Looks for `timetable.schedule[currentDay]`

### Potential Issues

#### Issue 1: Case Sensitivity
- `convertTimetableFormat` creates: `schedule.Sunday` (capitalized)
- `currentDay` might be: `"sunday"` (lowercase)
- CircularTimer looks for: `timetable.schedule[currentDay]`
- **Result**: Mismatch! `schedule["sunday"]` !== `schedule["Sunday"]`

#### Issue 2: getCurrentDay() Return Value
```javascript
// In App.js line ~158
const [currentDay, setCurrentDay] = useState(() => {
  try {
    const serverTime = getServerTime();
    return serverTime.getCurrentDay(); // Returns "Sunday" (capitalized)
  } catch {
    const dayIndex = new Date().getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex]; // Returns "Sunday" (capitalized)
  }
});
```

So `currentDay` = "Sunday" (capitalized) ✅

#### Issue 3: convertTimetableFormat()
```javascript
dayKeys.forEach((dayKey) => {
  const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
  // dayKey from DB = "sunday" (lowercase)
  // dayName = "Sunday" (capitalized)
  schedule[dayName] = ...
});
```

So `schedule.Sunday` exists ✅

### The Real Issue

**CircularTimer console logs show:**
```javascript
console.log('CircularTimer - Current Day:', currentDay);
// Should show: "Sunday"

console.log('CircularTimer - Schedule for day:', timetable?.schedule?.[currentDay]);
// Should show: array of Sunday periods
// If showing undefined, then mismatch exists
```

### Debugging Steps

1. **Check what currentDay actually is:**
   - Add console.log in App.js before passing to CircularTimer
   - Verify it's "Sunday" not "sunday"

2. **Check what schedule keys are:**
   - Add console.log after convertTimetableFormat
   - Verify schedule has "Sunday" key

3. **Check CircularTimer receives correct data:**
   - Check CircularTimer console logs
   - Verify timetable.schedule exists
   - Verify timetable.schedule[currentDay] exists

### Solution

If the issue is case mismatch, we need to ensure consistency:

**Option A: Make everything lowercase**
```javascript
// In convertTimetableFormat
const dayName = dayKey.toLowerCase();
schedule[dayName] = ...

// In getCurrentDay
return serverTime.getCurrentDay().toLowerCase();
```

**Option B: Make everything capitalized** (current approach)
- Ensure all day references are capitalized
- This should already be working

**Option C: Case-insensitive lookup**
```javascript
// In CircularTimer
const scheduleKey = Object.keys(timetable.schedule).find(
  key => key.toLowerCase() === currentDay.toLowerCase()
);
const schedule = timetable.schedule[scheduleKey];
```

### Next Steps

1. Add debug logs to see actual values
2. Verify case consistency
3. Apply fix based on findings
