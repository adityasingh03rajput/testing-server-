require('dotenv').config();
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({}, { strict: false });
const StudentManagement = mongoose.model('StudentManagement', studentSchema, 'studentmanagements');

async function main() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const student = await StudentManagement.findOne({ enrollmentNo: '0246CS241001' });
        
        if (!student) {
            console.log('❌ Student not found');
            return;
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 ATTENDANCE SESSION DEBUG');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        console.log('Student:', student.name);
        console.log('Is Running:', student.isRunning);
        console.log('Status:', student.status);
        console.log('\n📦 attendanceSession object:');
        console.log(JSON.stringify(student.attendanceSession, null, 2));
        
        console.log('\n🔍 Detailed Analysis:');
        if (student.attendanceSession) {
            const session = student.attendanceSession;
            console.log('  sessionStartTime:', session.sessionStartTime);
            console.log('  sessionStartTime type:', typeof session.sessionStartTime);
            console.log('  totalAttendedSeconds:', session.totalAttendedSeconds);
            console.log('  isPaused:', session.isPaused);
            console.log('  lastPauseTime:', session.lastPauseTime);
            console.log('  pausedDuration:', session.pausedDuration);
            
            if (session.sessionStartTime) {
                const now = Date.now();
                const startTime = new Date(session.sessionStartTime).getTime();
                const elapsed = Math.floor((now - startTime) / 1000);
                console.log('\n⏱️  Time Calculation:');
                console.log('  Now:', new Date(now).toLocaleString());
                console.log('  Start:', new Date(startTime).toLocaleString());
                console.log('  Elapsed seconds:', elapsed);
                console.log('  Elapsed minutes:', Math.floor(elapsed / 60));
                console.log('  Expected attended time:', elapsed, 'seconds');
            }
        } else {
            console.log('  ❌ attendanceSession is null/undefined!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

main();
