const mongoose = require('mongoose');
// Try to use bcrypt, fallback to bcryptjs for deployment compatibility
// Use bcryptjs for deployment compatibility
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';

// Import schemas from server.js
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    enrollmentNo: { type: String, required: true, unique: true },
    studentId: { type: String, required: true, unique: true },
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    photoUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const teacherSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed
    department: { type: String, required: true },
    subject: { type: String, required: true },
    dob: { type: Date },
    phone: { type: String },
    photoUrl: { type: String, default: '' },
    semester: { type: String },
    canEditTimetable: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNo: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave'], required: true },
    lectures: [{
        period: String,
        subject: String,
        teacher: String,
        teacherName: String,
        room: String,
        startTime: String,
        endTime: String,
        lectureStartedAt: Date,
        lectureEndedAt: Date,
        studentCheckIn: Date,
        attended: Number,
        total: Number,
        percentage: Number,
        present: Boolean,
        verifications: [{
            time: Date,
            type: { type: String, enum: ['face', 'random_ring', 'manual'] },
            success: Boolean,
            event: String
        }]
    }],
    totalAttended: { type: Number, default: 0 },
    totalClassTime: { type: Number, default: 0 },
    dayPercentage: { type: Number, default: 0 },
    timerValue: { type: Number, default: 0 },
    checkInTime: Date,
    checkOutTime: Date,
    semester: String,
    branch: String,
    createdAt: { type: Date, default: Date.now }
});

const randomRingSchema = new mongoose.Schema({
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    type: { type: String, enum: ['all', 'selected'], default: 'all' },
    count: { type: Number, default: 1 },
    selectedStudents: [{
        studentId: String,
        name: String,
        enrollmentNo: String,
        notificationSent: { type: Boolean, default: false },
        notificationTime: Date,
        verified: { type: Boolean, default: false },
        verificationTime: Date,
        teacherActionTime: Date,
        verificationPhoto: String
    }],
    status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
    triggerTime: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Create models
const Student = mongoose.model('Student', studentSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
const RandomRing = mongoose.model('RandomRing', randomRingSchema);

async function cleanupDatabase() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB Atlas');
        console.log('📍 Database:', mongoose.connection.name);
        
        // 1. CRITICAL: Hash teacher passwords
        console.log('\n🔒 Step 1: Hashing teacher passwords...');
        await hashTeacherPasswords();
        
        // 2. Fix student data inconsistencies
        console.log('\n👤 Step 2: Fixing student data inconsistencies...');
        await fixStudentDataInconsistencies();
        
        // 3. Create proper student master records
        console.log('\n📚 Step 3: Creating student master records...');
        await createStudentMasterRecords();
        
        // 4. Remove duplicate attendance records
        console.log('\n🔄 Step 4: Removing duplicate attendance records...');
        await removeDuplicateAttendanceRecords();
        
        // 5. Fix random ring statuses
        console.log('\n🔔 Step 5: Fixing random ring statuses...');
        await fixRandomRingStatuses();
        
        // 6. Normalize date formats
        console.log('\n📅 Step 6: Normalizing date formats...');
        await normalizeDateFormats();
        
        // 7. Fix null values in critical fields
        console.log('\n🔧 Step 7: Fixing null values...');
        await fixNullValues();
        
        console.log('\n🎉 Database cleanup completed successfully!');
        
    } catch (error) {
        console.error('❌ Database cleanup failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

async function hashTeacherPasswords() {
    try {
        const teachers = await Teacher.find({});
        console.log(`   Found ${teachers.length} teachers to update`);
        
        for (const teacher of teachers) {
            // Check if password is already hashed (bcrypt hashes start with $2b$)
            if (!teacher.password.startsWith('$2b$')) {
                const hashedPassword = await bcrypt.hash(teacher.password, 10);
                await Teacher.updateOne(
                    { _id: teacher._id },
                    { 
                        password: hashedPassword,
                        updatedAt: new Date()
                    }
                );
                console.log(`   ✅ Hashed password for ${teacher.name}`);
            } else {
                console.log(`   ⏭️  Password already hashed for ${teacher.name}`);
            }
        }
        
    } catch (error) {
        console.error('   ❌ Error hashing passwords:', error);
        throw error;
    }
}

async function fixStudentDataInconsistencies() {
    try {
        // Find all attendance records with "adityasingh" enrollment
        const inconsistentRecords = await AttendanceRecord.find({
            enrollmentNo: "adityasingh"
        });
        
        console.log(`   Found ${inconsistentRecords.length} records with inconsistent enrollment`);
        
        // Update enrollment number to proper format
        const properEnrollmentNo = "0246CD241001"; // Based on other records
        const properStudentId = "6936b3e2a0a2892e8bb86ce3"; // Use ObjectId format
        
        await AttendanceRecord.updateMany(
            { enrollmentNo: "adityasingh" },
            { 
                enrollmentNo: properEnrollmentNo,
                studentId: properStudentId,
                updatedAt: new Date()
            }
        );
        
        // Also update attendance sessions
        const AttendanceSession = mongoose.model('AttendanceSession');
        await AttendanceSession.updateMany(
            { enrollmentNo: "adityasingh" },
            { 
                enrollmentNo: properEnrollmentNo,
                studentId: properStudentId,
                updatedAt: new Date()
            }
        );
        
        // Update random rings
        await RandomRing.updateMany(
            { "selectedStudents.enrollmentNo": "adityasingh" },
            { 
                $set: {
                    "selectedStudents.$.enrollmentNo": properEnrollmentNo,
                    "selectedStudents.$.studentId": properStudentId
                }
            }
        );
        
        console.log(`   ✅ Updated enrollment numbers from "adityasingh" to "${properEnrollmentNo}"`);
        
    } catch (error) {
        console.error('   ❌ Error fixing student data:', error);
        throw error;
    }
}

async function createStudentMasterRecords() {
    try {
        // Extract unique students from attendance records
        const attendanceRecords = await AttendanceRecord.find({});
        const uniqueStudents = new Map();
        
        for (const record of attendanceRecords) {
            const key = record.enrollmentNo;
            if (!uniqueStudents.has(key)) {
                uniqueStudents.set(key, {
                    name: record.studentName,
                    enrollmentNo: record.enrollmentNo,
                    studentId: record.studentId || record.enrollmentNo,
                    semester: record.semester || "3",
                    branch: record.branch || "B.Tech Data Science",
                    email: `${record.enrollmentNo.toLowerCase()}@student.global.org.in`,
                    phone: "",
                    isActive: true
                });
            }
        }
        
        console.log(`   Found ${uniqueStudents.size} unique students`);
        
        // Insert student records
        for (const [enrollmentNo, studentData] of uniqueStudents) {
            const existingStudent = await Student.findOne({ enrollmentNo });
            if (!existingStudent) {
                await Student.create(studentData);
                console.log(`   ✅ Created student record for ${studentData.name} (${enrollmentNo})`);
            } else {
                console.log(`   ⏭️  Student record already exists for ${enrollmentNo}`);
            }
        }
        
    } catch (error) {
        console.error('   ❌ Error creating student records:', error);
        throw error;
    }
}

async function removeDuplicateAttendanceRecords() {
    try {
        // Find duplicates by grouping on studentId + date
        const duplicates = await AttendanceRecord.aggregate([
            {
                $group: {
                    _id: {
                        studentId: "$studentId",
                        date: "$date"
                    },
                    count: { $sum: 1 },
                    docs: { $push: "$_id" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);
        
        console.log(`   Found ${duplicates.length} sets of duplicate records`);
        
        for (const duplicate of duplicates) {
            // Keep the latest record (last in array), remove others
            const toRemove = duplicate.docs.slice(0, -1);
            await AttendanceRecord.deleteMany({ _id: { $in: toRemove } });
            console.log(`   ✅ Removed ${toRemove.length} duplicate records for student ${duplicate._id.studentId}`);
        }
        
    } catch (error) {
        console.error('   ❌ Error removing duplicates:', error);
        throw error;
    }
}

async function fixRandomRingStatuses() {
    try {
        // Update verified random rings to completed status
        const result = await RandomRing.updateMany(
            { 
                "selectedStudents.verified": true,
                status: "pending"
            },
            { 
                status: "completed",
                updatedAt: new Date()
            }
        );
        
        console.log(`   ✅ Updated ${result.modifiedCount} random ring statuses to completed`);
        
    } catch (error) {
        console.error('   ❌ Error fixing random ring statuses:', error);
        throw error;
    }
}

async function normalizeDateFormats() {
    try {
        // Normalize all attendance record dates to midnight UTC
        const records = await AttendanceRecord.find({});
        
        for (const record of records) {
            const normalizedDate = new Date(record.date);
            normalizedDate.setUTCHours(0, 0, 0, 0);
            
            if (record.date.getTime() !== normalizedDate.getTime()) {
                await AttendanceRecord.updateOne(
                    { _id: record._id },
                    { date: normalizedDate }
                );
            }
        }
        
        console.log(`   ✅ Normalized date formats for ${records.length} attendance records`);
        
    } catch (error) {
        console.error('   ❌ Error normalizing dates:', error);
        throw error;
    }
}

async function fixNullValues() {
    try {
        // Fix null semester/branch in random rings
        const result = await RandomRing.updateMany(
            { 
                $or: [
                    { semester: null },
                    { branch: null }
                ]
            },
            { 
                semester: "3",
                branch: "B.Tech Data Science",
                updatedAt: new Date()
            }
        );
        
        console.log(`   ✅ Fixed null values in ${result.modifiedCount} random ring records`);
        
    } catch (error) {
        console.error('   ❌ Error fixing null values:', error);
        throw error;
    }
}

// Run the cleanup
cleanupDatabase();