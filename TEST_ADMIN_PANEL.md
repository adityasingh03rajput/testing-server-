# Admin Panel Testing Guide

## ✅ Complete Testing Checklist

### Pre-requisites
- [ ] Node.js installed
- [ ] MongoDB installed (optional)
- [ ] Server running on port 3000
- [ ] Admin panel running

---

## 🧪 Test Scenarios

### 1. Server Connection
**Test:** Server health check
```bash
# In browser or Postman
GET http://localhost:3000/api/health

Expected Response:
{
  "status": "ok",
  "timestamp": "2024-10-17T..."
}
```

**In Admin Panel:**
- [ ] Server status shows "Connected" (green dot)
- [ ] Dashboard loads without errors

---

### 2. Student Management

#### Add Single Student
- [ ] Click "Students" in sidebar
- [ ] Click "➕ Add Student"
- [ ] Fill all required fields:
  - Enrollment No: TEST001
  - Name: Test Student
  - Email: test@example.com
  - Password: test123
  - Course: CSE
  - Semester: 3
  - DOB: 2003-01-01
  - Phone: 1234567890
- [ ] Click "Add Student"
- [ ] Success notification appears
- [ ] Student appears in table

#### Edit Student
- [ ] Click "Edit" button on test student
- [ ] Modal opens with pre-filled data
- [ ] Change name to "Test Student Updated"
- [ ] Click "Update Student"
- [ ] Success notification appears
- [ ] Table shows updated name

#### Search Student
- [ ] Type "Test" in search box
- [ ] Table filters to show only matching students
- [ ] Clear search shows all students

#### Filter Students
- [ ] Select "Semester 3" from semester filter
- [ ] Table shows only semester 3 students
- [ ] Select "CSE" from course filter
- [ ] Table shows only CSE students

#### Export Students
- [ ] Click "📥 Export CSV"
- [ ] CSV file downloads
- [ ] Open in Excel/Notepad
- [ ] Verify data is correct

#### Delete Student
- [ ] Click "Delete" on test student
- [ ] Confirmation dialog appears
- [ ] Shows student name
- [ ] Click "Confirm"
- [ ] Success notification appears
- [ ] Student removed from table

#### Bulk Import Students
- [ ] Click "📤 Bulk Import"
- [ ] Create CSV file:
```csv
enrollmentNo,name,email,password,course,semester,dob,phone
BULK001,Bulk Student 1,bulk1@test.com,pass123,CSE,3,2003-01-01,1111111111
BULK002,Bulk Student 2,bulk2@test.com,pass123,ECE,3,2003-02-01,2222222222
BULK003,Bulk Student 3,bulk3@test.com,pass123,ME,3,2003-03-01,3333333333
```
- [ ] Upload CSV file
- [ ] Preview shows in textarea
- [ ] Click "Import Students"
- [ ] Success notification shows count
- [ ] All students appear in table

---

### 3. Teacher Management

#### Add Single Teacher
- [ ] Click "Teachers" in sidebar
- [ ] Click "➕ Add Teacher"
- [ ] Fill all required fields:
  - Employee ID: EMP001
  - Name: Test Teacher
  - Email: teacher@example.com
  - Password: teach123
  - Department: CSE
  - DOB: 1980-01-01
  - Phone: 9876543210
  - Can Edit Timetable: ✓ (checked)
- [ ] Click "Add Teacher"
- [ ] Success notification appears
- [ ] Teacher appears in table
- [ ] Timetable Access shows "Enabled"

#### Edit Teacher
- [ ] Click "Edit" button on test teacher
- [ ] Modal opens with pre-filled data
- [ ] Change name to "Test Teacher Updated"
- [ ] Uncheck "Can Edit Timetable"
- [ ] Click "Update Teacher"
- [ ] Success notification appears
- [ ] Table shows updated name
- [ ] Timetable Access shows "Disabled"

#### Toggle Timetable Permission
- [ ] Click "Disabled" badge
- [ ] Badge changes to "Enabled"
- [ ] Success notification appears
- [ ] Click "Enabled" badge
- [ ] Badge changes to "Disabled"

#### Search Teacher
- [ ] Type "Test" in search box
- [ ] Table filters to show only matching teachers

#### Filter Teachers
- [ ] Select "CSE" from department filter
- [ ] Table shows only CSE teachers

#### Export Teachers
- [ ] Click "📥 Export CSV"
- [ ] CSV file downloads
- [ ] Verify data includes canEditTimetable column

#### Delete Teacher
- [ ] Click "Delete" on test teacher
- [ ] Confirmation dialog appears
- [ ] Click "Confirm"
- [ ] Teacher removed from table

#### Bulk Import Teachers
- [ ] Click "📤 Bulk Import"
- [ ] Create CSV file:
```csv
employeeId,name,email,password,department,dob,phone,canEditTimetable
BULK_T1,Bulk Teacher 1,bulkt1@test.com,pass123,CSE,1980-01-01,1111111111,true
BULK_T2,Bulk Teacher 2,bulkt2@test.com,pass123,ECE,1975-02-01,2222222222,false
BULK_T3,Bulk Teacher 3,bulkt3@test.com,pass123,ME,1982-03-01,3333333333,true
```
- [ ] Upload and import
- [ ] All teachers appear with correct permissions

---

### 4. Classroom Management

#### Add Classroom
- [ ] Click "Classrooms" in sidebar
- [ ] Click "➕ Add Classroom"
- [ ] Fill fields:
  - Room Number: 101
  - Building: Main Block
  - Capacity: 60
  - WiFi BSSID: AA:BB:CC:DD:EE:FF
  - Active: ✓ (checked)
- [ ] Click "Add Classroom"
- [ ] Success notification appears
- [ ] Classroom appears in table

#### Edit Classroom
- [ ] Click "Edit" button
- [ ] Change capacity to 70
- [ ] Click "Update Classroom"
- [ ] Table shows updated capacity

#### Export Classrooms
- [ ] Click "📥 Export CSV"
- [ ] CSV file downloads

#### Delete Classroom
- [ ] Click "Delete"
- [ ] Confirm deletion
- [ ] Classroom removed

---

### 5. Timetable Management

#### Create New Timetable
- [ ] Click "Timetable" in sidebar
- [ ] Select "Semester: 3"
- [ ] Select "Course: CSE"
- [ ] Click "➕ Create Timetable"
- [ ] Grid appears with 8 periods × 6 days
- [ ] All cells show "-" (empty)

#### Edit Timetable Cell
- [ ] Click any cell (e.g., Monday P1)
- [ ] Modal opens
- [ ] Enter Subject: "Mathematics"
- [ ] Enter Room: "101"
- [ ] Click "Save"
- [ ] Cell shows "Mathematics" and "101"

#### Mark Break
- [ ] Click another cell (e.g., Monday P3)
- [ ] Check "Is Break"
- [ ] Click "Save"
- [ ] Cell shows "☕ Break"

#### Save Timetable
- [ ] Click "Save Timetable" button
- [ ] Success notification appears
- [ ] OR press Ctrl+S
- [ ] Success notification appears

#### Load Existing Timetable
- [ ] Select same semester and course
- [ ] Click "Load Timetable"
- [ ] Previously saved data appears

#### Print Timetable
- [ ] Click "🖨️ Print"
- [ ] New window opens
- [ ] Timetable formatted for printing
- [ ] Click "Print" or Ctrl+P
- [ ] Print preview appears

---

### 6. Dashboard

#### Statistics
- [ ] Click "Dashboard" in sidebar
- [ ] Total Students shows correct count
- [ ] Total Teachers shows correct count
- [ ] Total Classrooms shows correct count
- [ ] Recent Activity shows latest actions

---

### 7. Settings

#### Server Configuration
- [ ] Click "Settings" in sidebar
- [ ] Server URL shows current value
- [ ] Change to different URL (for testing)
- [ ] Click "Save"
- [ ] Success notification appears
- [ ] Change back to http://localhost:3000
- [ ] Click "Save"

---

### 8. UI/UX Features

#### Notifications
- [ ] Perform any action
- [ ] Toast notification appears
- [ ] Auto-dismisses after 5 seconds
- [ ] OR click X to close manually
- [ ] Correct color for type (green/red/orange/blue)

#### Confirmation Dialogs
- [ ] Try to delete any item
- [ ] Modal appears with confirmation
- [ ] Shows item name
- [ ] "Cancel" closes without action
- [ ] "Confirm" performs deletion

#### Keyboard Shortcuts
- [ ] Press Ctrl+F
- [ ] Search bar gets focus
- [ ] Press Escape
- [ ] Modal closes (if open)
- [ ] In timetable, press Ctrl+S
- [ ] Timetable saves

#### Global Search
- [ ] Type in top search bar
- [ ] Current section filters automatically

#### Loading States
- [ ] Watch for loading indicators during API calls
- [ ] Smooth transitions

---

### 9. Error Handling

#### Server Disconnected
- [ ] Stop the server
- [ ] Status indicator turns red
- [ ] Shows "Disconnected"
- [ ] Try any action
- [ ] Error notification appears
- [ ] Restart server
- [ ] Status turns green automatically

#### Invalid Data
- [ ] Try to add student without required fields
- [ ] Form validation prevents submission
- [ ] Error messages appear

#### Duplicate Data
- [ ] Try to add student with existing enrollment number
- [ ] Error notification appears
- [ ] Data not added

---

### 10. Data Persistence

#### MongoDB Connected
- [ ] Add test data
- [ ] Close admin panel
- [ ] Restart admin panel
- [ ] Data still present

#### MongoDB Disconnected
- [ ] Stop MongoDB
- [ ] Add test data
- [ ] Data stored in memory
- [ ] Restart admin panel
- [ ] Data lost (expected behavior)

---

### 11. Cross-Platform

#### Windows
- [ ] Application runs
- [ ] All features work
- [ ] CSV export works
- [ ] Print works

#### Linux (if available)
- [ ] Application runs
- [ ] All features work

#### macOS (if available)
- [ ] Application runs
- [ ] Cmd+S works instead of Ctrl+S
- [ ] Cmd+F works instead of Ctrl+F

---

### 12. Performance

#### Large Dataset
- [ ] Import 100+ students
- [ ] Table renders smoothly
- [ ] Search is fast
- [ ] Filter is responsive
- [ ] Export completes quickly

#### Multiple Operations
- [ ] Perform rapid actions
- [ ] No crashes
- [ ] Notifications queue properly
- [ ] UI remains responsive

---

## 🐛 Bug Reporting Template

If you find any issues:

```
**Bug Title:** [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- OS: [Windows/Linux/macOS]
- Node.js Version: [version]
- MongoDB: [Connected/Disconnected]

**Screenshots:**
[If applicable]

**Console Errors:**
[Press Ctrl+Shift+I to see console]
```

---

## ✅ Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Student CRUD | ⬜ | |
| Teacher CRUD | ⬜ | |
| Classroom CRUD | ⬜ | |
| Timetable Management | ⬜ | |
| Bulk Import | ⬜ | |
| CSV Export | ⬜ | |
| Search & Filter | ⬜ | |
| Notifications | ⬜ | |
| Keyboard Shortcuts | ⬜ | |
| Print | ⬜ | |
| Server Sync | ⬜ | |
| Error Handling | ⬜ | |

**Legend:**
- ⬜ Not Tested
- ✅ Passed
- ❌ Failed
- ⚠️ Partial

---

## 🎯 Quick Test (5 Minutes)

Minimal test to verify everything works:

1. ✅ Start server and admin panel
2. ✅ Add one student
3. ✅ Edit the student
4. ✅ Add one teacher with timetable permission
5. ✅ Create a timetable
6. ✅ Edit one timetable cell
7. ✅ Save timetable
8. ✅ Export students to CSV
9. ✅ Delete test data
10. ✅ Check all notifications appeared

If all 10 steps work, the system is functional! ✅

---

**Testing Date:** __________  
**Tester Name:** __________  
**Version:** 1.0.0  
**Result:** ⬜ Pass / ⬜ Fail
