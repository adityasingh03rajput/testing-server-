const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    checkStudentData();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

const StudentManagementSchema = new mongoose.Schema({}, { strict: false });
const StudentManagement = mongoose.model('StudentManagement', StudentManagementSchema, 'studentmanagements');

async function checkStudentData() {
    try {
        console.log('\n🔍 CHECKING ADITYA SINGHH DATA...\n');
        
        const student = await StudentManagement.findOne({ enrollmentNo: '0246CS241001' });
        
        if (!student) {
            console.log('❌ Student not found!');
            process.exit(1);
        }
        
        console.log('✅ Found student:', student.name);
        console.log('\n📊 Current Status:');
        console.log('   isRunning:', student.isRunning);
        console.log('   status:', student.status);
        
        console.log('\n⏱️  Attendance Session:');
        if (student.attendanceSession) {
            console.log('   sessionStartTime:', student.attendanceSession.sessionStartTime);
            console.log('   totalAttendedSeconds:', student.attendanceSession.totalAttendedSeconds);
            console.log('   totalAttendedMinutes:', Math.floor((student.attendanceSession.totalAttendedSeconds || 0) / 60));
            console.log('   isPaused:', student.attendanceSession.isPaused);
            console.log('   pauseReason:', student.attendanceSession.pauseReason);
            console.log('   pausedDuration:', student.attendanceSession.pausedDuration);
        } else {
            console.log('   ❌ No attendance session data!');
        }
        
        console.log('\n📚 Current Class:');
        if (student.currentClass) {
            console.log('   subject:', student.currentClass.subject);
            console.log('   teacher:', student.currentClass.teacher);
            console.log('   room:', student.currentClass.room);
            console.log('   startTime:', student.currentClass.startTime);
            console.log('   endTime:', student.currentClass.endTime);
        } else {
            console.log('   ❌ No current class data!');
        }
        
        console.log('\n🔧 DIAGNOSIS:');
        
        const attendedSeconds = student.attendanceSession?.totalAttendedSeconds || 0;
        const attendedMinutes = Math.floor(attendedSeconds / 60);
        
        if (attendedSeconds === 0) {
            console.log('   ❌ PROBLEM: totalAttendedSeconds is 0!');
            console.log('   This means the server is NOT saving attended time.');
            console.log('   OR the timer was reset when you closed the app.');
        } else {
            console.log(`   ✅ Database has ${attendedMinutes} minutes (${attendedSeconds} seconds) saved`);
            console.log('   The resume functionality should load this value.');
        }
        
        if (!student.isRunning) {
            console.log('   ℹ️  isRunning is false - timer is not active');
            console.log('   This is normal after closing the app.');
        }
        
        console.log('\n💡 SOLUTION:');
        console.log('   1. The server needs to be deployed with the new /api/student/:id endpoint');
        console.log('   2. The app needs to call loadTodayAttendance() on login');
        console.log('   3. The app should restore attendedSeconds from database');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
