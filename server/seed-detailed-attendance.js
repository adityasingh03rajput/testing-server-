const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ Connected to MongoDB');
    seedDetailedAttendance();
}).catch(err => {
    console.log('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Attendance Record Schema (must match server/index.js)
const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNumber: String,
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
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
    timerValue: { type: Number, default: 0 },
    checkInTime: Date,
    checkOutTime: Date,
    semester: String,
    branch: String,
    createdAt: { type: Date, default: Date.now }
});

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

// Student data (from seed-data.js)
const students = [
    { enrollmentNo: '0246CS241001', name: 'Aditya Singh', course: 'CSE', semester: '1' },
    { enrollmentNo: '0246CS241002', name: 'Priya Sharma', course: 'CSE', semester: '1' },
    { enrollmentNo: '0246CS241003', name: 'Rahul Kumar', course: 'CSE', semester: '1' },
    { enrollmentNo: '0246CS231001', name: 'Sneha Patel', course: 'CSE', semester: '3' },
    { enrollmentNo: '0246CS231002', name: 'Vikram Reddy', course: 'CSE', semester: '3' },
    { enrollmentNo: '0246CS221001', name: 'Ravi Shankar', course: 'CSE', semester: '5' },
    { enrollmentNo: '0246EC241001', name: 'Ananya Gupta', course: 'ECE', semester: '1' },
    { enrollmentNo: '0246EC231001', name: 'Divya Iyer', course: 'ECE', semester: '3' },
];

// Timetable templates (excluding breaks)
const timetableTemplates = {
    'CSE-1': [
        { subject: 'Mathematics-I', room: 'Ma-101', duration: 60 },
        { subject: 'Physics', room: 'Ph-102', duration: 60 },
        { subject: 'Chemistry', room: 'Ch-103', duration: 30 },
        { subject: 'Programming in C', room: 'Pr-104', duration: 60 },
        { subject: 'English', room: 'En-105', duration: 70 },
        { subject: 'Lab', room: 'Lab-2', duration: 50 }
    ],
    'CSE-3': [
        { subject: 'Data Structures', room: 'DS-201', duration: 60 },
        { subject: 'Database Management', room: 'DB-202', duration: 60 },
        { subject: 'Operating Systems', room: 'OS-203', duration: 30 },
        { subject: 'Computer Networks', room: 'CN-204', duration: 60 },
        { subject: 'Software Engineering', room: 'SE-205', duration: 70 },
        { subject: 'Lab', room: 'Lab-3', duration: 50 }
    ],
    'CSE-5': [
        { subject: 'Machine Learning', room: 'ML-301', duration: 60 },
        { subject: 'Artificial Intelligence', room: 'AI-302', duration: 60 },
        { subject: 'Cloud Computing', room: 'CC-303', duration: 30 },
        { subject: 'Big Data', room: 'BD-304', duration: 60 },
        { subject: 'Blockchain', room: 'BC-305', duration: 70 },
        { subject: 'Project', room: 'Lab-5', duration: 50 }
    ],
    'ECE-1': [
        { subject: 'Mathematics-I', room: 'Ma-101', duration: 60 },
        { subject: 'Physics', room: 'Ph-102', duration: 60 },
        { subject: 'Electronics', room: 'El-103', duration: 30 },
        { subject: 'Circuit Theory', room: 'CT-104', duration: 60 },
        { subject: 'English', room: 'En-105', duration: 70 },
        { subject: 'Lab', room: 'Lab-2', duration: 50 }
    ],
    'ECE-3': [
        { subject: 'Digital Electronics', room: 'DE-201', duration: 60 },
        { subject: 'Signals & Systems', room: 'SS-202', duration: 60 },
        { subject: 'Microprocessors', room: 'MP-203', duration: 30 },
        { subject: 'Communication', room: 'CM-204', duration: 60 },
        { subject: 'Control Systems', room: 'CS-205', duration: 70 },
        { subject: 'Lab', room: 'Lab-3', duration: 50 }
    ]
};

// Generate realistic attendance for a student
function generateDayAttendance(student, date, attendancePattern) {
    const timetableKey = `${student.course}-${student.semester}`;
    const lectures = timetableTemplates[timetableKey] || timetableTemplates['CSE-1'];
    
    const dayOfWeek = date.getDay();
    // Skip Sundays (0) - it's a leave
    if (dayOfWeek === 0) return null;
    
    const attendedLectures = [];
    let totalAttended = 0;
    let totalClassTime = 0;
    
    lectures.forEach((lecture, index) => {
        const total = lecture.duration;
        totalClassTime += total;
        
        // Vary attendance based on pattern and randomness
        let attendanceRate = attendancePattern;
        // Add some daily variation (-10% to +10%)
        attendanceRate += (Math.random() * 0.2 - 0.1);
        // Clamp between 0 and 1
        attendanceRate = Math.max(0, Math.min(1, attendanceRate));
        
        // Some lectures might be fully attended, some partially
        const attended = Math.floor(total * attendanceRate);
        const percentage = Math.round((attended / total) * 100);
        const present = percentage >= 75;
        
        totalAttended += attended;
        
        // Generate realistic times
        const startHour = 9 + Math.floor(index * 1.2);
        const startMin = (index * 20) % 60;
        const endHour = startHour + Math.floor((startMin + total) / 60);
        const endMin = (startMin + total) % 60;
        
        attendedLectures.push({
            subject: lecture.subject,
            room: lecture.room,
            startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
            endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
            attended,
            total,
            percentage,
            present
        });
    });
    
    const dayPercentage = Math.round((totalAttended / totalClassTime) * 100);
    const dayPresent = dayPercentage >= 75;
    
    return {
        studentId: student.enrollmentNo,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNo,
        date: new Date(date),
        status: dayPresent ? 'present' : 'absent',
        lectures: attendedLectures,
        totalAttended,
        totalClassTime,
        dayPercentage,
        timerValue: 0,
        checkInTime: new Date(date.setHours(9, 30, 0, 0)),
        checkOutTime: new Date(date.setHours(16, 0, 0, 0)),
        semester: student.semester,
        branch: student.course
    };
}

async function seedDetailedAttendance() {
    try {
        console.log('🗑️  Clearing existing attendance records...');
        await AttendanceRecord.deleteMany({});
        
        const records = [];
        const endDate = new Date();
        const startDate = new Date('2025-04-18'); // April 18, 2025
        
        console.log(`📊 Generating attendance from ${startDate.toDateString()} to ${endDate.toDateString()}`);
        
        // Define attendance patterns for different students
        const attendancePatterns = {
            '0246CS241001': 0.85, // Aditya - 85% average
            '0246CS241002': 0.92, // Priya - 92% average
            '0246CS241003': 0.68, // Rahul - 68% average
            '0246CS231001': 0.78, // Sneha - 78% average
            '0246CS231002': 0.88, // Vikram - 88% average
            '0246CS221001': 0.72, // Ravi - 72% average
            '0246EC241001': 0.95, // Ananya - 95% average
            '0246EC231001': 0.65, // Divya - 65% average
        };
        
        // Generate records for each student for each day
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            for (const student of students) {
                const pattern = attendancePatterns[student.enrollmentNo] || 0.75;
                const dayRecord = generateDayAttendance(student, new Date(date), pattern);
                
                if (dayRecord) {
                    records.push(dayRecord);
                }
            }
        }
        
        console.log(`💾 Saving ${records.length} attendance records...`);
        await AttendanceRecord.insertMany(records);
        
        // Calculate and display statistics
        console.log('\n========================================');
        console.log('✅ DETAILED ATTENDANCE SEEDING COMPLETED!');
        console.log('========================================\n');
        
        for (const student of students) {
            const studentRecords = records.filter(r => r.studentId === student.enrollmentNo);
            const presentDays = studentRecords.filter(r => r.status === 'present').length;
            const totalDays = studentRecords.length;
            const percentage = Math.round((presentDays / totalDays) * 100);
            
            console.log(`👤 ${student.name} (${student.enrollmentNo})`);
            console.log(`   Days: ${presentDays}/${totalDays} (${percentage}%)`);
            console.log(`   Course: ${student.course} Sem ${student.semester}`);
            console.log('');
        }
        
        console.log(`📊 Total Records: ${records.length}`);
        console.log(`📅 Date Range: ${startDate.toDateString()} to ${endDate.toDateString()}`);
        console.log(`👥 Students: ${students.length}`);
        console.log('\n========================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding attendance:', error);
        process.exit(1);
    }
}
