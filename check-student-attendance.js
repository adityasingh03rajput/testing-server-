// Check attendance data for specific student
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
    studentId: String,
    enrollmentNumber: String,
    name: String,
    branch: String,
    semester: String,
    subject: String,
    date: Date,
    status: String,
    markedBy: String,
    timestamp: Date
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Student Schema
const studentSchema = new mongoose.Schema({
    enrollmentNumber: String,
    name: String,
    email: String,
    branch: String,
    semester: String,
    photoUrl: String
});

const Student = mongoose.model('StudentManagement', studentSchema, 'studentmanagements');

async function checkStudentAttendance() {
    const enrollmentNumber = '0246CD241001';
    const enrollmentField = 'enrollmentNo'; // Correct field name
    
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected to MongoDB\n');

        // Check if student exists
        console.log(`🔍 Searching for student: ${enrollmentNumber}`);
        const student = await Student.findOne({ enrollmentNo: enrollmentNumber });
        
        if (!student) {
            console.log(`❌ Student ${enrollmentNumber} not found in database`);
            return;
        }
        
        console.log('✅ Student found:');
        console.log('─'.repeat(60));
        console.log(`Name: ${student.name}`);
        console.log(`Enrollment: ${student.enrollmentNo}`);
        console.log(`Branch: ${student.course}`);
        console.log(`Semester: ${student.semester}`);
        console.log(`Email: ${student.email}`);
        console.log('─'.repeat(60));
        console.log('');

        // Get attendance records
        console.log('📊 Fetching attendance records...');
        const attendanceRecords = await Attendance.find({ 
            $or: [
                { enrollmentNumber: enrollmentNumber },
                { enrollmentNo: enrollmentNumber }
            ]
        }).sort({ date: -1 });

        if (attendanceRecords.length === 0) {
            console.log('⚠️  No attendance records found for this student');
            return;
        }

        console.log(`✅ Found ${attendanceRecords.length} attendance records\n`);

        // Group by subject
        const bySubject = {};
        attendanceRecords.forEach(record => {
            const subject = record.subject || 'Unknown';
            if (!bySubject[subject]) {
                bySubject[subject] = {
                    present: 0,
                    absent: 0,
                    total: 0,
                    records: []
                };
            }
            bySubject[subject].total++;
            if (record.status === 'present') {
                bySubject[subject].present++;
            } else {
                bySubject[subject].absent++;
            }
            bySubject[subject].records.push(record);
        });

        // Display summary
        console.log('📈 ATTENDANCE SUMMARY BY SUBJECT:');
        console.log('═'.repeat(80));
        
        Object.keys(bySubject).forEach(subject => {
            const data = bySubject[subject];
            const percentage = ((data.present / data.total) * 100).toFixed(2);
            
            console.log(`\n📚 ${subject}`);
            console.log('─'.repeat(80));
            console.log(`Total Classes: ${data.total}`);
            console.log(`Present: ${data.present} (${percentage}%)`);
            console.log(`Absent: ${data.absent}`);
            
            // Show status indicator
            let statusIcon = '🟢';
            if (percentage < 75) statusIcon = '🔴';
            else if (percentage < 85) statusIcon = '🟡';
            
            console.log(`Status: ${statusIcon} ${percentage >= 75 ? 'GOOD' : 'LOW ATTENDANCE'}`);
        });

        console.log('\n═'.repeat(80));

        // Overall statistics
        const totalClasses = attendanceRecords.length;
        const totalPresent = attendanceRecords.filter(r => r.status === 'present').length;
        const totalAbsent = totalClasses - totalPresent;
        const overallPercentage = ((totalPresent / totalClasses) * 100).toFixed(2);

        console.log('\n📊 OVERALL ATTENDANCE:');
        console.log('═'.repeat(80));
        console.log(`Total Classes: ${totalClasses}`);
        console.log(`Present: ${totalPresent} (${overallPercentage}%)`);
        console.log(`Absent: ${totalAbsent}`);
        
        let overallStatus = '🟢 EXCELLENT';
        if (overallPercentage < 75) overallStatus = '🔴 CRITICAL - Below 75%';
        else if (overallPercentage < 85) overallStatus = '🟡 WARNING - Below 85%';
        else if (overallPercentage < 90) overallStatus = '🟢 GOOD';
        
        console.log(`Status: ${overallStatus}`);
        console.log('═'.repeat(80));

        // Recent attendance (last 10 records)
        console.log('\n📅 RECENT ATTENDANCE (Last 10 records):');
        console.log('═'.repeat(80));
        
        const recentRecords = attendanceRecords.slice(0, 10);
        recentRecords.forEach((record, index) => {
            const date = new Date(record.date).toLocaleDateString('en-IN');
            const status = record.status === 'present' ? '✅ Present' : '❌ Absent';
            const subject = record.subject || 'Unknown';
            
            console.log(`${index + 1}. ${date} | ${subject.padEnd(30)} | ${status}`);
        });

        console.log('═'.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

checkStudentAttendance();
