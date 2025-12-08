require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';

// AttendanceHistory Schema
const attendanceHistorySchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentManagement', required: true },
    enrollmentNo: { type: String, required: true },
    studentName: { type: String, required: true },
    date: { type: Date, required: true },
    semester: String,
    branch: String,
    periods: [{
        subject: String,
        room: String,
        teacher: String,
        startTime: String,
        endTime: String,
        attendedSeconds: Number,
        totalSeconds: Number,
        attendedMinutes: Number,
        totalMinutes: Number,
        percentage: Number,
        present: Boolean,
        verifiedFace: Boolean,
        randomRingTriggered: Boolean,
        randomRingPassed: Boolean,
        offlineTime: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    totalAttendedSeconds: { type: Number, default: 0 },
    totalClassSeconds: { type: Number, default: 0 },
    totalAttendedMinutes: { type: Number, default: 0 },
    totalClassMinutes: { type: Number, default: 0 },
    dayPercentage: { type: Number, default: 0 },
    dayPresent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const AttendanceHistory = mongoose.model('AttendanceHistory', attendanceHistorySchema);

const studentManagementSchema = new mongoose.Schema({
    enrollmentNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: String,
    password: String,
    course: String,
    semester: String,
    dob: Date,
    profilePhoto: String,
    createdAt: { type: Date, default: Date.now }
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

// Sample subjects for CSE Semester 1
const subjects = [
    { name: 'Mathematics-I', room: 'R101', teacher: 'Dr. Sharma' },
    { name: 'Physics', room: 'R102', teacher: 'Prof. Kumar' },
    { name: 'Programming in C', room: 'Lab-1', teacher: 'Dr. Patel' },
    { name: 'Engineering Graphics', room: 'R103', teacher: 'Prof. Singh' },
    { name: 'English Communication', room: 'R104', teacher: 'Dr. Verma' }
];

// Period timings
const periods = [
    { startTime: '09:00', endTime: '10:00', totalMinutes: 60 },
    { startTime: '10:00', endTime: '11:00', totalMinutes: 60 },
    { startTime: '11:15', endTime: '12:15', totalMinutes: 60 },
    { startTime: '12:15', endTime: '13:15', totalMinutes: 60 },
    { startTime: '14:00', endTime: '15:00', totalMinutes: 60 },
    { startTime: '15:00', endTime: '16:00', totalMinutes: 60 }
];

// Generate random attendance percentage (60-100%)
function getRandomAttendance() {
    return Math.floor(Math.random() * 40) + 60; // 60-100%
}

// Generate sample attendance data
async function seedAttendanceHistory() {
    try {
        console.log('🌱 Seeding Attendance History...');
        console.log('📡 Connecting to MongoDB...');
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Get Aditya Singhh student
        const student = await StudentManagement.findOne({ enrollmentNo: '0246CS241001' });
        
        if (!student) {
            console.log('❌ Student Aditya Singhh (0246CS241001) not found!');
            console.log('   Please add the student first using the admin panel.');
            process.exit(1);
        }
        
        console.log(`✅ Found student: ${student.name} (${student.enrollmentNo})`);
        
        // Clear existing attendance history for this student
        await AttendanceHistory.deleteMany({ enrollmentNo: student.enrollmentNo });
        console.log('🗑️  Cleared existing attendance history');
        
        // Generate attendance for last 30 days
        const today = new Date();
        const attendanceRecords = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            // Skip Sundays
            if (date.getDay() === 0) continue;
            
            // Generate 4-6 random periods for the day
            const numPeriods = Math.floor(Math.random() * 3) + 4; // 4-6 periods
            const dayPeriods = [];
            
            for (let p = 0; p < numPeriods; p++) {
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const period = periods[p % periods.length];
                const attendancePercentage = getRandomAttendance();
                
                const totalSeconds = period.totalMinutes * 60;
                const attendedSeconds = Math.floor((totalSeconds * attendancePercentage) / 100);
                const attendedMinutes = Math.floor(attendedSeconds / 60);
                
                dayPeriods.push({
                    subject: subject.name,
                    room: subject.room,
                    teacher: subject.teacher,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    attendedSeconds: attendedSeconds,
                    totalSeconds: totalSeconds,
                    attendedMinutes: attendedMinutes,
                    totalMinutes: period.totalMinutes,
                    percentage: attendancePercentage,
                    present: attendancePercentage >= 75,
                    verifiedFace: true,
                    randomRingTriggered: Math.random() > 0.7, // 30% chance
                    randomRingPassed: Math.random() > 0.2, // 80% pass rate
                    offlineTime: Math.floor(Math.random() * 300), // 0-5 minutes offline
                    timestamp: new Date()
                });
            }
            
            // Calculate daily totals
            const totalAttendedSeconds = dayPeriods.reduce((sum, p) => sum + p.attendedSeconds, 0);
            const totalClassSeconds = dayPeriods.reduce((sum, p) => sum + p.totalSeconds, 0);
            const totalAttendedMinutes = Math.floor(totalAttendedSeconds / 60);
            const totalClassMinutes = Math.floor(totalClassSeconds / 60);
            const dayPercentage = Math.round((totalAttendedSeconds / totalClassSeconds) * 100);
            
            attendanceRecords.push({
                studentId: student._id,
                enrollmentNo: student.enrollmentNo,
                studentName: student.name,
                date: date,
                semester: student.semester,
                branch: student.course,
                periods: dayPeriods,
                totalAttendedSeconds: totalAttendedSeconds,
                totalClassSeconds: totalClassSeconds,
                totalAttendedMinutes: totalAttendedMinutes,
                totalClassMinutes: totalClassMinutes,
                dayPercentage: dayPercentage,
                dayPresent: dayPercentage >= 75,
                createdAt: date,
                updatedAt: date
            });
        }
        
        // Insert all records
        await AttendanceHistory.insertMany(attendanceRecords);
        
        console.log(`✅ Seeded ${attendanceRecords.length} days of attendance history`);
        
        // Calculate and display summary
        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(r => r.dayPresent).length;
        const totalHours = Math.floor(attendanceRecords.reduce((sum, r) => sum + r.totalAttendedMinutes, 0) / 60);
        const totalMinutes = attendanceRecords.reduce((sum, r) => sum + r.totalAttendedMinutes, 0) % 60;
        const overallPercentage = Math.round(
            (attendanceRecords.reduce((sum, r) => sum + r.totalAttendedSeconds, 0) /
            attendanceRecords.reduce((sum, r) => sum + r.totalClassSeconds, 0)) * 100
        );
        
        console.log('\n📊 Summary:');
        console.log(`   Student: ${student.name} (${student.enrollmentNo})`);
        console.log(`   Total Days: ${totalDays}`);
        console.log(`   Present Days: ${presentDays}`);
        console.log(`   Overall Attendance: ${overallPercentage}%`);
        console.log(`   Total Time Attended: ${totalHours}h ${totalMinutes}m`);
        console.log(`   Date Range: ${attendanceRecords[0].date.toLocaleDateString()} to ${attendanceRecords[attendanceRecords.length - 1].date.toLocaleDateString()}`);
        
        // Subject-wise summary
        console.log('\n📚 Subject-wise Attendance:');
        const subjectStats = {};
        attendanceRecords.forEach(day => {
            day.periods.forEach(period => {
                if (!subjectStats[period.subject]) {
                    subjectStats[period.subject] = {
                        totalMinutes: 0,
                        attendedMinutes: 0,
                        periods: 0
                    };
                }
                subjectStats[period.subject].totalMinutes += period.totalMinutes;
                subjectStats[period.subject].attendedMinutes += period.attendedMinutes;
                subjectStats[period.subject].periods++;
            });
        });
        
        Object.entries(subjectStats).forEach(([subject, stats]) => {
            const percentage = Math.round((stats.attendedMinutes / stats.totalMinutes) * 100);
            console.log(`   ${subject}: ${percentage}% (${stats.periods} periods)`);
        });
        
        console.log('\n✅ Attendance history seeded successfully!');
        console.log('🎉 You can now view the data in the admin panel.');
        
    } catch (error) {
        console.error('❌ Error seeding attendance history:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

// Run the seeder
seedAttendanceHistory();
