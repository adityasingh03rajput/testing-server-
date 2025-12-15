const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityasingh03rajput:Aditya%402004@cluster0.mongodb.net/attendance_app?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    checkData();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function checkData() {
    try {
        console.log('\n📊 CHECKING DATABASE DATA...\n');
        console.log('='.repeat(60));
        
        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📁 Total Collections: ${collections.length}\n`);
        
        for (const collection of collections) {
            const collectionName = collection.name;
            const count = await mongoose.connection.db.collection(collectionName).countDocuments();
            console.log(`   ${collectionName.padEnd(30)} ${count.toString().padStart(6)} documents`);
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Check specific collections
        console.log('\n🔍 DETAILED ANALYSIS:\n');
        
        // Students
        const studentsCount = await mongoose.connection.db.collection('studentmanagements').countDocuments();
        console.log(`👨‍🎓 Students: ${studentsCount}`);
        if (studentsCount > 0) {
            const sampleStudent = await mongoose.connection.db.collection('studentmanagements').findOne();
            console.log(`   Sample: ${sampleStudent.name} (${sampleStudent.enrollmentNo})`);
            console.log(`   Course: ${sampleStudent.course}, Semester: ${sampleStudent.semester}`);
        }
        
        // Teachers
        const teachersCount = await mongoose.connection.db.collection('teachers').countDocuments();
        console.log(`\n👨‍🏫 Teachers: ${teachersCount}`);
        if (teachersCount > 0) {
            const sampleTeacher = await mongoose.connection.db.collection('teachers').findOne();
            console.log(`   Sample: ${sampleTeacher.name} (${sampleTeacher.employeeId})`);
            console.log(`   Department: ${sampleTeacher.department}`);
        }
        
        // Attendance Records (OLD)
        const oldAttendanceCount = await mongoose.connection.db.collection('attendancerecords').countDocuments();
        console.log(`\n📊 Attendance Records (OLD): ${oldAttendanceCount}`);
        if (oldAttendanceCount > 0) {
            const sampleRecord = await mongoose.connection.db.collection('attendancerecords').findOne();
            console.log(`   Sample: ${sampleRecord.studentName}`);
            console.log(`   Date: ${new Date(sampleRecord.date).toDateString()}`);
            console.log(`   Status: ${sampleRecord.status}`);
            if (sampleRecord.lectures && sampleRecord.lectures.length > 0) {
                console.log(`   Lectures: ${sampleRecord.lectures.length}`);
                console.log(`   Has detailed tracking: ${sampleRecord.lectures[0].verifications ? 'YES ✅' : 'NO ❌'}`);
            }
        }
        
        // Attendance Sessions (NEW)
        const sessionsCount = await mongoose.connection.db.collection('attendancesessions').countDocuments();
        console.log(`\n⏱️  Attendance Sessions (NEW): ${sessionsCount}`);
        if (sessionsCount > 0) {
            const sampleSession = await mongoose.connection.db.collection('attendancesessions').findOne();
            console.log(`   Sample: ${sampleSession.studentName}`);
            console.log(`   Date: ${new Date(sampleSession.date).toDateString()}`);
            console.log(`   Timer: ${sampleSession.timerValue}s`);
            console.log(`   Active: ${sampleSession.isActive ? 'YES' : 'NO'}`);
        }
        
        // Check date range of attendance data
        if (oldAttendanceCount > 0) {
            const oldestRecord = await mongoose.connection.db.collection('attendancerecords')
                .find()
                .sort({ date: 1 })
                .limit(1)
                .toArray();
            
            const newestRecord = await mongoose.connection.db.collection('attendancerecords')
                .find()
                .sort({ date: -1 })
                .limit(1)
                .toArray();
            
            if (oldestRecord.length > 0 && newestRecord.length > 0) {
                console.log(`\n📅 Attendance Date Range:`);
                console.log(`   Oldest: ${new Date(oldestRecord[0].date).toDateString()}`);
                console.log(`   Newest: ${new Date(newestRecord[0].date).toDateString()}`);
                
                const daysDiff = Math.floor((new Date(newestRecord[0].date) - new Date(oldestRecord[0].date)) / (1000 * 60 * 60 * 24));
                console.log(`   Span: ${daysDiff} days`);
            }
        }
        
        // Check for new schema format
        if (oldAttendanceCount > 0) {
            const recordsWithNewFormat = await mongoose.connection.db.collection('attendancerecords')
                .countDocuments({
                    'lectures.verifications': { $exists: true }
                });
            
            const recordsWithSeconds = await mongoose.connection.db.collection('attendancerecords')
                .countDocuments({
                    'lectures.attended': { $gt: 100 }  // If > 100, likely in seconds not minutes
                });
            
            console.log(`\n🔬 Schema Analysis:`);
            console.log(`   Records with verifications: ${recordsWithNewFormat} / ${oldAttendanceCount}`);
            console.log(`   Records with seconds format: ${recordsWithSeconds} / ${oldAttendanceCount}`);
            console.log(`   New schema adoption: ${Math.round((recordsWithNewFormat / oldAttendanceCount) * 100)}%`);
        }
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('\n📋 SUMMARY:\n');
        
        if (studentsCount === 0) {
            console.log('   ⚠️  No students found - Need to add students first');
        } else {
            console.log(`   ✅ ${studentsCount} students ready`);
        }
        
        if (teachersCount === 0) {
            console.log('   ⚠️  No teachers found - Need to add teachers first');
        } else {
            console.log(`   ✅ ${teachersCount} teachers ready`);
        }
        
        if (oldAttendanceCount === 0) {
            console.log('   ℹ️  No attendance data - Database is clean for seeding');
        } else {
            console.log(`   ℹ️  ${oldAttendanceCount} existing attendance records`);
            console.log('   ⚠️  Running seed will DELETE existing attendance data');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ Database check complete!\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error checking data:', error);
        process.exit(1);
    }
}
