# COPYRIGHT REGISTRATION FORM - FILLED

## For: LetsBunk Attendance System Software

---

### SECTION 1: APPLICANT DETAILS

| Sr. No | Particulars | Details |
|--------|-------------|---------|
| 1. | Name of the Applicant | ADITYA SINGH RAJPUT<br>AKSH USRATHE<br>PRANAV NAMDEO |
| 2. | Address of the Applicant | [Your complete address]<br>[City, State, PIN]<br>India |
| 3. | Nationality | INDIAN |
| 4. | Nature of the interest in the copyright of the work (Author/Owner/Publisher/Composer/Producer/Artist) | OWNER / AUTHOR |
| 5. | Class and description of the work (Literary / Artistic / Cinematograph Film / Sound Recording / Music / Computer Software) | **COMPUTER SOFTWARE** |
| 6. | Title of the work | **LetsBunk - Cascading Ultrasonic Mesh Attendance Verification System** |
| 7. | Language of the work (coding language, DB used etc.) | **Programming Languages:**<br>- JavaScript (React Native, Node.js)<br>- HTML/CSS<br>- SQL (MongoDB)<br><br>**Technologies:**<br>- React Native (Mobile App)<br>- Node.js + Express (Backend)<br>- MongoDB (Database)<br>- WebSocket (Real-time communication)<br>- FFT algorithms (Ultrasonic processing) |
| 8. | Name, address and nationality of the author(coder, programmer) and, if the author is deceased, date of his decease | **Authors:**<br>1. Aditya Singh Rajput - Indian - [Address]<br>2. Aksh Usrathe - Indian - [Address]<br>3. Pranav Namdeo - Indian - [Address]<br><br>All authors are alive. |
| 9. | Whether work is Published or Unpublished (Y/N) | **UNPUBLISHED**<br>(Internal testing only, not publicly released) |
| 10. | Year and country of first publication and name, address and nationality of the publishers | Not applicable (unpublished) |
| 11. | Years and countries of subsequent publications, if any, and names, addresses and nationalities of the publisher | Not applicable |
| 12. | Names, address and nationalities of the owners of the various rights comprising the copyright in the work and the extent of rights held by each, together with particulars of assignment and licences, if any | **Sole Owners:**<br>1. Aditya Singh Rajput - Indian - [Address] - 33.33%<br>2. Aksh Usrathe - Indian - [Address] - 33.33%<br>3. Pranav Namdeo - Indian - [Address] - 33.34%<br><br>**Rights held:** All rights (reproduction, distribution, adaptation, public performance)<br><br>**Assignments/Licenses:** None |

---

### SECTION 2: COPYRIGHT FORM SPECIFIC QUESTIONS

| Sr. No | Question | Answer |
|--------|----------|--------|
| 13. | Names, addresses and nationalities of other persons, if any, authorized to assign or license the rights comprising the copyright | **NA** - No other persons authorized |
| 14. | If the work is an "artistic work", the location of the original work, including name, address and nationality of the person in possession of the work. (In the case of an architectural work, the year of completion of the work should also be shown) | **NA** - This is computer software, not artistic work |
| 15. | If the work is an "artistic work" which is used or is capable of being used in relation to any goods, the application shall include a certificate from the Registrar of Trade Marks in terms of the proviso to sub-section (1) of section 45 of the Copyright Act, 1957 | **NA** - Not applicable |
| 16. | If the work is an "artistic work" under it is registered under the Designs Act 2000. If yes give details. | **NA** - Not applicable |
| 17. | If the work is an "artistic work" capable of being registered as a design under the Designs Act 2000, whether it has been applied to an article though an industrial process and, if yes, the number of times it is reproduced. | **NA** - Not applicable |
| 18. | Remarks, if any | **Software Description:**<br><br>LetsBunk is a novel attendance verification system using:<br>- Cascading ultrasonic mesh networks<br>- Biometric face recognition<br>- WiFi BSSID authentication<br>- Real-time server synchronization<br><br>**Components:**<br>1. Mobile Application (React Native)<br>2. Backend Server (Node.js)<br>3. Admin Panel (Electron)<br>4. Database (MongoDB)<br><br>**Innovation:**<br>First system to combine ultrasonic signal propagation with biometric and network verification for unforgeable attendance proof.<br><br>**Date of Creation:** October 2024<br>**First Use:** October 2024 (Internal testing with 500 users)<br>**Version:** v1.0.23<br>**Build Date:** 09 February 2025, 11:42 PM IST<br><br>**Related Patent Application:** Filed separately for the method and system<br><br>**Infringement Protection:** Any attempt to replicate the system workflow, verification logic, or presence validation method by altering the sequence, medium, signal, or threshold still constitutes infringement of this copyrighted work. |

---

### DECLARATION

Place: _______________  
Date: _______________

**Signature of Applicants:**

1. _______________________ (Aditya Singh Rajput)
2. _______________________ (Aksh Usrathe)
3. _______________________ (Pranav Namdeo)

---

## COMPLETE PROJECT STRUCTURE

```
LetsBunk-Attendance-System/
├── Mobile App (React Native)
│   ├── App.js (Main entry point)
│   ├── screens/
│   │   ├── FaceVerificationScreen.js
│   │   ├── TimetableScreen.js
│   │   ├── CalendarScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── NotificationsScreen.js
│   │   └── TeacherDashboard.js
│   ├── components/
│   │   ├── CircularTimer.js
│   │   ├── LanyardCard.js
│   │   ├── BottomNavigation.js
│   │   └── TimeSyncIndicator.js
│   ├── services/
│   │   ├── FaceVerification.js
│   │   ├── NotificationService.js
│   │   ├── ServerTime.js
│   │   └── useServerTime.js
│   ├── assets/ (Images, fonts, icons)
│   └── android/ (Native Android build)
│
├── Backend Server (Node.js)
│   ├── server/
│   │   ├── index.js (Main server file)
│   │   ├── models/ (MongoDB schemas)
│   │   ├── face-api-service.js
│   │   ├── seed-data.js
│   │   └── uploads/ (Photo storage)
│   └── package.json
│
├── Admin Panel (Electron)
│   ├── admin-panel/
│   │   ├── index.html
│   │   ├── renderer.js
│   │   ├── main.js
│   │   ├── styles.css
│   │   └── package.json
│   └── Admin-Panel-Installer/
│
├── Configuration
│   ├── .env (Environment variables)
│   ├── app.json (Expo config)
│   ├── render.yaml (Deployment config)
│   └── package.json (Dependencies)
│
└── Documentation
    ├── README.md
    ├── PATENT_APPLICATION.md
    ├── COPYRIGHT_FORM_FILLED.md
    └── DEPLOYMENT_GUIDE.md
```

---

## BACKEND API ENDPOINTS (Without Keys)

### Authentication
```
POST   /api/login
POST   /api/register
POST   /api/logout
```

### Students
```
GET    /api/students
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id
POST   /api/students/bulk
GET    /api/student-management
```

### Teachers
```
GET    /api/teachers
POST   /api/teachers
PUT    /api/teachers/:id
DELETE /api/teachers/:id
POST   /api/teachers/bulk
PUT    /api/teachers/:id/timetable-access
GET    /api/teacher-schedule/:teacherId/:day
GET    /api/teacher/current-class-students/:teacherId
```

### Timetable
```
GET    /api/timetable/:semester/:branch
POST   /api/timetable
PUT    /api/timetable/:semester/:branch
POST   /api/periods/update-all
```

### Attendance
```
POST   /api/attendance/record
GET    /api/attendance/records
GET    /api/attendance/stats
POST   /api/attendance/verify
```

### Face Verification
```
POST   /api/verify-face
POST   /api/upload-photo
GET    /api/photo/:filename
```

### Classrooms
```
GET    /api/classrooms
POST   /api/classrooms
PUT    /api/classrooms/:id
DELETE /api/classrooms/:id
```

### System
```
GET    /api/health
GET    /api/config
GET    /api/server-time
```

### WebSocket Events
```
EMIT   timer_update
ON     student_update
ON     student_registered
ON     timetable_updated
ON     periods_updated
```

---

## DATABASE SCHEMA (Table Structure)

### Students Collection
```
{
  _id: ObjectId,
  enrollmentNo: String (unique),
  name: String,
  email: String,
  password: String (hashed),
  course: String,
  semester: String,
  dob: Date,
  phone: String,
  photoUrl: String,
  timerValue: Number,
  isRunning: Boolean,
  status: String,
  lastUpdated: Date,
  createdAt: Date
}
```

### Teachers Collection
```
{
  _id: ObjectId,
  employeeId: String (unique),
  name: String,
  email: String,
  password: String (hashed),
  department: String,
  subject: String,
  dob: Date,
  phone: String,
  photoUrl: String,
  canEditTimetable: Boolean,
  createdAt: Date
}
```

### Timetables Collection
```
{
  _id: ObjectId,
  semester: String,
  branch: String,
  periods: [{
    number: Number,
    startTime: String,
    endTime: String
  }],
  timetable: {
    monday: [{ period, subject, room, teacher, isBreak }],
    tuesday: [...],
    wednesday: [...],
    thursday: [...],
    friday: [...],
    saturday: [...]
  },
  lastUpdated: Date
}
```

### AttendanceRecords Collection
```
{
  _id: ObjectId,
  studentId: String,
  studentName: String,
  enrollmentNumber: String,
  date: Date,
  status: String,
  lectures: [{
    subject: String,
    room: String,
    startTime: String,
    endTime: String,
    attended: Number,
    total: Number,
    percentage: Number,
    present: Boolean
  }],
  totalAttended: Number,
  totalClassTime: Number,
  dayPercentage: Number,
  semester: String,
  branch: String,
  createdAt: Date
}
```

### Classrooms Collection
```
{
  _id: ObjectId,
  roomNumber: String (unique),
  building: String,
  capacity: Number,
  wifiBSSID: String,
  isActive: Boolean,
  createdAt: Date
}
```

---

## UI/UX SCREENSHOTS (Included in Submission)

1. **Login Screen** - Student/Teacher role selection
2. **Face Verification Screen** - Camera capture with liveness detection
3. **Home Screen** - Circular timer with current class info
4. **Timetable Screen** - Weekly schedule view
5. **Calendar Screen** - Monthly attendance history
6. **Profile Screen** - Digital lanyard card
7. **Teacher Dashboard** - Live student tracking
8. **Admin Panel** - Student/Teacher/Timetable management
9. **Notifications Screen** - Real-time alerts
10. **Random Ring Interface** - Teacher-initiated verification

---

## DOCUMENTS TO ATTACH:

1. ☐ Copy of the work (source code on CD/DVD or cloud link)
2. ☐ Power of Attorney (if filing through agent)
3. ☐ NOC from co-authors (if applicable)
4. ☐ Proof of identity (Aadhaar/Passport)
5. ☐ Proof of address
6. ☐ Copyright fee payment receipt

---

## COPYRIGHT FEE (As per Copyright Office):

**For Computer Software:**
- Online filing: ₹500 per work
- Physical filing: ₹500 per work

**Total for 1 software work:** ₹500

---

## FILING INSTRUCTIONS:

**Online Filing (Recommended):**
1. Visit: https://copyright.gov.in
2. Create account
3. Fill Form XIV (Computer Software)
4. Upload documents
5. Pay fee online
6. Submit application

**Physical Filing:**
1. Print this form
2. Attach all documents
3. Submit at Copyright Office, New Delhi
4. Pay fee via DD/Cash

---

## COPYRIGHT OFFICE CONTACT:

**The Registrar of Copyrights**  
Copyright Office  
Boudhik Sampada Bhawan  
Plot No. 32, Sector 14, Dwarka  
New Delhi - 110078

Phone: +91-11-28032496  
Email: copyright-india@nic.in  
Website: https://copyright.gov.in

---

## IMPORTANT NOTES:

1. **Copyright protects the CODE**, not the idea/method
2. **Patent protects the METHOD/SYSTEM** (file separately)
3. Copyright is automatic upon creation, registration provides legal proof
4. Copyright lasts for lifetime of author + 60 years
5. Multiple authors = joint copyright ownership

---

**RECOMMENDATION:**

File BOTH:
1. **Copyright** for the software code (this form)
2. **Patent** for the invention/method (separate Form 1)

This gives you maximum protection:
- Copyright prevents code copying
- Patent prevents method copying

---

