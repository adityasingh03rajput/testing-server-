require('dotenv').config();
const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    semester: String,
    branch: String,
    timetable: Object,
    periods: Array
});

const studentSchema = new mongoose.Schema({
    name: String,
    enrollmentNo: String,
    semester: String,
    course: String,
    isRunning: Boolean,
    status: String,
    currentClass: Object,
    attendanceSession: Object,
    lastUpdated: Date
});

const Timetable = mongoose.model('Timetable', timetableSchema);
const StudentManagement = mongoose.model('StudentManagement', studentSchema, 'studentmanagements');

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

async function getCurrentLectureInfo(semester, branch) {
    try {
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        console.log(`\n🕐 Current Time: ${now.toLocaleString()}`);
        console.log(`📅 Current Day: ${currentDay}`);
        console.log(`⏰ Current Time (minutes): ${currentTime} (${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2, '0')})`);

        const timetable = await Timetable.findOne({ semester, branch });
        if (!timetable) {
            console.log(`❌ No timetable found for Semester ${semester}, Branch ${branch}`);
            return null;
        }

        const daySchedule = timetable.timetable[currentDay];
        if (!daySchedule) {
            console.log(`❌ No schedule for ${currentDay}`);
            return null;
        }

        for (let i = 0; i < daySchedule.length; i++) {
            const period = daySchedule[i];
            const periodInfo = timetable.periods[i];
            if (!periodInfo) continue;

            const periodStart = timeToMinutes(periodInfo.startTime);
            const periodEnd = timeToMinutes(periodInfo.endTime);

            if (currentTime >= periodStart && currentTime <= periodEnd && !period.isBreak) {
                const totalSeconds = (periodEnd - periodStart) * 60;
                const elapsedSeconds = (currentTime - periodStart) * 60;
                const remainingSeconds = (periodEnd - currentTime) * 60;
                
                return {
                    subject: period.subject,
                    teacher: period.teacher,
                    room: period.room,
                    period: i + 1,
                    startTime: periodInfo.startTime,
                    endTime: periodInfo.endTime,
                    totalSeconds,
                    elapsedSeconds,
                    remainingSeconds,
                    periodStart,
                    periodEnd
                };
            }
        }
        
        console.log(`\n❌ No active lecture at current time`);
        return null;
    } catch (error) {
        console.error('❌ Error getting lecture info:', error);
        return null;
    }
}

async function testStartTimer() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the student
        const student = await StudentManagement.findOne({ enrollmentNo: '0246CS241001' });
        
        if (!student) {
            console.log('❌ Student not found');
            return;
        }

        console.log('✅ Found student:', student.name);
        console.log('   Semester:', student.semester);
        console.log('   Course:', student.course);
        console.log('   Current Status:', student.status);
        console.log('   Is Running:', student.isRunning);

        // Check if there's an active lecture
        const lectureInfo = await getCurrentLectureInfo(student.semester, student.course);
        
        if (!lectureInfo) {
            console.log('\n❌ CANNOT START TIMER: No active lecture right now');
            console.log('   The student needs to wait for a lecture to start');
            return;
        }

        console.log('\n✅ ACTIVE LECTURE FOUND:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Subject: ${lectureInfo.subject}`);
        console.log(`Teacher: ${lectureInfo.teacher || 'Not specified'}`);
        console.log(`Room: ${lectureInfo.room || 'Not specified'}`);
        console.log(`Period: ${lectureInfo.period}`);
        console.log(`Time: ${lectureInfo.startTime} - ${lectureInfo.endTime}`);
        console.log(`Total Duration: ${Math.floor(lectureInfo.totalSeconds / 60)} minutes`);
        console.log(`Elapsed: ${Math.floor(lectureInfo.elapsedSeconds / 60)} minutes`);
        console.log(`Remaining: ${Math.floor(lectureInfo.remainingSeconds / 60)} minutes`);
        console.log('═══════════════════════════════════════════════════════════');

        // Simulate starting the timer
        const now = Date.now();
        const updateData = {
            isRunning: true,
            status: 'attending',
            currentClass: {
                subject: lectureInfo.subject,
                teacher: lectureInfo.teacher,
                room: lectureInfo.room,
                period: lectureInfo.period,
                startTime: lectureInfo.startTime,
                endTime: lectureInfo.endTime,
                totalDurationSeconds: lectureInfo.totalSeconds,
                startTimestamp: new Date(now)
            },
            attendanceSession: {
                sessionStartTime: new Date(now),
                totalAttendedSeconds: 0,
                lastPauseTime: null,
                pausedDuration: 0,
                isPaused: false,
                pauseReason: null
            },
            lastUpdated: new Date()
        };

        console.log('\n🔄 Updating student record...');
        await StudentManagement.findByIdAndUpdate(student._id, updateData);
        console.log('✅ Timer started successfully!');

        // Verify the update
        const updatedStudent = await StudentManagement.findById(student._id);
        console.log('\n📊 Updated Student Record:');
        console.log('   Is Running:', updatedStudent.isRunning);
        console.log('   Status:', updatedStudent.status);
        console.log('   Current Class:', updatedStudent.currentClass?.subject);
        console.log('   Session Start:', updatedStudent.attendanceSession?.sessionStartTime);
        console.log('   Attended Seconds:', updatedStudent.attendanceSession?.totalAttendedSeconds);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

testStartTimer();
