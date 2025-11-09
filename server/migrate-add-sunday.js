/**
 * Migration Script: Add Sunday Support to Existing Timetables
 * 
 * This script adds empty Sunday arrays to all existing timetables in the database
 * that don't already have Sunday data.
 * 
 * Usage:
 *   node server/migrate-add-sunday.js
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

async function migrateSundaySupport() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');
        console.log('📍 Database:', mongoose.connection.name);

        // Find all timetables without Sunday
        console.log('\n🔍 Checking for timetables without Sunday...');
        const timetablesWithoutSunday = await Timetable.find({
            'timetable.sunday': { $exists: false }
        });

        console.log(`📊 Found ${timetablesWithoutSunday.length} timetables without Sunday`);

        if (timetablesWithoutSunday.length === 0) {
            console.log('✅ All timetables already have Sunday support!');
            process.exit(0);
        }

        console.log('\n🔧 Adding Sunday to timetables...');
        let successCount = 0;
        let errorCount = 0;

        for (const timetable of timetablesWithoutSunday) {
            try {
                // Create empty Sunday array with same structure as other days
                const sundaySchedule = [];
                
                // If timetable has periods defined, create empty slots for each period
                if (timetable.periods && timetable.periods.length > 0) {
                    for (let i = 0; i < timetable.periods.length; i++) {
                        sundaySchedule.push({
                            period: i + 1,
                            subject: '',
                            room: '',
                            isBreak: false
                        });
                    }
                } else {
                    // Fallback: use Monday's structure if periods not defined
                    const mondaySchedule = timetable.timetable.monday || [];
                    for (let i = 0; i < mondaySchedule.length; i++) {
                        sundaySchedule.push({
                            period: i + 1,
                            subject: '',
                            room: '',
                            isBreak: false
                        });
                    }
                }

                // Add Sunday to timetable
                timetable.timetable.sunday = sundaySchedule;
                timetable.lastUpdated = new Date();
                await timetable.save();

                successCount++;
                console.log(`  ✅ ${timetable.branch} Semester ${timetable.semester} - Added ${sundaySchedule.length} Sunday periods`);
            } catch (error) {
                errorCount++;
                console.error(`  ❌ ${timetable.branch} Semester ${timetable.semester} - Error:`, error.message);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`  ✅ Success: ${successCount} timetables`);
        console.log(`  ❌ Errors: ${errorCount} timetables`);
        console.log(`  📈 Total: ${timetablesWithoutSunday.length} timetables processed`);

        // Verify migration
        console.log('\n🔍 Verifying migration...');
        const remainingWithoutSunday = await Timetable.countDocuments({
            'timetable.sunday': { $exists: false }
        });
        const totalWithSunday = await Timetable.countDocuments({
            'timetable.sunday': { $exists: true }
        });

        console.log(`  📊 Timetables with Sunday: ${totalWithSunday}`);
        console.log(`  📊 Timetables without Sunday: ${remainingWithoutSunday}`);

        if (remainingWithoutSunday === 0) {
            console.log('\n✅ Migration completed successfully! All timetables now have Sunday support.');
        } else {
            console.log('\n⚠️  Migration completed with some timetables still missing Sunday.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
console.log('🚀 Starting Sunday Support Migration\n');
migrateSundaySupport();
