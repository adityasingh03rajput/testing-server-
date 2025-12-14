# Azure Server Endpoints

**Base URL**: `https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net`

## System & Health
- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `GET /api/time` - Server time

## Configuration
- `GET /api/config` - SDUI Configuration
- `GET /api/config/branches` - Available branches
- `GET /api/config/semesters` - Available semesters
- `GET /api/config/academic-year` - Current academic year
- `GET /api/config/app` - App configuration

## Authentication
- `POST /api/login` - Login (students/teachers)

## Student Management
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `POST /api/students/bulk` - Bulk import students
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/student-management` - Get student by enrollment
- `GET /api/view-records/students` - Students by semester/branch
- `POST /api/student/register` - Register student (legacy)
- `GET /api/debug/timer-calc/:enrollmentNo` - Debug timer

## Teacher Management
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create teacher
- `POST /api/teachers/bulk` - Bulk import teachers
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher
- `PUT /api/teachers/:id/timetable-access` - Update permissions
- `GET /api/teacher/current-lecture/:teacherId` - Current lecture
- `GET /api/teacher/allowed-branches/:teacherId` - Allowed branches
- `GET /api/teacher/current-class-students/:teacherId` - Current class students
- `GET /api/teacher-schedule/:teacherId/:day` - Teacher schedule

## Timetable Management
- `GET /api/timetables` - Get all timetables
- `GET /api/timetable/:semester/:branch` - Get specific timetable
- `POST /api/timetable` - Create/update timetable
- `PUT /api/timetable/:semester/:branch` - Update timetable
- `POST /api/periods/update-all` - Update all periods

## Subject Management
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:subjectCode` - Get subject by code
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/:subjectCode` - Update subject
- `DELETE /api/subjects/:subjectCode` - Delete subject
- `GET /api/subjects/grouped/by-semester-branch` - Grouped subjects

## Attendance System (New)
- `POST /api/attendance/start-session` - Start attendance session
- `POST /api/attendance/update-timer` - Update timer
- `POST /api/attendance/lecture-start` - Start lecture
- `POST /api/attendance/lecture-end` - End lecture
- `POST /api/attendance/add-verification` - Add verification

## Attendance System (Legacy)
- `POST /api/attendance/record` - Save attendance record
- `GET /api/attendance/records` - Get attendance records
- `POST /api/attendance/backup` - Backup attendance
- `POST /api/attendance/sync-offline` - Sync offline attendance
- `GET /api/attendance/stats` - Attendance statistics
- `GET /api/attendance/date/:date` - Attendance by date

## Face Verification
- `POST /api/verify-face` - Verify face
- `GET /api/face-descriptor/:userId` - Get face descriptor
- `POST /api/verify-face-proof` - Verify face proof

## Photo Management
- `POST /api/upload-photo` - Upload photo
- `GET /api/photo/:filename` - Get photo

---

**Total**: 55 endpoints across 11 categories
**Server Status**: ✅ Online and operational