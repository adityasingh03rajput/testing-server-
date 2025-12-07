require('dotenv').config();
const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    semester: String,
    branch: String,
    timetable: Object,
    periods: Array
});

const Timetable = mongoose.model('Timetable', timetableSchema);

async function main() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const timetable = await Timetable.findOne({ semester: '1', branch: 'CSE' });
        
        if (!timetable) {
            console.log('❌ No timetable found');
            return;
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 TIMETABLE DATA STRUCTURE');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('📅 Sunday Schedule:');
        const sunday = timetable.timetable.sunday;
        sunday.forEach((period, index) => {
            console.log(`\nPeriod ${index + 1}:`);
            console.log(JSON.stringify(period, null, 2));
        });

        console.log('\n\n⏰ Period Times:');
        timetable.periods.forEach((period, index) => {
            console.log(`Period ${index + 1}: ${period.startTime} - ${period.endTime}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

main();
