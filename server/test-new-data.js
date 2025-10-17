// Quick test script to verify the new data structure
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

// Define schemas
const studentManagementSchema = new mongoose.Schema({
    enrollmentNo: String,
    name: String,
    email: String,
    password: String,
    course: String,
    semester: String,
    dob: Date,
    phone: String,
    createdAt: Date
});

const teacherSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    email: String,
    password: String,
    department: String,
    subject: String,
    semester: String,
    canEditTimetable: Boolean,
    createdAt: Date
});

const timetableSchema = new mongoose.Schema({
    semester: String,
    branch: String,
    periods: Array,
    timetable: Object,
    lastUpdated: Date
});

const attendanceRecordSchema = new mongoose.Schema({
    studentId: String,
    studentName: String,
    enrollmentNumber: String,
    date: Date,
    status: String,
    timerValue: Number,
    checkInTime: Date,
    checkOutTime: Date,
    lecturesAttended: Number,
    totalLectures: Number,
    semester: String,
    branch: String,
    createdAt: Date
});

async function testData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test Students
        const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);
        const students = await StudentManagement.find({});
        console.log(`📊 Total Students: ${students.length}`);
        
        const studentsByCourse = students.reduce((acc, s) => {
            acc[s.course] = (acc[s.course] || 0) + 1;
            return acc;
        }, {});
        console.log('Students by Course:', studentsByCourse);
        
        const studentsBySemester = students.reduce((acc, s) => {
            acc[`Sem ${s.semester}`] = (acc[`Sem ${s.semester}`] || 0) + 1;
            return acc;
        }, {});
        console.log('Students by Semester:', studentsBySemester);
        console.log('');

        // Test Teachers
        const Teacher = mongoose.model('Teacher', teacherSchema);
        const teachers = await Teacher.find({});
        console.log(`👨‍🏫 Total Teachers: ${teachers.length}`);
        const teachersByDept = teachers.reduce((acc, t) => {
            acc[t.department] = (acc[t.department] || 0) + 1;
            return acc;
        }, {});
        console.log('Teachers by Department:', teachersByDept);
        console.log('');

        // Test Timetables
        const Timetable = mongoose.model('Timetable', timetableSchema);
        const timetables = await Timetable.find({});
        console.log(`📅 Total Timetables: ${timetables.length}`);
        console.log('Timetables:');
        timetables.forEach(tt => {
            console.log(`  - ${tt.branch} Semester ${tt.semester} (${tt.periods.length} periods)`);
        });
        console.log('');

        // Test Attendance Records
        const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
        const records = await AttendanceRecord.find({});
        console.log(`📊 Total Attendance Records: ${records.length}`);
        
        const presentCount = records.filter(r => r.status === 'present').length;
        const absentCount = records.filter(r => r.status === 'absent').length;
        const attendanceRate = ((presentCount / records.length) * 100).toFixed(2);
        
        console.log(`  Present: ${presentCount}`);
        console.log(`  Absent: ${absentCount}`);
        console.log(`  Overall Attendance Rate: ${attendanceRate}%`);
        console.log('');

        // Test date range
        const dates = records.map(r => r.date).sort((a, b) => a - b);
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        console.log(`📅 Date Range:`);
        console.log(`  From: ${startDate.toLocaleDateString()}`);
        console.log(`  To: ${endDate.toLocaleDateString()}`);
        console.log('');

        // Sample student attendance
        const sampleStudent = students[0];
        const studentRecords = records.filter(r => r.studentId === sampleStudent.enrollmentNo);
        const studentPresent = studentRecords.filter(r => r.status === 'present').length;
        const studentRate = ((studentPresent / studentRecords.length) * 100).toFixed(2);
        
        console.log(`👤 Sample Student: ${sampleStudent.name} (${sampleStudent.enrollmentNo})`);
        console.log(`  Course: ${sampleStudent.course} Semester ${sampleStudent.semester}`);
        console.log(`  Total Days: ${studentRecords.length}`);
        console.log(`  Present: ${studentPresent}`);
        console.log(`  Attendance Rate: ${studentRate}%`);
        
        // Check lectures attended
        const presentDays = studentRecords.filter(r => r.status === 'present');
        if (presentDays.length > 0) {
            const avgLectures = (presentDays.reduce((sum, r) => sum + (r.lecturesAttended || 0), 0) / presentDays.length).toFixed(2);
            console.log(`  Avg Lectures Attended: ${avgLectures}/8`);
        }
        console.log('');

        console.log('✅ All data verified successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testData();
