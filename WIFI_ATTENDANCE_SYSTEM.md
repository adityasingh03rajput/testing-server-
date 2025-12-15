# WiFi-Based Attendance System

## Overview

The WiFi-based attendance system ensures students are physically present in the correct classroom by validating their WiFi connection against authorized BSSIDs (WiFi network identifiers) for each room.

## How It Works

### 1. Admin Panel Setup
- Teachers configure room numbers and their corresponding WiFi BSSIDs in the admin panel
- Each classroom has a unique BSSID (e.g., Room A2 → BSSID: `b4:86:18:6f:fb:ec`)
- BSSIDs are stored in the `Classroom` collection with `wifiBSSID` field

### 2. Timetable Integration
- Timetable entries include room numbers (mandatory field)
- Example: Sem 3 DS, Period 3 (09:30-10:15), Technical Communication, Prof Kumar, Room A2
- System automatically determines authorized BSSID based on current lecture and room

### 3. Student Timer Logic
- **Timer Start**: Only allowed when connected to authorized classroom WiFi
- **Timer Running**: Continuously monitors WiFi connection
- **WiFi Disconnection**: 2-minute grace period before pausing timer
- **WiFi Reconnection**: Automatically resumes timer if reconnected to authorized BSSID
- **Wrong WiFi**: Timer pauses if connected to unauthorized BSSID

### 4. Grace Period System
- **Duration**: 2 minutes after WiFi disconnection
- **Purpose**: Handles brief network interruptions
- **Behavior**: Timer continues running during grace period
- **Expiration**: Timer pauses if not reconnected within 2 minutes

### 5. Attendance History Logging
All WiFi events are logged with the following information:
- **enrollmentNo**: Student identifier (standardized field)
- **Timestamp**: When event occurred
- **BSSID**: Connected/disconnected WiFi identifier
- **Room Number**: Classroom where event occurred
- **Subject/Lecture Details**: Current lecture information
- **Duration of Disconnection**: Time spent offline
- **Event Type**: connected, disconnected, bssid_changed, grace_expired

## Technical Implementation

### Client-Side Components

#### 1. WiFiManager.js
- Detects current WiFi BSSID using `react-native-wifi-reborn`
- Manages authorized BSSID cache
- Handles permission requests
- Monitors connection changes

#### 2. useWiFiAttendance.js
- React hook for WiFi-based attendance tracking
- Manages timer state based on WiFi validation
- Handles grace period countdown
- Logs attendance events

#### 3. WiFiStatusIndicator.js
- Visual component showing WiFi connection status
- Displays current BSSID and authorization status
- Shows grace period countdown
- Provides refresh functionality

#### 4. CircularTimer.js (Updated)
- Integrates with WiFi attendance system
- Shows WiFi status indicator
- Disables start button when WiFi invalid
- Displays appropriate hints based on WiFi status

### Server-Side Endpoints

#### WiFi Event Logging
```javascript
POST /api/attendance/wifi-event
{
  "timestamp": "2024-12-10T10:30:00Z",
  "type": "disconnected",
  "bssid": "b4:86:18:6f:fb:ec",
  "studentId": "0246CD241001",
  "lecture": {
    "subject": "Technical Communication",
    "room": "A2",
    "startTime": "09:30",
    "endTime": "10:15"
  },
  "gracePeriod": true
}
```

#### BSSID Validation
```javascript
POST /api/attendance/validate-bssid
{
  "studentId": "0246CD241001",
  "currentBSSID": "b4:86:18:6f:fb:ec",
  "roomNumber": "A2"
}
```

#### Timer Control
```javascript
POST /api/attendance/timer-paused
{
  "studentId": "0246CD241001",
  "reason": "wifi_disconnected",
  "timestamp": "2024-12-10T10:32:00Z"
}

POST /api/attendance/timer-resumed
{
  "studentId": "0246CD241001",
  "reason": "wifi_reconnected",
  "timestamp": "2024-12-10T10:34:00Z"
}
```

### Database Schema Updates

#### StudentManagement Collection
```javascript
attendanceSession: {
  // ... existing fields ...
  wifiEvents: [{
    timestamp: Date,
    type: String, // 'connected', 'disconnected', 'bssid_changed', 'grace_expired'
    bssid: String,
    lecture: {
      subject: String,
      room: String,
      startTime: String,
      endTime: String
    },
    gracePeriod: Boolean
  }],
  pauseEvents: [{
    type: String, // 'paused', 'resumed'
    reason: String, // 'wifi_disconnected', 'grace_expired', 'wrong_bssid'
    timestamp: Date
  }]
}
```

#### Classroom Collection (Existing)
```javascript
{
  roomNumber: String, // "A2"
  building: String,   // "CS"
  capacity: Number,   // 60
  wifiBSSID: String,  // "b4:86:18:6f:fb:ec"
  isActive: Boolean
}
```

## User Experience

### Student App Flow

1. **Login**: Student logs in with enrollment number
2. **Lecture Detection**: App detects current lecture from timetable
3. **WiFi Check**: App checks if connected to authorized classroom WiFi
4. **Status Display**: WiFi status indicator shows connection status
5. **Timer Control**: 
   - ✅ Green: Connected to correct WiFi - can start timer
   - ⏳ Yellow: Grace period active - timer still running
   - ❌ Red: Wrong/no WiFi - timer paused/cannot start
6. **Notifications**: Clear messages about WiFi requirements

### Teacher Admin Panel

1. **Classroom Management**: Configure room numbers and WiFi BSSIDs
2. **Bulk Import**: CSV import for multiple classrooms
3. **Timetable Setup**: Assign rooms to lecture periods
4. **Real-time Monitoring**: See student WiFi connection status
5. **Attendance Reports**: View WiFi-based attendance history

## Security Features

### BSSID Validation
- Server-side validation of WiFi BSSIDs
- Prevents spoofing by validating against authorized list
- Real-time monitoring of connection changes

### Time Synchronization
- Uses server time for all timestamps
- Prevents device time manipulation
- Consistent timing across all devices

### Audit Trail
- Complete log of all WiFi events
- Tamper-proof server-side storage
- Detailed attendance history with reasons

## Configuration

### Admin Panel Setup
1. Navigate to "Classrooms" section
2. Add classroom with room number and WiFi BSSID
3. Ensure classroom is marked as "Active"
4. Assign room to timetable periods

### Mobile App Setup
1. Grant location permissions (required for WiFi BSSID access)
2. Ensure WiFi is enabled on device
3. Connect to classroom WiFi network
4. Start attendance session

## Troubleshooting

### Common Issues

#### "Not connected to WiFi"
- **Cause**: Device not connected to any WiFi
- **Solution**: Connect to classroom WiFi network

#### "Wrong classroom - Connect to [Room] WiFi"
- **Cause**: Connected to different WiFi network
- **Solution**: Connect to the correct classroom WiFi

#### "Room [X] WiFi not configured"
- **Cause**: Classroom BSSID not set in admin panel
- **Solution**: Configure BSSID in admin panel

#### "Grace period: X:XX"
- **Cause**: Temporarily disconnected from WiFi
- **Solution**: Reconnect within 2 minutes to avoid timer pause

### Debug Information

#### Client-Side Logs
```javascript
📶 WiFi Status Changed:
   Connected: true → false
   BSSID: b4:86:18:6f:fb:ec → null
📶 WiFi disconnected - starting 2-minute grace period
⏰ Grace period expired - pausing timer
```

#### Server-Side Logs
```javascript
📶 WiFi Event: disconnected 0246CD241001 b4:86:18:6f:fb:ec true
⏸️ Timer paused for John Doe - WiFi grace period expired
📶 BSSID Check: b4:86:18:6f:fb:ec vs b4:86:18:6f:fb:ec = ✅
```

## Performance Considerations

### Client-Side
- WiFi checks every 10 seconds (configurable)
- Local caching of authorized BSSIDs
- Efficient event logging with 50-event limit

### Server-Side
- Indexed database queries on enrollmentNo
- Batch processing of WiFi events
- Automatic cleanup of old events

## Future Enhancements

### Planned Features
1. **Multiple BSSIDs per Room**: Support for WiFi extenders
2. **Geofencing**: Additional location validation
3. **Machine Learning**: Detect suspicious patterns
4. **Parent Notifications**: Automated absence alerts
5. **Analytics Dashboard**: WiFi attendance insights

### Integration Possibilities
1. **Campus WiFi System**: Direct integration with network infrastructure
2. **Student ID Cards**: NFC/RFID validation
3. **Biometric Systems**: Multi-factor authentication
4. **LMS Integration**: Sync with learning management systems

## API Reference

### Complete Endpoint List

#### WiFi Validation
- `GET /api/classrooms` - Get all classrooms with BSSIDs
- `POST /api/attendance/validate-bssid` - Validate current BSSID
- `GET /api/attendance/authorized-bssid/:studentId` - Get authorized BSSID for student

#### Event Logging
- `POST /api/attendance/wifi-event` - Log WiFi connection event
- `POST /api/attendance/timer-paused` - Log timer pause event
- `POST /api/attendance/timer-resumed` - Log timer resume event

#### Classroom Management
- `GET /api/classrooms` - List all classrooms
- `POST /api/classrooms` - Create new classroom
- `PUT /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom

## Deployment Notes

### Dependencies
```json
{
  "react-native-wifi-reborn": "^4.12.0"
}
```

### Permissions (Android)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
```

### Build Configuration
1. Install dependencies: `npm install`
2. Link native modules: `npx react-native link`
3. Build APK: `./BUILD_APK_FIXED.bat`
4. Test on real device (WiFi detection requires physical device)

## Testing

### Development Mode
- Uses simulated BSSID for testing: `b4:86:18:6f:fb:ec`
- All WiFi validation logic works with test data
- Can simulate different connection states

### Production Testing
1. Configure real classroom BSSIDs in admin panel
2. Test with actual WiFi networks
3. Verify grace period behavior
4. Check attendance history logging
5. Test timer pause/resume functionality

This WiFi-based attendance system provides a robust, secure, and user-friendly way to ensure students are physically present in the correct classroom during lectures.