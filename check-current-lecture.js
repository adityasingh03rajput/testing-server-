require('dotenv').config();
const mongoose = require('mongoose');

// Timetable Schema
const timetableSchema = new mongoose.Schema({
    semester: String,
    branch: String,
    timetable: Object,
    periods: Array
});

const Timetable = mongoose.model('Timetable', timetableSchema);

// Helper function
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
        console.log(`⏰ Current Time (minutes): ${currentTime} (${Math.floor(currentTime/60)}:${currentTime%60})`);

        const timetable = await Timetable.findOne({ semester, branch });
        if (!timetable) {
            console.log(`❌ No timetable found for Semester ${semester}, Branch ${branch}`);
            return null;
        }

        console.log(`✅ Timetable found for Semester ${semester}, Branch ${branch}`);
        console.log(`📋 Available days:`, Object.keys(timetable.timetable));

        const daySchedule = timetable.timetable[currentDay];
        if (!daySchedule) {
            console.log(`❌ No schedule for ${currentDay}`);
            return null;
        }

        console.log(`\n📚 Schedule for ${currentDay}:`);
        for (let i = 0; i < daySchedule.length; i++) {
            const period = daySchedule[i];
            const periodInfo = timetable.periods[i];
            if (!periodInfo) continue;

            const periodStart = timeToMinutes(periodInfo.startTime);
            const periodEnd = timeToMinutes(periodInfo.endTime);

            const isActive = currentTime >= periodStart && currentTime <= periodEnd;
            const status = isActive ? '🟢 ACTIVE' : '⚪';

            console.log(`${status} Period ${i + 1}: ${period.subject || 'Break'}`);
            console.log(`   Time: ${periodInfo.startTime} - ${periodInfo.endTime}`);
            console.log(`   Teacher: ${period.teacher || 'N/A'}`);
            console.log(`   Room: ${period.room || 'N/A'}`);
            console.log(`   Is Break: ${period.isBreak ? 'Yes' : 'No'}`);

            if (currentTime >= periodStart && currentTime <= periodEnd && !period.isBreak) {
                const totalSeconds = (periodEnd - periodStart) * 60;
                const elapsedSeconds = (currentTime - periodStart) * 60;
                const remainingSeconds = (periodEnd - currentTime) * 60;
                
                console.log(`\n✅ CURRENT LECTURE FOUND:`);
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

async function main() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check for the student we saw in the database
        const lectureInfo = await getCurrentLectureInfo('1', 'CSE');

        if (lectureInfo) {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('📚 CURRENT LECTURE DETAILS:');
            console.log('═══════════════════════════════════════════════════════════');
            console.log(`Subject: ${lectureInfo.subject}`);
            console.log(`Teacher: ${lectureInfo.teacher}`);
            console.log(`Room: ${lectureInfo.room}`);
            console.log(`Period: ${lectureInfo.period}`);
            console.log(`Time: ${lectureInfo.startTime} - ${lectureInfo.endTime}`);
            console.log(`Total Duration: ${Math.floor(lectureInfo.totalSeconds / 60)} minutes`);
            console.log(`Elapsed: ${Math.floor(lectureInfo.elapsedSeconds / 60)} minutes`);
            console.log(`Remaining: ${Math.floor(lectureInfo.remainingSeconds / 60)} minutes`);
            console.log('═══════════════════════════════════════════════════════════');
        } else {
            console.log('\n⚠️  NO ACTIVE LECTURE RIGHT NOW');
            console.log('This is why the student\'s currentClass is undefined.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

main();
