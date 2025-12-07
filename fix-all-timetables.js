const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    fixAllTimetables();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

const TimetableSchema = new mongoose.Schema({}, { strict: false });
const Timetable = mongoose.model('Timetable', TimetableSchema, 'timetables');

async function fixAllTimetables() {
    try {
        console.log('\n🔧 FIXING ALL TIMETABLES...\n');
        
        const timetables = await Timetable.find({});
        console.log(`Found ${timetables.length} timetables\n`);
        
        const correctPeriods = [
            { number: 1, startTime: '08:00', endTime: '09:00' },
            { number: 2, startTime: '09:00', endTime: '10:00' },
            { number: 3, startTime: '10:00', endTime: '11:00' },
            { number: 4, startTime: '11:00', endTime: '12:00' },
            { number: 5, startTime: '12:00', endTime: '13:00' },
            { number: 6, startTime: '13:00', endTime: '14:00' },
            { number: 7, startTime: '14:00', endTime: '15:00' },
            { number: 8, startTime: '15:00', endTime: '16:00' }
        ];
        
        for (const tt of timetables) {
            console.log(`Fixing: ${tt.branch} Semester ${tt.semester}`);
            
            // Fix periods
            tt.periods = correctPeriods;
            
            // Fix schedule for all days
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            days.forEach(day => {
                if (tt.timetable[day]) {
                    // Keep only 8 periods
                    tt.timetable[day] = tt.timetable[day].slice(0, 8);
                    
                    // Ensure we have exactly 8 periods
                    while (tt.timetable[day].length < 8) {
                        tt.timetable[day].push({
                            period: tt.timetable[day].length + 1,
                            subject: '',
                            teacher: '',
                            room: '',
                            isBreak: false
                        });
                    }
                    
                    // Update period numbers
                    tt.timetable[day].forEach((slot, i) => {
                        slot.period = i + 1;
                    });
                }
            });
            
            tt.lastUpdated = new Date();
            await tt.save();
            console.log(`   ✅ Fixed`);
        }
        
        console.log('\n✅ ALL TIMETABLES FIXED!');
        console.log('\n📋 Standard periods now:');
        correctPeriods.forEach(p => {
            console.log(`   Period ${p.number}: ${p.startTime} - ${p.endTime}`);
        });
        
        console.log('\n🎯 All timetables now use correct 8-period format (08:00-16:00)');
        console.log('   Server will automatically use these updated timetables');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
