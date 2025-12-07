// Check if any students are currently attending class
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';

// Student Management Schema
const studentManagementSchema = new mongoose.Schema({
  name: String,
  enrollmentNo: String,
  semester: String,
  course: String,
  isRunning: Boolean,
  status: String,
  currentClass: {
    subject: String,
    teacher: String,
    room: String,
    period: Number,
    startTime: String,
    endTime: String,
    totalDurationSeconds: Number,
    startTimestamp: Date
  },
  attendanceSession: {
    sessionStartTime: Date,
    totalAttendedSeconds: Number,
    lastPauseTime: Date,
    pausedDuration: Number,
    isPaused: Boolean,
    pauseReason: String
  },
  lastUpdated: Date
}, { collection: 'studentmanagements' });

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

async function checkActiveStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI:', MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB\n');
    
    // Check for students with active timers
    console.log('📊 Checking for active students...\n');
    
    const activeStudents = await StudentManagement.find({ isRunning: true });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📈 ACTIVE STUDENTS: ${activeStudents.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (activeStudents.length === 0) {
      console.log('❌ No students are currently attending class');
      console.log('   Timer broadcasts will only occur when students start their timers\n');
    } else {
      activeStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.enrollmentNo})`);
        console.log(`   📚 Course: ${student.course} - Semester ${student.semester}`);
        console.log(`   ⏱️  Status: ${student.status}`);
        console.log(`   🏃 Running: ${student.isRunning}`);
        
        if (student.currentClass) {
          console.log(`   📖 Current Class: ${student.currentClass.subject}`);
          console.log(`   👨‍🏫 Teacher: ${student.currentClass.teacher}`);
          console.log(`   🏫 Room: ${student.currentClass.room}`);
          console.log(`   ⏰ Time: ${student.currentClass.startTime} - ${student.currentClass.endTime}`);
        }
        
        if (student.attendanceSession) {
          const attendedMinutes = Math.floor((student.attendanceSession.totalAttendedSeconds || 0) / 60);
          console.log(`   ✅ Attended: ${attendedMinutes} minutes (${student.attendanceSession.totalAttendedSeconds || 0} seconds)`);
          console.log(`   🕐 Session Start: ${student.attendanceSession.sessionStartTime}`);
          console.log(`   ⏸️  Paused: ${student.attendanceSession.isPaused ? 'YES' : 'NO'}`);
          if (student.attendanceSession.isPaused) {
            console.log(`   📝 Pause Reason: ${student.attendanceSession.pauseReason}`);
          }
        }
        
        console.log(`   🔄 Last Updated: ${student.lastUpdated}`);
        console.log('');
      });
    }
    
    // Check all students (active and inactive)
    const allStudents = await StudentManagement.find({});
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 TOTAL STUDENTS IN DATABASE: ${allStudents.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const statusBreakdown = {
      attending: 0,
      present: 0,
      absent: 0,
      other: 0
    };
    
    allStudents.forEach(student => {
      if (student.status === 'attending') statusBreakdown.attending++;
      else if (student.status === 'present') statusBreakdown.present++;
      else if (student.status === 'absent') statusBreakdown.absent++;
      else statusBreakdown.other++;
    });
    
    console.log('📊 Status Breakdown:');
    console.log(`   🟢 Attending: ${statusBreakdown.attending}`);
    console.log(`   ✅ Present: ${statusBreakdown.present}`);
    console.log(`   ❌ Absent: ${statusBreakdown.absent}`);
    console.log(`   ⚪ Other: ${statusBreakdown.other}`);
    console.log('');
    
    // Show recent students (last 5)
    const recentStudents = await StudentManagement.find({})
      .sort({ lastUpdated: -1 })
      .limit(5);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🕐 RECENTLY UPDATED STUDENTS (Last 5):');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    recentStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (${student.enrollmentNo})`);
      console.log(`   Status: ${student.status} | Running: ${student.isRunning}`);
      console.log(`   Last Updated: ${student.lastUpdated}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 TIMER BROADCAST INFO:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('The server broadcasts timer updates every 1 second for students');
    console.log('who have isRunning = true');
    console.log('');
    console.log('To start receiving timer broadcasts, a student must:');
    console.log('1. Log in to the app');
    console.log('2. Verify their face (biometric authentication)');
    console.log('3. The app will emit "start_timer" event to server');
    console.log('4. Server will set isRunning = true and start broadcasting');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkActiveStudents();
