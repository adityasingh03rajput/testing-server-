# Quick Reference: Field Names

## ✅ USE THESE (Standard Fields)

### Student Identification
```javascript
enrollmentNo: "0246CD241001"  // ✅ CORRECT
```

### Student Branch/Course
```javascript
course: "B.Tech Data Science"  // ✅ CORRECT
```

### Timetable/Subject Branch
```javascript
branch: "B.Tech Data Science"  // ✅ CORRECT (for timetables/subjects only)
```

## ❌ AVOID THESE (Deprecated but still work)

```javascript
enrollmentNumber: "0246CD241001"  // ⚠️ DEPRECATED - Use enrollmentNo instead
branch: "B.Tech Data Science"     // ⚠️ DEPRECATED for students - Use course instead
```

## 📝 Code Examples

### ✅ CORRECT - Finding a Student
```javascript
// Mobile App (App.js)
const student = await fetch(`${SOCKET_URL}/api/student-management?enrollmentNo=${userData.enrollmentNo}`);

// Server (index.js)
const student = await StudentManagement.findOne({ enrollmentNo: '0246CD241001' });
```

### ✅ CORRECT - Finding Attendance Records
```javascript
// Server (index.js)
const records = await AttendanceRecord.find({ 
  enrollmentNo: '0246CD241001',
  date: today 
});
```

### ✅ CORRECT - Creating Attendance Record
```javascript
// Server (index.js)
const record = new AttendanceRecord({
  studentId: student._id,
  studentName: student.name,
  enrollmentNo: student.enrollmentNo,  // ✅ CORRECT
  date: new Date(),
  status: 'present',
  semester: student.semester,
  course: student.course  // ✅ CORRECT (not branch)
});
```

### ✅ CORRECT - Displaying Student Info
```javascript
// Mobile App (App.js, ViewRecords.js)
<Text>{student.enrollmentNo}</Text>  // ✅ CORRECT
<Text>{student.course}</Text>        // ✅ CORRECT
```

### ✅ CORRECT - Timetable/Subject Management
```javascript
// Admin Panel (renderer.js)
const timetable = {
  semester: "3",
  branch: "B.Tech Data Science",  // ✅ CORRECT (for timetables)
  periods: [...]
};

const subject = {
  subjectCode: "DS301",
  subjectName: "Data Structures",
  semester: "3",
  branch: "B.Tech Data Science"  // ✅ CORRECT (for subjects)
};
```

## 🔍 Field Usage by Context

| Context | Student ID Field | Branch/Course Field |
|---------|-----------------|---------------------|
| Student Records | `enrollmentNo` | `course` |
| Attendance Records | `enrollmentNo` | `course` |
| Attendance Sessions | `enrollmentNo` | `course` |
| Timetables | N/A | `branch` |
| Subjects | N/A | `branch` |

## 🧪 Testing Your Code

Run this test to verify field names:
```bash
node test-field-standardization.js
```

Expected output: ✅ ALL TESTS PASSED

## 📚 Related Files

- `FIELD_NAME_STANDARDIZATION.md` - Complete documentation
- `fix-field-names.js` - Database standardization script
- `test-field-standardization.js` - Verification tests

## 🚨 Common Mistakes

### ❌ WRONG
```javascript
// Don't use enrollmentNumber
const student = await StudentManagement.findOne({ enrollmentNumber: '...' });

// Don't use branch for student records
const student = { branch: 'B.Tech Data Science' };
```

### ✅ CORRECT
```javascript
// Use enrollmentNo
const student = await StudentManagement.findOne({ enrollmentNo: '...' });

// Use course for student records
const student = { course: 'B.Tech Data Science' };
```

## 💡 Remember

- **Students**: Use `enrollmentNo` and `course`
- **Timetables/Subjects**: Use `branch`
- **Backward Compatibility**: Old field names still work but are deprecated
- **New Code**: Always use standard field names
