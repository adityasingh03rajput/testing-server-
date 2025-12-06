# Random Ring Feature - Testing Guide

## Prerequisites
- Server running on Azure: https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
- At least 2 devices: 1 teacher device, 1+ student devices
- All devices connected to internet
- Students logged in and timer running (status: 'attending')

## Test Scenario 1: Random Ring All Students

### Teacher Side
1. Login as teacher
2. Navigate to Home tab
3. Tap the floating bell button (🔔) in bottom-right corner
4. Select "All Students" option
5. Tap "Start Random Ring"
6. **Expected:** Success message showing number of students notified

### Student Side
1. Student device should receive alert: "🔔 Random Ring! You have been selected for attendance verification."
2. Face verification screen should open automatically
3. Complete face verification
4. **Expected:** Success message with response time (e.g., "Response time: 15s")

### Server Logs
```
🔔 Random Ring initiated: { type: 'all', count: undefined, teacherId: '...', semester: '1', branch: '...' }
📊 Found X attending students out of Y total
✅ Selected X students for random ring
💾 Random ring record created: [randomRingId]
```

### Student Logs
```
🔔 Random Ring notification received: { randomRingId: '...', studentId: '...', ... }
📸 Auto-opening face verification for random ring
✅ Face verification successful
🔔 Submitting Random Ring verification to server...
✅ Random Ring verification submitted successfully (response time: 15s)
```

## Test Scenario 2: Random Ring Select Number

### Teacher Side
1. Login as teacher
2. Tap floating bell button (🔔)
3. Select "Select Number" option
4. Enter number (e.g., "3")
5. Tap "Start Random Ring"
6. **Expected:** Success message showing "Random ring sent to 3 student(s)!"

### Student Side
- Only 3 randomly selected students should receive notification
- Other students should NOT receive notification
- Selected students follow same verification flow as Scenario 1

## Test Scenario 3: Verification Timeout

### Setup
1. Teacher sends random ring to students
2. Student receives notification

### Test
1. Student does NOT verify within 5 minutes
2. **Expected:** After 5 minutes, alert appears: "⏰ Random Ring verification expired. You did not verify in time."
3. Face verification screen should close (if still open)

## Test Scenario 4: Verification After Timeout

### Setup
1. Teacher sends random ring
2. Wait 5+ minutes

### Test
1. Student tries to verify after timeout
2. **Expected:** Server returns error: "Random ring expired"
3. Student sees alert: "❌ Verification Failed - Random ring expired"

## Test Scenario 5: No Students Attending

### Setup
1. All students have timer stopped (status: 'absent')

### Test
1. Teacher sends random ring
2. **Expected:** Success message: "No students currently attending"
3. No notifications sent

## Test Scenario 6: Random Ring History

### API Test
```bash
curl https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/random-ring/history/[teacherId]
```

**Expected Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": "...",
      "timestamp": "2024-12-06T...",
      "type": "all",
      "count": 5,
      "semester": "1",
      "branch": "...",
      "status": "completed",
      "verifiedCount": 5,
      "totalCount": 5,
      "selectedStudents": [...]
    }
  ]
}
```

## Verification Checklist

### Teacher UI
- [ ] Bell button visible on home screen
- [ ] Dialog opens when bell tapped
- [ ] "All Students" option selectable
- [ ] "Select Number" option selectable
- [ ] Number input appears when "Select Number" selected
- [ ] Number input only accepts numbers
- [ ] "Start Random Ring" button disabled when invalid
- [ ] Success message shows correct student count
- [ ] Error message shows if network fails

### Student UI
- [ ] Alert appears when notification received
- [ ] Face verification opens automatically
- [ ] Verification submits to server after success
- [ ] Success message shows response time
- [ ] Timeout alert appears after 5 minutes
- [ ] Can verify normally after random ring (timer continues)

### Server
- [ ] Random ring record created in database
- [ ] Socket notifications sent to correct students
- [ ] Verification status recorded correctly
- [ ] Response time calculated correctly
- [ ] Status changes to 'completed' when all verify
- [ ] History endpoint returns correct data

### Edge Cases
- [ ] Works with 1 student
- [ ] Works with 100+ students
- [ ] Works when some students offline
- [ ] Works when student closes app during verification
- [ ] Works when network is slow
- [ ] Multiple random rings can run simultaneously
- [ ] Student can't verify twice for same random ring

## Known Limitations

1. **WiFi BSSID Validation:** Not implemented - students can verify from anywhere
2. **Teacher Real-time Updates:** Teacher doesn't see who verified in real-time
3. **Parent Notifications:** Not implemented - no automated calls for absences

## Debugging Tips

### Student Not Receiving Notification
1. Check student's `isRunning` status (should be true)
2. Check Socket.IO connection: `socketRef.current.connected`
3. Check server logs for "Selected X students"
4. Verify studentId matches between teacher and student

### Verification Not Submitting
1. Check `randomRingData` state (should not be null)
2. Check network connection
3. Check server logs for "Student X verifying random ring"
4. Verify randomRingId is valid

### Timeout Not Working
1. Check if `setRandomRingData` is being called
2. Verify 5-minute timeout is set (300000 ms)
3. Check if student verified before timeout

## Success Criteria

✅ **Feature is working if:**
- Teacher can send random ring to students
- Students receive notifications immediately
- Face verification opens automatically
- Verification submits to server successfully
- Response time is tracked correctly
- Timeout works after 5 minutes
- History endpoint returns correct data

## Next Steps After Testing

1. Test with real classroom scenario (20+ students)
2. Measure average response time
3. Test network reliability (slow connections)
4. Implement WiFi BSSID validation
5. Add teacher real-time verification UI
6. Implement parent notification system
