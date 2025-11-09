/**
 * Test Script: Verify Sunday Support
 * 
 * This script tests that Sunday support is working correctly in the database.
 * 
 * Usage:
 *   node server/test-sunday-support.js
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const mongoose = require('mongoose');

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';

// Timetable Schema (with Sunday)
const timetableSchema = new mongoose.Schema({
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    periods: [{
        number: Number,
        startTime: String,
        endTime: String
    }],
    timetable: {
        sunday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        monday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        tuesday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        wednesday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        thursday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        friday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        saturday: [{ period: Number, subject: String, room: String, isBreak: Boolean }]
    },
    lastUpdated: { type: Date, default: Date.now }
});

const Timetable = mongoose.model('Timetable', timetableSchema);

async function testSundaySupport() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');
        console.log('📍 Database:', mongoose.connection.name);

        console.log('\n📊 Sunday Support Test Results:\n');

        // Test 1: Check if schema includes Sunday
        console.log('1️⃣  Schema Test:');
        const schemaKeys = Object.keys(timetableSchema.paths.timetable.schema.paths);
        const hasSundayInSchema = schemaKeys.includes('sunday');
        console.log(`   ${hasSundayInSchema ? '✅' : '❌'} Schema includes Sunday field: ${hasSundayInSchema}`);

        // Test 2: Count timetables with Sunday
        console.log('\n2️⃣  Database Test:');
        const totalTimetables = await Timetable.countDocuments({});
        const timetablesWithSunday = await Timetable.countDocuments({
            'timetable.sunday': { $exists: true }
        });
        const timetablesWithoutSunday = await Timetable.countDocuments({
            'timetable.sunday': { $exists: false }
        });

        console.log(`   📊 Total timetables: ${totalTimetables}`);
        console.log(`   ${timetablesWithSunday > 0 ? '✅' : '⚠️ '} Timetables with Sunday: ${timetablesWithSunday}`);
        console.log(`   ${timetablesWithoutSunday === 0 ? '✅' : '❌'} Timetables without Sunday: ${timetablesWithoutSunday}`);

        // Test 3: Check Sunday data structure
        if (timetablesWithSunday > 0) {
            console.log('\n3️⃣  Data Structure Test:');
            const sampleTimetable = await Timetable.findOne({ 'timetable.sunday': { $exists: true } });
            
            if (sampleTimetable) {
                const sundaySchedule = sampleTimetable.timetable.sunday;
                const hasSundayArray = Array.isArray(sundaySchedule);
                const sundayPeriodCount = sundaySchedule ? sundaySchedule.length : 0;
                
                console.log(`   ✅ Sample: ${sampleTimetable.branch} Semester ${sampleTimetable.semester}`);
                console.log(`   ${hasSundayArray ? '✅' : '❌'} Sunday is an array: ${hasSundayArray}`);
                console.log(`   ✅ Sunday periods: ${sundayPeriodCount}`);
                
                if (sundayPeriodCount > 0) {
                    const firstPeriod = sundaySchedule[0];
                    console.log(`   ✅ First period structure:`, {
                        period: firstPeriod.period,
                        subject: firstPeriod.subject || '(empty)',
                        room: firstPeriod.room || '(empty)',
                        isBreak: firstPeriod.isBreak
                    });
                }
            }
        }

        // Test 4: Check day order
        console.log('\n4️⃣  Day Order Test:');
        const sampleTimetable = await Timetable.findOne({});
        if (sampleTimetable) {
            const dayKeys = Object.keys(sampleTimetable.timetable.toObject());
            const expectedOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const hasCorrectOrder = dayKeys.length === 7 && dayKeys[0] === 'sunday';
            
            console.log(`   ${hasCorrectOrder ? '✅' : '❌'} Days in correct order: ${dayKeys.join(', ')}`);
            console.log(`   ${dayKeys.includes('sunday') ? '✅' : '❌'} Sunday is present`);
        }

        // Test 5: Check if Sunday has classes
        console.log('\n5️⃣  Sunday Classes Test:');
        const timetablesWithSundayClasses = await Timetable.countDocuments({
            'timetable.sunday': { 
                $exists: true,
                $not: { $size: 0 }
            },
            'timetable.sunday.subject': { $ne: '' }
        });
        
        console.log(`   📊 Timetables with Sunday classes: ${timetablesWithSundayClasses}`);
        if (timetablesWithSundayClasses > 0) {
            console.log(`   ✅ Some timetables have Sunday classes scheduled`);
        } else {
            console.log(`   ℹ️  No Sunday classes scheduled yet (this is normal for new installations)`);
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY:');
        console.log('='.repeat(60));
        
        const allTestsPassed = 
            hasSundayInSchema &&
            timetablesWithoutSunday === 0 &&
            timetablesWithSunday > 0;

        if (allTestsPassed) {
            console.log('✅ All tests passed! Sunday support is working correctly.');
            console.log('');
            console.log('Next steps:');
            console.log('  1. Use admin panel to add Sunday schedules to timetables');
            console.log('  2. Test mobile app on Sunday to verify timetable displays');
            console.log('  3. Test attendance tracking on Sunday');
        } else {
            console.log('⚠️  Some tests failed. Please review the results above.');
            console.log('');
            if (timetablesWithoutSunday > 0) {
                console.log('Action required:');
                console.log('  Run migration script: node server/migrate-add-sunday.js');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
console.log('🧪 Testing Sunday Support\n');
testSundaySupport();
