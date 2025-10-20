const mongoose = require('mongoose');

// MongoDB Connection
const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

// Attendance Record Schema
const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNumber: String,
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    timerValue: { type: Number, default: 0 },
    checkInTime: Date,
    checkOutTime: Date,
    semester: String,
    branch: String,
    createdAt: { type: Date, default: Date.now }
});

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

// Function to generate random attendance for last 30 days
async function seedAttendance(studentId, studentName, enrollmentNo, semester, branch) {
    console.log(`\n📊 Seeding attendance for ${studentName}...`);
    
    const records = [];
    const today = new Date();
    
    // Generate records for last 30 days
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        // Skip weekends (optional)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        // Random status (80% present, 20% absent)
        const status = Math.random() > 0.2 ? 'present' : 'absent';
        const timerValue = status === 'present' ? 0 : Math.floor(Math.random() * 120);
        
        const record = {
            studentId,
            studentName,
            enrollmentNumber: enrollmentNo,
            date,
            status,
            timerValue,
            checkInTime: new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
            checkOutTime: status === 'present' ? new Date(date.getTime() + 11 * 60 * 60 * 1000) : null, // 11 AM
            semester,
            branch
        };
        
        records.push(record);
    }
    
    // Insert records
    try {
        await AttendanceRecord.insertMany(records);
        console.log(`✅ Created ${records.length} attendance records`);
        
        // Calculate stats
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const percentage = Math.round((present / records.length) * 100);
        
        console.log(`📈 Stats: ${present} present, ${absent} absent, ${percentage}% attendance`);
    } catch (error) {
        console.error('❌ Error inserting records:', error.message);
    }
}

// Main function
async function main() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Example: Seed attendance for a test student
        // Replace these with actual student IDs from your database
        
        console.log('📝 Enter student details to seed attendance:');
        console.log('   Or modify this script with actual student IDs\n');
        
        // Example seed - uncomment and modify with real student data
        /*
        await seedAttendance(
            '507f1f77bcf86cd799439011',  // studentId
            'John Doe',                   // studentName
            'CS2021001',                  // enrollmentNo
            '5',                          // semester
            'CSE'                         // branch
        );
        */
        
        console.log('\n💡 To use this script:');
        console.log('   1. Get student ID from login or database');
        console.log('   2. Uncomment and modify the seedAttendance call above');
        console.log('   3. Run: node server/seed-attendance.js');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { seedAttendance };
