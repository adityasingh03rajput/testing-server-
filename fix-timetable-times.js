const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    fixTimetableTimes();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

const TimetableSchema = new mongoose.Schema({}, { strict: false });
const Timetable = mongoose.model('Timetable', TimetableSchema, 'timetables');

async function fixTimetableTimes() {
    try {
        console.log('\n🔧 FIXING TIMETABLE TIMES...\n');
        
        // Get CSE Semester 1 timetable
        const timetable = await Timetable.findOne({ semester: '1', branch: 'CSE' });
        
        if (!timetable) {
            console.log('❌ Timetable not found');
            process.exit(1);
        }
        
        console.log('Found timetable for CSE Semester 1');
        console.log('Current periods:', timetable.periods.length);
        
        // Fix the periods - remove the invalid "00:00-09:00" period and fix times
        const correctPeriods = [
            { number: 1, startTime: '08:00', endTime: '09:00' },
            { number: 2, startTime: '09:00', endTime: '10:00' },
            { number: 3, startTime: '10:00', endTime: '11:00' },
            { number: 4, startTime: '11:00', endTime: '12:00' },
            { number: 5, startTime: '12:00', endTime: '13:00' },  // Lunch
            { number: 6, startTime: '13:00', endTime: '14:00' },
            { number: 7, startTime: '14:00', endTime: '15:00' },
            { number: 8, startTime: '15:00', endTime: '16:00' }
        ];
        
        // Fix schedule for all days
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        days.forEach(day => {
            if (timetable.timetable[day]) {
                // Keep only 8 periods, remove the 9th invalid one
                timetable.timetable[day] = timetable.timetable[day].slice(0, 8);
                
                // Ensure we have exactly 8 periods
                while (timetable.timetable[day].length < 8) {
                    timetable.timetable[day].push({
                        period: timetable.timetable[day].length + 1,
                        subject: '',
                        teacher: '',
                        room: '',
                        isBreak: false
                    });
                }
                
                // Update period numbers
                timetable.timetable[day].forEach((slot, i) => {
                    slot.period = i + 1;
                });
            }
        });
        
        // Update periods
        timetable.periods = correctPeriods;
        timetable.lastUpdated = new Date();
        
        await timetable.save();
        
        console.log('\n✅ TIMETABLE FIXED!');
        console.log('\nNew periods:');
        correctPeriods.forEach(p => {
            console.log(`   Period ${p.number}: ${p.startTime} - ${p.endTime}`);
        });
        
        console.log('\n📋 Saturday Schedule (CSE Semester 1):');
        timetable.timetable.saturday.forEach((slot, i) => {
            const period = correctPeriods[i];
            console.log(`   ${period.startTime}-${period.endTime}: ${slot.subject || 'Empty'} ${slot.isBreak ? '(Break)' : ''}`);
        });
        
        // Check current time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        console.log(`\n⏰ Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} minutes)`);
        
        // Find active lecture
        let foundActive = false;
        timetable.timetable.saturday.forEach((slot, i) => {
            const period = correctPeriods[i];
            if (period) {
                const [startH, startM] = period.startTime.split(':').map(Number);
                const [endH, endM] = period.endTime.split(':').map(Number);
                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;
                
                if (currentTimeInMinutes >= startMinutes && currentTimeInMinutes <= endMinutes) {
                    console.log(`\n✅ ACTIVE LECTURE NOW:`);
                    console.log(`   Subject: ${slot.subject || 'Empty'}`);
                    console.log(`   Time: ${period.startTime}-${period.endTime}`);
                    console.log(`   Room: ${slot.room || 'N/A'}`);
                    foundActive = true;
                }
            }
        });
        
        if (!foundActive) {
            console.log(`\n❌ NO ACTIVE LECTURE at current time`);
            console.log('   (This is normal if current time is outside class hours)');
        }
        
        console.log('\n🎯 Next Steps:');
        console.log('   1. Server will automatically pick up these changes');
        console.log('   2. Open the app and complete face verification');
        console.log('   3. Timer should start if there\'s an active lecture');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
