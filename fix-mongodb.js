const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    fixDatabase();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

// Define schemas
const StudentManagementSchema = new mongoose.Schema({}, { strict: false });
const StudentManagement = mongoose.model('StudentManagement', StudentManagementSchema, 'studentmanagements');

const TimetableSchema = new mongoose.Schema({}, { strict: false });
const Timetable = mongoose.model('Timetable', TimetableSchema, 'timetables');

async function fixDatabase() {
    try {
        console.log('\n🔍 DIAGNOSING ISSUES...\n');
        
        // 1. Check students
        console.log('1️⃣ Checking students...');
        const students = await StudentManagement.find({});
        console.log(`   Found ${students.length} students`);
        
        if (students.length > 0) {
            console.log('\n   Student Details:');
            students.forEach(s => {
                console.log(`   - ${s.name} (${s.enrollmentNo})`);
                console.log(`     Semester: ${s.semester}, Course: ${s.course}`);
                console.log(`     isRunning: ${s.isRunning}, status: ${s.status}`);
                if (s.attendanceSession) {
                    console.log(`     Attended: ${s.attendanceSession.totalAttendedSeconds || 0} seconds`);
                }
            });
        }
        
        // 2. Check timetables
        console.log('\n2️⃣ Checking timetables...');
        const timetables = await Timetable.find({});
        console.log(`   Found ${timetables.length} timetables`);
        
        if (timetables.length > 0) {
            timetables.forEach(tt => {
                console.log(`\n   Timetable: ${tt.branch} Semester ${tt.semester}`);
                console.log(`   Days configured: ${Object.keys(tt.timetable || {}).join(', ')}`);
                
                // Check Saturday schedule (current day)
                if (tt.timetable && tt.timetable.saturday) {
                    console.log('\n   Saturday Schedule:');
                    tt.timetable.saturday.forEach((slot, i) => {
                        const period = tt.periods[i];
                        if (period && !slot.isBreak) {
                            console.log(`     Period ${i+1}: ${slot.subject || 'Empty'} (${period.startTime}-${period.endTime}) Room: ${slot.room || 'N/A'}`);
                        }
                    });
                }
            });
        }
        
        // 3. Check current time and find active lecture
        console.log('\n3️⃣ Checking current time and active lectures...');
        const now = new Date();
        const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        console.log(`   Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} minutes)`);
        console.log(`   Current day: ${currentDay}`);
        
        // Find active lectures for each timetable
        for (const tt of timetables) {
            if (tt.timetable && tt.timetable[currentDay]) {
                const schedule = tt.timetable[currentDay];
                console.log(`\n   Checking ${tt.branch} Semester ${tt.semester}:`);
                
                let foundActive = false;
                for (let i = 0; i < schedule.length; i++) {
                    const slot = schedule[i];
                    const period = tt.periods[i];
                    
                    if (period && !slot.isBreak && slot.subject) {
                        const [startH, startM] = period.startTime.split(':').map(Number);
                        const [endH, endM] = period.endTime.split(':').map(Number);
                        const startMinutes = startH * 60 + startM;
                        const endMinutes = endH * 60 + endM;
                        
                        if (currentTimeInMinutes >= startMinutes && currentTimeInMinutes <= endMinutes) {
                            console.log(`   ✅ ACTIVE LECTURE FOUND:`);
                            console.log(`      Subject: ${slot.subject}`);
                            console.log(`      Time: ${period.startTime}-${period.endTime}`);
                            console.log(`      Room: ${slot.room || 'N/A'}`);
                            foundActive = true;
                        }
                    }
                }
                
                if (!foundActive) {
                    console.log(`   ❌ NO ACTIVE LECTURE at current time`);
                }
            }
        }
        
        // 4. FIX ISSUES
        console.log('\n\n🔧 FIXING ISSUES...\n');
        
        // Fix 1: Reset all students to allow fresh start
        console.log('Fix 1: Resetting student states...');
        const resetResult = await StudentManagement.updateMany(
            {},
            {
                $set: {
                    isRunning: false,
                    status: 'absent',
                    'attendanceSession.isPaused': false,
                    'attendanceSession.pauseReason': null,
                    lastUpdated: new Date()
                }
            }
        );
        console.log(`   ✅ Reset ${resetResult.modifiedCount} students`);
        
        // Fix 2: Ensure timetables have correct structure
        console.log('\nFix 2: Validating timetable structure...');
        for (const tt of timetables) {
            let needsUpdate = false;
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            // Ensure all days exist
            if (!tt.timetable) {
                tt.timetable = {};
                needsUpdate = true;
            }
            
            days.forEach(day => {
                if (!tt.timetable[day]) {
                    tt.timetable[day] = [];
                    needsUpdate = true;
                }
            });
            
            if (needsUpdate) {
                await tt.save();
                console.log(`   ✅ Updated timetable for ${tt.branch} Semester ${tt.semester}`);
            }
        }
        
        // Fix 3: Create a test timetable if none exists for CSE Semester 1
        console.log('\nFix 3: Ensuring test timetable exists...');
        const testTimetable = await Timetable.findOne({ semester: '1', branch: 'CSE' });
        
        if (!testTimetable) {
            console.log('   Creating test timetable for CSE Semester 1...');
            
            const periods = [
                { number: 1, startTime: '08:00', endTime: '09:00' },
                { number: 2, startTime: '09:00', endTime: '10:00' },
                { number: 3, startTime: '10:00', endTime: '11:00' },
                { number: 4, startTime: '11:00', endTime: '12:00' },
                { number: 5, startTime: '12:00', endTime: '13:00' },
                { number: 6, startTime: '13:00', endTime: '14:00' },
                { number: 7, startTime: '14:00', endTime: '15:00' },
                { number: 8, startTime: '15:00', endTime: '16:00' }
            ];
            
            const createDaySchedule = () => [
                { period: 1, subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101', isBreak: false },
                { period: 2, subject: 'Physics', teacher: 'Dr. Johnson', room: 'Lab 1', isBreak: false },
                { period: 3, subject: 'Chemistry', teacher: 'Dr. Williams', room: 'Lab 2', isBreak: false },
                { period: 4, subject: 'English', teacher: 'Prof. Brown', room: 'Room 102', isBreak: false },
                { period: 5, subject: 'Lunch Break', teacher: '', room: '', isBreak: true },
                { period: 6, subject: 'Programming', teacher: 'Dr. Davis', room: 'Computer Lab', isBreak: false },
                { period: 7, subject: 'Engineering Drawing', teacher: 'Prof. Miller', room: 'Drawing Hall', isBreak: false },
                { period: 8, subject: 'Workshop', teacher: 'Mr. Wilson', room: 'Workshop', isBreak: false }
            ];
            
            const newTimetable = new Timetable({
                semester: '1',
                branch: 'CSE',
                periods: periods,
                timetable: {
                    sunday: createDaySchedule(),
                    monday: createDaySchedule(),
                    tuesday: createDaySchedule(),
                    wednesday: createDaySchedule(),
                    thursday: createDaySchedule(),
                    friday: createDaySchedule(),
                    saturday: createDaySchedule()
                },
                lastUpdated: new Date()
            });
            
            await newTimetable.save();
            console.log('   ✅ Created test timetable');
        } else {
            console.log('   ✅ Timetable already exists');
        }
        
        console.log('\n\n✅ DATABASE FIXES COMPLETE!\n');
        console.log('📋 Summary:');
        console.log(`   - Students reset: Ready for fresh timer start`);
        console.log(`   - Timetables validated: All days configured`);
        console.log(`   - Test data created: CSE Semester 1 timetable`);
        console.log('\n🎯 Next Steps:');
        console.log('   1. Restart the server (it will pick up the changes)');
        console.log('   2. Open the app and complete face verification');
        console.log('   3. Timer should start automatically');
        console.log('   4. Check logs for "▶️  Starting timer for [student]"');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error fixing database:', error);
        process.exit(1);
    }
}
