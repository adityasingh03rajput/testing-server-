const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityasingh03rajput:Aditya%402004@cluster0.mongodb.net/attendance_app?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    seedData();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Schemas
const attendanceRecordSchema = new mongoose.Schema({
    studentId: String,
    studentName: String,
    enrollmentNumber: String,
    date: Date,
    status: String,
    lectures: [{
        period: String,
        subject: String,
        teacher: String,
        teacherName: String,
        room: String,
        startTime: String,
        endTime: String,
        lectureStartedAt: Date,
        lectureEndedAt: Date,
        studentCheckIn: Date,
        attended: Number,
        total: Number,
        percentage: Number,
        present: Boolean,
        verifications: [{
            time: Date,
            type: String,
            success: Boolean,
            event: String
        }]
    }],
    totalAttended: Number,
    totalClassTime: Number,
    dayPercentage: Number,
    timerValue: Number,
    checkInTime: Date,
    checkOutTime: Date,
    semester: String,
    branch: String,
    createdAt: Date
});

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

// Teacher Schema
const teacherSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    email: String,
    password: String,
    department: String,
    subject: String,
    phone: String,
    dob: Date,
    canEditTimetable: Boolean,
    createdAt: Date
});

const Teacher = mongoose.model('Teacher', teacherSchema);

// Sample data - Use real students from database
let students = [];

const teachers = [
    { id: 'TEACH001', name: 'Prof. Kumar' },
    { id: 'TEACH002', name: 'Prof. Sharma' },
    { id: 'TEACH003', name: 'Prof. Patel' },
    { id: 'TEACH004', name: 'Prof. Singh' },
    { id: 'TEACH005', name: 'Prof. Gupta' }
];

const subjects = [
    { name: 'Data Structures', teacher: teachers[0], room: 'CS-101' },
    { name: 'Operating Systems', teacher: teachers[1], room: 'CS-102' },
    { name: 'Computer Networks', teacher: teachers[2], room: 'CS-103' },
    { name: 'Database Management', teacher: teachers[3], room: 'CS-104' },
    { name: 'Software Engineering', teacher: teachers[4], room: 'CS-105' },
    { name: 'Web Technologies', teacher: teachers[0], room: 'CS-106' }
];

const periods = [
    { period: 'P1', startTime: '09:40', endTime: '10:30' },
    { period: 'P2', startTime: '10:40', endTime: '11:30' },
    { period: 'P3', startTime: '11:40', endTime: '12:30' },
    { period: 'P4', startTime: '13:30', endTime: '14:20' },
    { period: 'P5', startTime: '14:30', endTime: '15:20' },
    { period: 'P6', startTime: '15:30', endTime: '16:20' }
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLecture(period, subject, date, studentCheckIn, isPresent = true) {
    const lectureDuration = 50 * 60; // 50 minutes in seconds
    const [startH, startM] = period.startTime.split(':').map(Number);
    const [endH, endM] = period.endTime.split(':').map(Number);
    
    const lectureStart = new Date(date);
    lectureStart.setHours(startH, startM, 0, 0);
    
    const lectureEnd = new Date(date);
    lectureEnd.setHours(endH, endM, 0, 0);
    
    let attended, percentage, verifications = [];
    
    if (isPresent) {
        // Present: 75-100% attendance
        const attendancePercent = getRandomInt(75, 100);
        attended = Math.floor((lectureDuration * attendancePercent) / 100);
        percentage = attendancePercent;
        
        // Add check-in verification
        verifications.push({
            time: studentCheckIn,
            type: 'face',
            success: true,
            event: 'morning_checkin'
        });
        
        // Maybe add random ring verification
        if (Math.random() > 0.7) {
            const randomRingTime = new Date(lectureStart.getTime() + getRandomInt(5, 40) * 60 * 1000);
            verifications.push({
                time: randomRingTime,
                type: 'random_ring',
                success: true,
                event: 'random_ring'
            });
        }
    } else {
        // Absent: 0-74% attendance
        const attendancePercent = getRandomInt(0, 74);
        attended = Math.floor((lectureDuration * attendancePercent) / 100);
        percentage = attendancePercent;
    }
    
    return {
        period: period.period,
        subject: subject.name,
        teacher: subject.teacher.id,
        teacherName: subject.teacher.name,
        room: subject.room,
        startTime: period.startTime,
        endTime: period.endTime,
        lectureStartedAt: lectureStart,
        lectureEndedAt: lectureEnd,
        studentCheckIn: studentCheckIn,
        attended,
        total: lectureDuration,
        percentage,
        present: percentage >= 75,
        verifications
    };
}

async function seedData() {
    try {
        console.log('🌱 Starting to seed attendance data...');
        
        // Get real students from database
        const StudentManagement = mongoose.model('StudentManagement', new mongoose.Schema({}, { strict: false }));
        const dbStudents = await StudentManagement.find().limit(10);
        
        if (dbStudents.length === 0) {
            console.error('❌ No students found in database!');
            console.log('   Please add students first before seeding attendance data.');
            process.exit(1);
        }
        
        students = dbStudents.map(s => ({
            id: s._id.toString(),
            name: s.name,
            enrollmentNo: s.enrollmentNo,
            semester: s.semester || '1',
            branch: s.course || 'B.Tech Data Science'
        }));
        
        console.log(`✅ Found ${students.length} students in database`);
        console.log(`   Using: ${students.map(s => s.name).join(', ')}`);
        
        // Create teachers if they don't exist
        const teacherCount = await Teacher.countDocuments();
        if (teacherCount === 0) {
            console.log('\n👨‍🏫 Creating teachers...');
            const teachersToCreate = teachers.map(t => ({
                employeeId: t.id,
                name: t.name,
                email: `${t.id.toLowerCase()}@college.edu`,
                password: 'teacher123',
                department: 'Computer Science',
                subject: 'Various',
                phone: '9876543210',
                dob: new Date('1980-01-01'),
                canEditTimetable: true,
                createdAt: new Date()
            }));
            
            await Teacher.insertMany(teachersToCreate);
            console.log(`✅ Created ${teachersToCreate.length} teachers`);
        } else {
            console.log(`✅ Teachers already exist (${teacherCount})`);
        }
        
        // Clear existing attendance records
        await AttendanceRecord.deleteMany({});
        console.log('🗑️  Cleared existing attendance records');
        
        const records = [];
        
        // Generate data for last 30 days
        const today = new Date();
        for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
            const date = new Date(today);
            date.setDate(date.getDate() - dayOffset);
            date.setHours(0, 0, 0, 0);
            
            // Skip Sundays
            if (date.getDay() === 0) continue;
            
            console.log(`📅 Generating data for ${date.toDateString()}...`);
            
            // For each student
            for (const student of students) {
                // Random check-in time between 8:30 and 9:30
                const checkInTime = new Date(date);
                checkInTime.setHours(8, getRandomInt(30, 90), getRandomInt(0, 59), 0);
                
                // Decide if student is present today (90% chance)
                const isPresentToday = Math.random() > 0.1;
                
                const lectures = [];
                let totalAttended = 0;
                let totalClassTime = 0;
                
                // Generate 6 lectures for the day
                for (let i = 0; i < 6; i++) {
                    const period = periods[i];
                    const subject = subjects[i];
                    
                    // If student is present today, 95% chance for each lecture
                    const isPresentInLecture = isPresentToday && (Math.random() > 0.05);
                    
                    const lecture = generateLecture(period, subject, date, checkInTime, isPresentInLecture);
                    lectures.push(lecture);
                    
                    totalAttended += lecture.attended;
                    totalClassTime += lecture.total;
                }
                
                const dayPercentage = totalClassTime > 0 
                    ? Math.round((totalAttended / totalClassTime) * 100)
                    : 0;
                
                // Check-out time (last lecture end time + random minutes)
                const checkOutTime = new Date(date);
                checkOutTime.setHours(16, getRandomInt(20, 40), getRandomInt(0, 59), 0);
                
                const record = new AttendanceRecord({
                    studentId: student.id,
                    studentName: student.name,
                    enrollmentNumber: student.enrollmentNo,
                    date,
                    status: isPresentToday ? 'present' : 'absent',
                    lectures,
                    totalAttended,
                    totalClassTime,
                    dayPercentage,
                    timerValue: totalAttended, // Timer value in seconds
                    checkInTime,
                    checkOutTime,
                    semester: student.semester,
                    branch: student.branch,
                    createdAt: date
                });
                
                records.push(record);
            }
        }
        
        // Insert all records
        await AttendanceRecord.insertMany(records);
        
        console.log(`✅ Successfully seeded ${records.length} attendance records`);
        console.log(`   Students: ${students.length}`);
        console.log(`   Days: ~${Math.floor(records.length / students.length)}`);
        console.log(`   Total lectures: ${records.reduce((sum, r) => sum + r.lectures.length, 0)}`);
        
        // Show sample data
        const sampleRecord = records[0];
        console.log('\n📊 Sample Record:');
        console.log(`   Student: ${sampleRecord.studentName}`);
        console.log(`   Date: ${sampleRecord.date.toDateString()}`);
        console.log(`   Status: ${sampleRecord.status}`);
        console.log(`   Day Percentage: ${sampleRecord.dayPercentage}%`);
        console.log(`   Lectures: ${sampleRecord.lectures.length}`);
        console.log(`   Total Time: ${Math.floor(sampleRecord.totalAttended / 60)} min / ${Math.floor(sampleRecord.totalClassTime / 60)} min`);
        
        if (sampleRecord.lectures.length > 0) {
            const sampleLecture = sampleRecord.lectures[0];
            console.log(`\n   Sample Lecture (${sampleLecture.period}):`);
            console.log(`     Subject: ${sampleLecture.subject}`);
            console.log(`     Teacher: ${sampleLecture.teacherName}`);
            console.log(`     Time: ${sampleLecture.startTime} - ${sampleLecture.endTime}`);
            console.log(`     Attended: ${Math.floor(sampleLecture.attended / 60)}m ${sampleLecture.attended % 60}s`);
            console.log(`     Percentage: ${sampleLecture.percentage}%`);
            console.log(`     Present: ${sampleLecture.present ? '✅' : '❌'}`);
            console.log(`     Verifications: ${sampleLecture.verifications.length}`);
        }
        
        console.log('\n🎉 Seeding completed successfully!');
        console.log('   You can now test the admin panel attendance views.');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}
