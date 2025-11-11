# 🕐 Period Management Feature

## Overview
Dynamic period configuration system that allows admins to add, remove, and modify class periods from the admin panel. Changes automatically apply to all timetables across all semesters and branches.

## Features Added

### 1. **Admin Panel UI** (`admin-panel/index.html`)
- New "Period Settings" navigation item (⏰ icon)
- Period configuration section with:
  - Visual period cards showing number, start time, end time, and duration
  - Add Period button (➕)
  - Delete Period button for each period (🗑️)
  - Reset to Default button (🔄)
  - Save & Apply button (💾)
  - Real-time statistics (total periods, class duration)

### 2. **Frontend Logic** (`admin-panel/renderer.js`)
Functions added:
- `loadPeriods()` - Fetches current period configuration
- `renderPeriods()` - Displays periods in the UI
- `addNewPeriod()` - Adds a new period slot
- `deletePeriod(index)` - Removes a period
- `updatePeriodTime(index, field, value)` - Updates start/end times
- `savePeriods()` - Saves changes to all timetables
- `resetPeriodsToDefault()` - Resets to default 8-period configuration
- `calculateDuration()` - Calculates period duration in minutes
- `updatePeriodStats()` - Updates statistics display

### 3. **Styling** (`admin-panel/styles.css`)
New CSS classes:
- `.period-info-card` - Information banner
- `.period-item` - Individual period card
- `.period-number` - Period number badge
- `.period-time-input` - Time input fields
- `.period-duration` - Duration display
- Responsive design for mobile devices

### 4. **Backend API** (`server/index.js`)
New endpoint:
```javascript
POST /api/periods/update-all
Body: { periods: Array<{number, startTime, endTime}> }
```

**What it does:**
- Updates the `periods` array in ALL timetables
- Automatically adjusts day schedules if period count changes
- Adds empty periods if new periods are added
- Removes excess periods if periods are deleted
- Broadcasts changes via Socket.IO to all connected clients

## How to Use

### For Admins:

1. **Open Admin Panel**
   - Navigate to the admin panel
   - Click on "Period Settings" (⏰) in the sidebar

2. **View Current Periods**
   - See all configured periods with their timings
   - Check total period count and class duration

3. **Add a Period**
   - Click "➕ Add Period"
   - New period appears with default timing (starts where last period ended)
   - Adjust start and end times as needed

4. **Modify Period Times**
   - Click on any time input field
   - Select new time
   - Duration updates automatically

5. **Delete a Period**
   - Click "🗑️ Delete" on any period
   - Confirm deletion
   - Periods are automatically renumbered

6. **Reset to Default**
   - Click "🔄 Reset to Default"
   - Restores the original 8-period configuration
   - Must click "Save" to apply

7. **Save Changes**
   - Click "💾 Save & Apply to All Timetables"
   - Confirm the action
   - All timetables across all semesters/branches are updated

## Default Period Configuration

```javascript
Period 1: 09:40 - 10:40 (60 min)
Period 2: 10:40 - 11:40 (60 min)
Period 3: 11:40 - 12:10 (30 min)
Period 4: 12:10 - 13:10 (60 min) - Lunch
Period 5: 13:10 - 14:10 (60 min)
Period 6: 14:10 - 14:20 (10 min) - Break
Period 7: 14:20 - 15:30 (70 min)
Period 8: 15:30 - 16:10 (40 min)
```

## Technical Details

### Database Schema
The `periods` field in the Timetable schema:
```javascript
periods: [{
    number: Number,      // Period number (1, 2, 3...)
    startTime: String,   // Format: "HH:MM" (24-hour)
    endTime: String      // Format: "HH:MM" (24-hour)
}]
```

### Validation
- Minimum 1 period required
- End time must be after start time
- All periods must have valid times
- Confirmation required before applying changes

### Real-time Updates
- Changes broadcast via Socket.IO
- Event: `periods_updated`
- All connected clients receive updates
- Mobile apps can listen for this event to refresh timetables

## Benefits

1. **No Code Changes Required** - Admins can modify periods without touching code
2. **Instant Updates** - Changes apply immediately to all timetables
3. **Flexible Scheduling** - Support any number of periods with any duration
4. **Consistent Data** - All timetables stay synchronized
5. **User-Friendly** - Visual interface with real-time feedback

## Example Use Cases

### Scenario 1: Add a 9th Period
1. Click "Add Period"
2. Set time: 16:10 - 17:00
3. Click "Save"
4. All timetables now have 9 periods

### Scenario 2: Change Lunch Time
1. Find Period 4 (Lunch)
2. Change from 12:10-13:10 to 13:00-14:00
3. Click "Save"
4. All timetables updated with new lunch timing

### Scenario 3: Remove Last Period
1. Click "Delete" on Period 8
2. Confirm deletion
3. Click "Save"
4. All timetables now have 7 periods

## Notes

- Changes affect **ALL** timetables (all semesters, all branches)
- Existing subject assignments are preserved
- Empty periods are added if period count increases
- Excess periods are removed if period count decreases
- Always backup your database before major changes

## Future Enhancements

Potential improvements:
- [ ] Period templates (Morning shift, Evening shift, etc.)
- [ ] Different periods for different days
- [ ] Bulk time adjustments (shift all periods by X minutes)
- [ ] Period presets for different institutions
- [ ] Export/Import period configurations
- [ ] History of period changes
- [ ] Undo/Redo functionality

---

**Created:** November 7, 2025  
**Feature Status:** ✅ Complete and Ready to Use
