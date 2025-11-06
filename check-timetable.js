const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

mongoose.connect(MONGO_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    const timetableSchema = new mongoose.Schema({
        semester: String,
        branch: String,
        periods: Array,
        timetable: Object,
        lastUpdated: Date
    });

    const Timetable = mongoose.model('Timetable', timetableSchema);

    // Check current timetable
    const timetable = await Timetable.findOne({ semester: '1', branch: 'CSE' });

    console.log('\n📅 Current Timetable for CSE Semester 1:');
    console.log('Periods:', JSON.stringify(timetable.periods, null, 2));

    // Update all timetables to use 4:10 PM ending
    const correctPeriods = [
        { number: 1, startTime: '09:40', endTime: '10:40' },
        { number: 2, startTime: '10:40', endTime: '11:40' },
        { number: 3, startTime: '11:40', endTime: '12:10' },
        { number: 4, startTime: '12:10', endTime: '13:10' },
        { number: 5, startTime: '13:10', endTime: '14:10' },
        { number: 6, startTime: '14:10', endTime: '14:20' },
        { number: 7, startTime: '14:20', endTime: '15:30' },
        { number: 8, startTime: '15:30', endTime: '16:10' },
    ];

    console.log('\n🔄 Updating all timetables to end at 4:10 PM...');

    const result = await Timetable.updateMany(
        {},
        { $set: { periods: correctPeriods, lastUpdated: new Date() } }
    );

    console.log(`✅ Updated ${result.modifiedCount} timetables`);

    // Verify the update
    const updatedTimetable = await Timetable.findOne({ semester: '1', branch: 'CSE' });
    console.log('\n📅 Updated Timetable Periods:');
    console.log(JSON.stringify(updatedTimetable.periods, null, 2));

    console.log('\n✅ All timetables now end at 4:10 PM (16:10)');

    process.exit(0);
}).catch(err => {
    console.log('❌ MongoDB connection error:', err);
    process.exit(1);
});
