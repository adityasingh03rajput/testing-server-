// Script to standardize field names across all collections
const mongoose = require('mongoose');
require('dotenv').config();

async function fixFieldNames() {
    try {
        console.log('🔧 Starting field name standardization...\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        
        // 1. Check current field usage
        console.log('📊 CURRENT FIELD USAGE:\n');
        
        const student = await db.collection('studentmanagements').findOne();
        console.log('Student Collection Fields:');
        console.log('  - enrollmentNo:', student.enrollmentNo ? '✅' : '❌');
        console.log('  - enrollmentNumber:', student.enrollmentNumber ? '✅' : '❌');
        console.log('  - course:', student.course ? '✅' : '❌');
        console.log('  - branch:', student.branch ? '✅' : '❌');
        console.log('');
        
        const record = await db.collection('attendancerecords').findOne();
        if (record) {
            console.log('Attendance Records Fields:');
            console.log('  - enrollmentNo:', record.enrollmentNo ? '✅' : '❌');
            console.log('  - enrollmentNumber:', record.enrollmentNumber ? '✅' : '❌');
            console.log('  - branch:', record.branch ? '✅' : '❌');
            console.log('  - course:', record.course ? '✅' : '❌');
            console.log('');
        }
        
        const session = await db.collection('attendancesessions').findOne();
        if (session) {
            console.log('Attendance Sessions Fields:');
            console.log('  - enrollmentNo:', session.enrollmentNo ? '✅' : '❌');
            console.log('  - enrollmentNumber:', session.enrollmentNumber ? '✅' : '❌');
            console.log('  - branch:', session.branch ? '✅' : '❌');
            console.log('  - course:', session.course ? '✅' : '❌');
            console.log('');
        }
        
        // 2. Standardization Plan
        console.log('📋 STANDARDIZATION PLAN:\n');
        console.log('Standard Field Names:');
        console.log('  ✅ enrollmentNo (primary - used in studentmanagements)');
        console.log('  ✅ course (primary - used in studentmanagements)');
        console.log('');
        console.log('Fields to Add/Update:');
        console.log('  1. Add "enrollmentNo" to all attendance collections');
        console.log('  2. Keep "enrollmentNumber" for backward compatibility');
        console.log('  3. Add "course" field where missing');
        console.log('  4. Keep "branch" for backward compatibility');
        console.log('');
        
        // 3. Fix Attendance Records
        console.log('🔧 Fixing attendancerecords collection...');
        const recordsToFix = await db.collection('attendancerecords').find({
            enrollmentNo: { $exists: false }
        }).toArray();
        
        if (recordsToFix.length > 0) {
            for (const rec of recordsToFix) {
                await db.collection('attendancerecords').updateOne(
                    { _id: rec._id },
                    { 
                        $set: { 
                            enrollmentNo: rec.enrollmentNumber,
                            course: rec.branch
                        } 
                    }
                );
            }
            console.log(`  ✅ Fixed ${recordsToFix.length} records`);
        } else {
            console.log('  ✅ All records already have enrollmentNo');
        }
        
        // 4. Fix Attendance Sessions
        console.log('🔧 Fixing attendancesessions collection...');
        const sessionsToFix = await db.collection('attendancesessions').find({
            enrollmentNo: { $exists: false }
        }).toArray();
        
        if (sessionsToFix.length > 0) {
            for (const sess of sessionsToFix) {
                await db.collection('attendancesessions').updateOne(
                    { _id: sess._id },
                    { 
                        $set: { 
                            enrollmentNo: sess.enrollmentNumber,
                            course: sess.branch
                        } 
                    }
                );
            }
            console.log(`  ✅ Fixed ${sessionsToFix.length} sessions`);
        } else {
            console.log('  ✅ All sessions already have enrollmentNo');
        }
        
        // 5. Create indexes for better performance
        console.log('\n📇 Creating indexes...');
        
        await db.collection('attendancerecords').createIndex({ enrollmentNo: 1 });
        await db.collection('attendancerecords').createIndex({ enrollmentNumber: 1 });
        await db.collection('attendancesessions').createIndex({ enrollmentNo: 1 });
        await db.collection('attendancesessions').createIndex({ enrollmentNumber: 1 });
        
        console.log('  ✅ Indexes created');
        
        // 6. Verification
        console.log('\n✅ VERIFICATION:\n');
        
        const recordCheck = await db.collection('attendancerecords').findOne();
        if (recordCheck) {
            console.log('Attendance Record Sample:');
            console.log(`  enrollmentNo: ${recordCheck.enrollmentNo}`);
            console.log(`  enrollmentNumber: ${recordCheck.enrollmentNumber}`);
            console.log(`  course: ${recordCheck.course}`);
            console.log(`  branch: ${recordCheck.branch}`);
        }
        
        console.log('\n═'.repeat(80));
        console.log('✅ FIELD NAME STANDARDIZATION COMPLETE!');
        console.log('═'.repeat(80));
        console.log('\nStandard Fields to Use:');
        console.log('  - enrollmentNo (primary)');
        console.log('  - course (primary)');
        console.log('\nBackward Compatible Fields (still available):');
        console.log('  - enrollmentNumber');
        console.log('  - branch');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

fixFieldNames();
