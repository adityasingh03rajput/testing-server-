const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ Connected to MongoDB');
    seedCompleteAttendanceHistory();
}).catch(err => {
    console.log('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Schema
const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNumber: String,
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave'], required: true },
    
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
    
    totalAttended: { type: Number, default: 0 },
    totalClassTime: { type: Number, default: 0 },
    dayPercentage: { type: Number, default: 0 },
    
    semester: String,
    branch: String,
    createdAt: { type: Date, default: Date.now }
});

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

// Students data
const students = [
    { enrollmentNo: '0246CS241001', name: 'Aditya Singh', course: 'CSE', semester: '1' },
    { enrollmentNo: '0246CS241002', name: 'Priya Sharma', course: 'CSE', semester: '1' },
    { enrollmentNo: '0246CS241003', name: 'Rahul Kumar', course: 'CSE', semester: '1' },
    { enrollmentNo: '0246CS241004', name: 'Ankit Jain', course: 'CSE', semester: '1' },
    { enrollmentNo: '0246CS231001', name: 'Sneha Patel', course: 'CSE', semester: '3' },
    { enrollmentNo: '0246CS231002', name: 'Vikram Reddy', course: 'CSE', semester: '3' },
    { enrollmentNo: '0246CS231003', name: 'Amit Verma', course: 'CSE', semester: '3' },
    { enrollmentNo: '0246CS231004', name: 'Ritu Gupta', course: 'CSE', semester: '3' },
    { enrollmentNo: '0246CS221001', name: 'Ravi Shankar', course: 'CSE', semester: '5' },
    { enrollmentNo: '0246CS221002', name: 'Kavya Nair', course: 'CSE', semester: '5' },
    { enrollmentNo: '0246CS221003', name: 'Manish Tiwari', course: 'CSE', semester: '5' },
    { enrollmentNo: '0246EC241001', name: 'Ananya Gupta', course: 'ECE', semester: '1' },
    { enrollmentNo: '0246EC241002', name: 'Karan Mehta', course: 'ECE', semester: '1' },
    { enrollmentNo: '0246EC241003', name: 'Simran Kaur', course: 'ECE', semester: '1' },
    { enrollmentNo: '0246EC231001', name: 'Divya Iyer', course: 'ECE', semester: '3' },
    { enrollmentNo: '0246EC231002', name: 'Sanjay Kumar', course: 'ECE', semester: '3' },
    { enrollmentNo: '0246EC231003', name: 'Pooja Deshmukh', course: 'ECE', semester: '3' },
    { enrollmentNo: '0246EC221001', name: 'Meera Reddy', course: 'ECE', semester: '5' },
    { enrollmentNo: '0246EC221002', name: 'Arjun Nambiar', course: 'ECE', semester: '5' },
    { enrollmentNo: '0246ME241001', name: 'Arjun Nair', course: 'ME', semester: '1' },
    { enrollmentNo: '0246ME241002', name: 'Pooja Desai', course: 'ME', semester: '1' },
    { enrollmentNo: '0246ME241003', name: 'Nikhil Rao', course: 'ME', semester: '1' },
    { enrollmentNo: '0246ME231001', name: 'Suresh Patel', course: 'ME', semester: '3' },
    { enrollmentNo: '0246ME231002', name: 'Lakshmi Iyer', course: 'ME', semester: '3' },
    { enrollmentNo: '0246ME231003', name: 'Rajesh Yadav', course: 'ME', semester: '3' },
    { enrollmentNo: '0246ME221001', name: 'Deepika Singh', course: 'ME', semester: '5' },
    { enrollmentNo: '0246CE241001', name: 'Rohit Verma', course: 'Civil', semester: '1' },
    { enrollmentNo: '0246CE241002', name: 'Neha Joshi', course: 'Civil', semester: '1' },
    { enrollmentNo: '0246CE241003', name: 'Varun Malhotra', course: 'Civil', semester: '1' },
    { enrollmentNo: '0246CE231001', name: 'Deepak Singh', course: 'Civil', semester: '3' },
    { enrollmentNo: '0246CE231002', name: 'Anjali Sharma', course: 'Civil', semester: '3' },
    { enrollmentNo: '0246CE231003', name: 'Karthik Menon', course: 'Civil', semester: '3' },
    { enrollmentNo: '0246CE221001', name: 'Priyanka Das', course: 'Civil', semester: '5' },
];

// Timetable structure (excluding breaks)
const timetables = {
    '1-CSE': [
        { subject: 'Mathematics-I', room: 'MA-101', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Physics', room: 'PH-102', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Chemistry', room: 'CH-103', startTime: '11:40', endTime: '12:10', duration: 30 },
        // 12:10-13:10 is LUNCH BREAK - NOT COUNTED
        { subject: 'Programming in C', room: 'CS-104', startTime: '13:10', endTime: '14:10', duration: 60 },
        // 14:10-14:20 is SHORT BREAK - NOT COUNTED
        { subject: 'English', room: 'EN-105', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-1', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '3-CSE': [
        { subject: 'Data Structures', room: 'DS-101', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'DBMS', room: 'DB-102', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Operating Systems', room: 'OS-103', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Computer Networks', room: 'CN-104', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'Software Engineering', room: 'SE-105', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-2', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '5-CSE': [
        { subject: 'Machine Learning', room: 'ML-101', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Compiler Design', room: 'CD-102', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Web Technologies', room: 'WT-103', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Computer Graphics', room: 'CG-104', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'Artificial Intelligence', room: 'AI-105', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Project Work', room: 'Lab-3', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '1-ECE': [
        { subject: 'Mathematics-I', room: 'MA-201', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Physics', room: 'PH-202', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Chemistry', room: 'CH-203', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Basic Electronics', room: 'EC-204', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'English', room: 'EN-205', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-4', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '3-ECE': [
        { subject: 'Digital Electronics', room: 'DE-201', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Signals & Systems', room: 'SS-202', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Analog Circuits', room: 'AC-203', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Microprocessors', room: 'MP-204', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'Communication Systems', room: 'CS-205', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-5', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '5-ECE': [
        { subject: 'VLSI Design', room: 'VL-201', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Digital Signal Processing', room: 'DS-202', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Microwave Engineering', room: 'MW-203', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Control Systems', room: 'CT-204', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'Embedded Systems', room: 'ES-205', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-6', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '1-ME': [
        { subject: 'Mathematics-I', room: 'MA-301', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Physics', room: 'PH-302', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Chemistry', room: 'CH-303', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Engineering Mechanics', room: 'EM-304', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'English', room: 'EN-305', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Workshop', room: 'WS-1', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '3-ME': [
        { subject: 'Thermodynamics', room: 'TD-301', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Fluid Mechanics', room: 'FM-302', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Manufacturing Processes', room: 'MP-303', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Strength of Materials', room: 'SM-304', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'Machine Drawing', room: 'MD-305', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-7', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '5-ME': [
        { subject: 'Heat Transfer', room: 'HT-301', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Machine Design', room: 'MD-302', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Dynamics of Machinery', room: 'DM-303', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Manufacturing Technology', room: 'MT-304', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'Industrial Engineering', room: 'IE-305', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-8', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '1-Civil': [
        { subject: 'Mathematics-I', room: 'MA-401', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Physics', room: 'PH-402', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Chemistry', room: 'CH-403', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Engineering Mechanics', room: 'EM-404', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'English', room: 'EN-405', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-9', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '3-Civil': [
        { subject: 'Structural Analysis', room: 'SA-401', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Surveying', room: 'SV-402', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Concrete Technology', room: 'CT-403', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Fluid Mechanics', room: 'FM-404', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'Geotechnical Engineering', room: 'GE-405', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-10', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
    '5-Civil': [
        { subject: 'Design of Structures', room: 'DS-401', startTime: '09:40', endTime: '10:40', duration: 60 },
        { subject: 'Transportation Engineering', room: 'TE-402', startTime: '10:40', endTime: '11:40', duration: 60 },
        { subject: 'Environmental Engineering', room: 'EE-403', startTime: '11:40', endTime: '12:10', duration: 30 },
        { subject: 'Water Resources', room: 'WR-404', startTime: '13:10', endTime: '14:10', duration: 60 },
        { subject: 'Construction Management', room: 'CM-405', startTime: '14:20', endTime: '15:30', duration: 70 },
        { subject: 'Lab', room: 'Lab-11', startTime: '15:30', endTime: '16:10', duration: 40 },
    ],
};

// Holidays (no classes)
const holidays = [
    new Date('2025-05-01'), // May Day
    new Date('2025-08-15'), // Independence Day
    new Date('2025-10-02'), // Gandhi Jayanti
];

function isHoliday(date) {
    return holidays.some(h => 
        h.getDate() === date.getDate() && 
        h.getMonth() === date.getMonth() && 
        h.getFullYear() === date.getFullYear()
    );
}

function generateRealisticAttendance(student, date) {
    const dayOfWeek = date.getDay();
    
    // Sunday = Leave
    if (dayOfWeek === 0) {
        return {
            studentId: student.enrollmentNo,
            studentName: student.name,
            enrollmentNumber: student.enrollmentNo,
            date: new Date(date),
            status: 'leave',
            lectures: [],
            totalAttended: 0,
            totalClassTime: 0,
            dayPercentage: 0,
            semester: student.semester,
            branch: student.course
        };
    }
    
    // Holiday = Leave
    if (isHoliday(date)) {
        return {
            studentId: student.enrollmentNo,
            studentName: student.name,
            enrollmentNumber: student.enrollmentNo,
            date: new Date(date),
            status: 'leave',
            lectures: [],
            totalAttended: 0,
            totalClassTime: 0,
            dayPercentage: 0,
            semester: student.semester,
            branch: student.course
        };
    }
    
    // Get timetable for this student
    const timetableKey = `${student.semester}-${student.course}`;
    const daySchedule = timetables[timetableKey];
    
    if (!daySchedule) {
        return null; // No timetable
    }
    
    // Generate attendance for each lecture
    const lectures = [];
    let totalAttended = 0;
    let totalClassTime = 0;
    
    // Student attendance pattern (some students are more regular)
    const studentAttendanceRate = 0.65 + Math.random() * 0.25; // 65-90%
    
    for (const lecture of daySchedule) {
        const lectureDuration = lecture.duration;
        
        // Randomly decide if student attended this lecture
        const willAttend = Math.random() < studentAttendanceRate;
        
        let attendedMinutes = 0;
        if (willAttend) {
            // If attending, they might be late or leave early
            const lateBy = Math.floor(Math.random() * 15); // 0-15 min late
            const earlyLeave = Math.floor(Math.random() * 10); // 0-10 min early
            attendedMinutes = Math.max(0, lectureDuration - lateBy - earlyLeave);
        } else {
            // Sometimes they attend partially
            if (Math.random() < 0.3) {
                attendedMinutes = Math.floor(Math.random() * lectureDuration * 0.5);
            }
        }
        
        const percentage = Math.round((attendedMinutes / lectureDuration) * 100);
        const present = percentage >= 75;
        
        lectures.push({
            subject: lecture.subject,
            room: lecture.room,
            startTime: lecture.startTime,
            endTime: lecture.endTime,
            attended: attendedMinutes,
            total: lectureDuration,
            percentage: percentage,
            present: present
        });
        
        totalAttended += attendedMinutes;
        totalClassTime += lectureDuration;
    }
    
    const dayPercentage = Math.round((totalAttended / totalClassTime) * 100);
    const dayPresent = dayPercentage >= 75;
    
    return {
        studentId: student.enrollmentNo,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNo,
        date: new Date(date),
        status: dayPresent ? 'present' : 'absent',
        lectures: lectures,
        totalAttended: totalAttended,
        totalClassTime: totalClassTime,
        dayPercentage: dayPercentage,
        semester: student.semester,
        branch: student.course
    };
}

async function seedCompleteAttendanceHistory() {
    try {
        console.log('🗑️  Clearing existing attendance records...');
        await AttendanceRecord.deleteMany({});
        
        console.log('📊 Generating detailed attendance from April 18, 2025 to October 20, 2025...');
        
        const startDate = new Date('2025-04-18');
        const endDate = new Date('2025-10-20');
        
        const records = [];
        let totalDays = 0;
        let leaveDays = 0;
        let classDays = 0;
        
        // For each day from start to end
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            totalDays++;
            const dayOfWeek = date.getDay();
            
            // Check if it's a leave day
            if (dayOfWeek === 0 || isHoliday(date)) {
                leaveDays++;
            } else {
                classDays++;
            }
            
            // Generate attendance for each student
            for (const student of students) {
                const record = generateRealisticAttendance(student, new Date(date));
                if (record) {
                    records.push(record);
                }
            }
        }
        
        console.log(`📅 Date Range: ${startDate.toDateString()} to ${endDate.toDateString()}`);
        console.log(`📊 Total Days: ${totalDays}`);
        console.log(`🏖️  Leave Days (Sundays + Holidays): ${leaveDays}`);
        console.log(`📚 Class Days: ${classDays}`);
        console.log(`👥 Students: ${students.length}`);
        console.log(`📝 Total Records: ${records.length}`);
        
        console.log('\n💾 Saving to database...');
        await AttendanceRecord.insertMany(records);
        
        console.log('\n========================================');
        console.log('✅ COMPLETE ATTENDANCE HISTORY SEEDED!');
        console.log('========================================\n');
        
        // Sample statistics
        const sampleStudent = students[0];
        const sampleRecords = records.filter(r => r.studentId === sampleStudent.enrollmentNo);
        const samplePresent = sampleRecords.filter(r => r.status === 'present').length;
        const sampleAbsent = sampleRecords.filter(r => r.status === 'absent').length;
        const sampleLeave = sampleRecords.filter(r => r.status === 'leave').length;
        const sampleRate = Math.round((samplePresent / (samplePresent + sampleAbsent)) * 100);
        
        console.log(`📊 Sample Student: ${sampleStudent.name} (${sampleStudent.enrollmentNo})`);
        console.log(`   Total Records: ${sampleRecords.length}`);
        console.log(`   Present: ${samplePresent} days`);
        console.log(`   Absent: ${sampleAbsent} days`);
        console.log(`   Leave: ${sampleLeave} days`);
        console.log(`   Attendance Rate: ${sampleRate}%`);
        
        // Show a sample day's detailed attendance
        const sampleDay = sampleRecords.find(r => r.lectures.length > 0 && r.status === 'present');
        if (sampleDay) {
            console.log(`\n📅 Sample Day: ${new Date(sampleDay.date).toDateString()}`);
            console.log(`   Status: ${sampleDay.status.toUpperCase()} (${sampleDay.dayPercentage}%)`);
            console.log(`   Total: ${sampleDay.totalAttended} min / ${sampleDay.totalClassTime} min\n`);
            console.log('   Lectures:');
            sampleDay.lectures.forEach((lec, i) => {
                const status = lec.present ? '✓ Present' : '✗ Absent';
                console.log(`   ${i + 1}. ${lec.subject.padEnd(25)} ${lec.startTime}-${lec.endTime} | ${lec.attended}/${lec.total} min | ${lec.percentage}% | ${status}`);
            });
        }
        
        console.log('\n✅ You can now:');
        console.log('   1. Start the server: npm start');
        console.log('   2. Login as student: 0246CS241001 / aditya');
        console.log('   3. Check Calendar for detailed history');
        console.log('   4. Admin panel: Click student name for detailed report\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding attendance:', error);
        process.exit(1);
    }
}
