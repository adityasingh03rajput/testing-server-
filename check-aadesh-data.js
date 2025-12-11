const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

// Student Schema (matching the one in index.js)
const studentManagementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    enrollmentNo: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: String, required: true },
    photoUrl: { type: String },
    role: { type: String, default: 'student' },
    isActive: { type: Boolean, default: true },
    
    // Timer and attendance tracking
    timerValue: { type: Number, default: 0 },
    isRunning: { type: Boolean, default: false },
    status: { type: String, enum: ['attending', 'absent', 'present'], default: 'absent' },
    lastUpdated: { type: Date, default: Date.now },
    
    // Enhanced attendance session tracking
    attendanceSession: {
        sessionStartTime: Date,
        totalAttendedSeconds: { type: Number, default: 0 },
        isPaused: { type: Boolean, default: false },
        pausedDuration: { type: Number, default: 0 },
        lastPauseTime: Date,
        wifiConnected: { type: Boolean, default: false },
        faceVerified: { type: Boolean, default: false },
        lastHeartbeat: Date,
        currentClass: {
            subject: String,
            teacher: String,
            room: String,
            startTime: String,
            endTime: String
        },
        offlinePeriods: [{
            startTime: Date,
            endTime: Date,
            duration: Number
        }],
        randomRingId: String,
        randomRingPassed: Boolean,
        offlineRecovery: {
            recoveredAt: Date,
            offlineDuration: Number,
            recoveredSeconds: Number
        }
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

// Attendance Session Schema
const attendanceSessionSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNo: { type: String, required: true },
    date: { type: Date, required: true },
    
    sessionStartTime: { type: Date, required: true },
    timerValue: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastUpdate: { type: Date, default: Date.now },
    
    wifiConnected: { type: Boolean, default: true },
    currentClass: {
        period: String,
        subject: String,
        teacher: String,
        teacherName: String,
        room: String,
        startTime: String,
        endTime: String,
        classStartedAt: Date
    },
    
    semester: String,
    branch: String
});

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

async function checkAadeshData() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // Search for Aadesh Chouksey
        console.log('\n📋 Searching for Aadesh Chouksey...');
        
        // Try different variations of the name
        const searchPatterns = [
            'Aadesh Chouksey',
            'aadesh chouksey',
            'AADESH CHOUKSEY',
            'Aadesh',
            'Chouksey'
        ];
        
        let student = null;
        
        for (const pattern of searchPatterns) {
            student = await StudentManagement.findOne({
                $or: [
                    { name: { $regex: pattern, $options: 'i' } },
                    { enrollmentNo: pattern }
                ]
            });
            
            if (student) {
                console.log(`✅ Found student with pattern: "${pattern}"`);
                break;
            }
        }
        
        if (!student) {
            console.log('❌ Student "Aadesh Chouksey" not found');
            console.log('\n📋 Let me show all students to help identify the correct name...');
            
            const allStudents = await StudentManagement.find({}).select('name enrollmentNo course semester isRunning timerValue lastUpdated');
            console.log(`\n📊 Found ${allStudents.length} students in database:`);
            
            allStudents.forEach((s, index) => {
                console.log(`${index + 1}. Name: "${s.name}" | Enrollment: ${s.enrollmentNo} | Course: ${s.course} | Semester: ${s.semester} | Running: ${s.isRunning} | Timer: ${s.timerValue}s`);
            });
            
            return;
        }
        
        console.log('\n🎯 STUDENT FOUND:');
        console.log('================');
        console.log(`👤 Name: ${student.name}`);
        console.log(`🆔 Enrollment No: ${student.enrollmentNo}`);
        console.log(`📧 Email: ${student.email}`);
        console.log(`🎓 Course: ${student.course}`);
        console.log(`📚 Semester: ${student.semester}`);
        console.log(`📸 Photo URL: ${student.photoUrl || 'Not set'}`);
        console.log(`🔄 Active: ${student.isActive}`);
        console.log(`📅 Created: ${student.createdAt}`);
        console.log(`🔄 Last Updated: ${student.lastUpdated}`);
        
        console.log('\n⏱️  TIMER STATUS:');
        console.log('================');
        console.log(`🏃 Is Running: ${student.isRunning}`);
        console.log(`⏰ Timer Value: ${student.timerValue} seconds (${Math.floor(student.timerValue / 60)} minutes ${student.timerValue % 60} seconds)`);
        console.log(`📊 Status: ${student.status}`);
        
        if (student.attendanceSession) {
            console.log('\n📋 ATTENDANCE SESSION:');
            console.log('=====================');
            const session = student.attendanceSession;
            
            console.log(`🚀 Session Start: ${session.sessionStartTime || 'Not started'}`);
            console.log(`⏱️  Total Attended: ${session.totalAttendedSeconds || 0} seconds (${Math.floor((session.totalAttendedSeconds || 0) / 60)} minutes)`);
            console.log(`⏸️  Is Paused: ${session.isPaused || false}`);
            console.log(`⏳ Paused Duration: ${session.pausedDuration || 0} seconds`);
            console.log(`⏸️  Last Pause: ${session.lastPauseTime || 'Never paused'}`);
            console.log(`📶 WiFi Connected: ${session.wifiConnected || false}`);
            console.log(`🔒 Face Verified: ${session.faceVerified || false}`);
            console.log(`💓 Last Heartbeat: ${session.lastHeartbeat || 'No heartbeat'}`);
            
            if (session.currentClass) {
                console.log('\n📚 CURRENT CLASS:');
                console.log('================');
                console.log(`📖 Subject: ${session.currentClass.subject || 'Not set'}`);
                console.log(`👨‍🏫 Teacher: ${session.currentClass.teacher || 'Not set'}`);
                console.log(`🏫 Room: ${session.currentClass.room || 'Not set'}`);
                console.log(`🕐 Start Time: ${session.currentClass.startTime || 'Not set'}`);
                console.log(`🕕 End Time: ${session.currentClass.endTime || 'Not set'}`);
            }
            
            if (session.offlinePeriods && session.offlinePeriods.length > 0) {
                console.log('\n📱 OFFLINE PERIODS:');
                console.log('==================');
                session.offlinePeriods.forEach((period, index) => {
                    console.log(`${index + 1}. Start: ${period.startTime} | End: ${period.endTime} | Duration: ${period.duration}s`);
                });
            }
            
            if (session.offlineRecovery) {
                console.log('\n🔄 OFFLINE RECOVERY:');
                console.log('===================');
                const recovery = session.offlineRecovery;
                console.log(`📅 Recovered At: ${recovery.recoveredAt}`);
                console.log(`⏱️  Offline Duration: ${recovery.offlineDuration}s`);
                console.log(`✅ Recovered Seconds: ${recovery.recoveredSeconds}s`);
            }
        } else {
            console.log('\n❌ No attendance session data found');
        }
        
        // Check for attendance sessions in separate collection
        console.log('\n🔍 Checking AttendanceSession collection...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendanceSession = await AttendanceSession.findOne({
            $or: [
                { studentId: student._id.toString() },
                { enrollmentNo: student.enrollmentNo }
            ],
            date: { $gte: today }
        });
        
        if (attendanceSession) {
            console.log('\n📋 ATTENDANCE SESSION (Separate Collection):');
            console.log('==========================================');
            console.log(`🆔 Student ID: ${attendanceSession.studentId}`);
            console.log(`👤 Student Name: ${attendanceSession.studentName}`);
            console.log(`🆔 Enrollment No: ${attendanceSession.enrollmentNo}`);
            console.log(`📅 Date: ${attendanceSession.date}`);
            console.log(`🚀 Session Start: ${attendanceSession.sessionStartTime}`);
            console.log(`⏰ Timer Value: ${attendanceSession.timerValue}s (${Math.floor(attendanceSession.timerValue / 60)}min)`);
            console.log(`🔄 Is Active: ${attendanceSession.isActive}`);
            console.log(`🔄 Last Update: ${attendanceSession.lastUpdate}`);
            console.log(`📶 WiFi Connected: ${attendanceSession.wifiConnected}`);
            
            if (attendanceSession.currentClass) {
                console.log(`📚 Current Class: ${attendanceSession.currentClass.subject || 'Not set'}`);
                console.log(`🏫 Room: ${attendanceSession.currentClass.room || 'Not set'}`);
            }
        } else {
            console.log('\n❌ No attendance session found in separate collection for today');
        }
        
        // Calculate session summary
        console.log('\n📊 SESSION SUMMARY:');
        console.log('==================');
        
        const totalAttended = student.attendanceSession?.totalAttendedSeconds || student.timerValue || 0;
        const sessionStart = student.attendanceSession?.sessionStartTime;
        
        if (sessionStart) {
            const sessionDuration = Math.floor((new Date() - new Date(sessionStart)) / 1000);
            const efficiency = sessionDuration > 0 ? Math.round((totalAttended / sessionDuration) * 100) : 0;
            
            console.log(`⏱️  Total Session Duration: ${sessionDuration}s (${Math.floor(sessionDuration / 60)}min)`);
            console.log(`✅ Total Attended Time: ${totalAttended}s (${Math.floor(totalAttended / 60)}min)`);
            console.log(`📈 Attendance Efficiency: ${efficiency}%`);
            console.log(`🏃 Currently Running: ${student.isRunning ? 'YES' : 'NO'}`);
            
            if (!student.isRunning && totalAttended > 0) {
                console.log(`\n🎯 FINAL RESULT: Student attended ${Math.floor(totalAttended / 60)} minutes and ${totalAttended % 60} seconds`);
                console.log(`📊 Data Status: ${totalAttended > 0 ? '✅ SAVED SUCCESSFULLY' : '❌ NO DATA SAVED'}`);
            }
        } else {
            console.log('❌ No session start time found');
        }
        
    } catch (error) {
        console.error('❌ Error checking data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkAadeshData();