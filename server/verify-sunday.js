/**
 * Verify Sunday Data in Database
 * Quick script to check if Sunday exists in timetables
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';

const timetableSchema = new mongoose.Schema({
    semester: String,
    branch: String,
    periods: Array,
    timetable: Object
});

const Timetable = mongoose.model('Timetable', timetableSchema);

async function verifySunday() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected\n');

        const timetables = await Timetable.find({});
        console.log(`📊 Found ${timetables.length} timetables\n`);

        timetables.forEach(tt => {
            console.log(`\n📅 ${tt.branch} Semester ${tt.semester}:`);
            console.log(`   Days in timetable:`, Object.keys(tt.timetable));
            
            if (tt.timetable.sunday) {
                console.log(`   ✅ Sunday exists with ${tt.timetable.sunday.length} periods`);
                if (tt.timetable.sunday.length > 0) {
                    const firstPeriod = tt.timetable.sunday[0];
                    console.log(`   First Sunday period:`, {
                        period: firstPeriod.period,
                        subject: firstPeriod.subject || '(empty)',
                        room: firstPeriod.room || '(empty)',
                        isBreak: firstPeriod.isBreak
                    });
                }
            } else {
                console.log(`   ❌ Sunday MISSING!`);
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifySunday();
