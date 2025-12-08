const mongoose = require('mongoose');
require('dotenv').config();

async function checkStudent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        
        const enrollmentNo = '0246CD241001';
        
        console.log('═'.repeat(80));
        console.log('📊 ATTENDANCE REPORT FOR STUDENT: ' + enrollmentNo);
        console.log('═'.repeat(80));
        
        // Get student info
        const student = await db.collection('studentmanagements').findOne({ enrollmentNo });
        
        if (student) {
            console.log('\n👤 STUDENT INFORMATION:');
            console.log('─'.repeat(80));
            console.log(`Name: ${student.name}`);
            console.log(`Father's Name: ${student.fatherName}`);
            console.log(`Enrollment: ${student.enrollmentNo}`);
            console.log(`Course: ${student.course}`);
            console.log(`Semester: ${student.semester}`);
            console.log(`Email: ${student.email}`);
            console.log(`DOB: ${new Date(student.dob).toLocaleDateString('en-IN')}`);
        }
        
        // Get attendance records
        console.log('\n\n📋 ATTENDANCE RECORDS:');
        console.log('─'.repeat(80));
        
        const records = await db.collection('attendancerecords').find({ 
            enrollmentNumber: enrollmentNo 
        }).toArray();
        
        if (records.length > 0) {
            console.log(`Total Records: ${records.length}\n`);
            
            records.forEach((record, index) => {
                console.log(`Record ${index + 1}:`);
                console.log(`  Date: ${new Date(record.date).toLocaleDateString('en-IN')}`);
                console.log(`  Status: ${record.status === 'present' ? '✅ Present' : '❌ Absent'}`);
                console.log(`  Check-in: ${record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-IN') : 'N/A'}`);
                console.log(`  Check-out: ${record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-IN') : 'N/A'}`);
                console.log(`  Total Attended: ${record.totalAttended} minutes`);
                console.log(`  Total Class Time: ${record.totalClassTime} minutes`);
                console.log(`  Day Percentage: ${record.dayPercentage}%`);
                console.log(`  Timer Value: ${record.timerValue} seconds`);
                console.log(`  Lectures: ${record.lectures.length > 0 ? record.lectures.join(', ') : 'None'}`);
                console.log('');
            });
        } else {
            console.log('⚠️  No attendance records found');
        }
        
        // Get attendance sessions
        console.log('\n📱 ATTENDANCE SESSIONS:');
        console.log('─'.repeat(80));
        
        const sessions = await db.collection('attendancesessions').find({ 
            enrollmentNumber: enrollmentNo 
        }).toArray();
        
        if (sessions.length > 0) {
            console.log(`Total Sessions: ${sessions.length}\n`);
            
            sessions.forEach((session, index) => {
                console.log(`Session ${index + 1}:`);
                console.log(`  Date: ${new Date(session.date).toLocaleDateString('en-IN')}`);
                console.log(`  Start Time: ${new Date(session.sessionStartTime).toLocaleTimeString('en-IN')}`);
                console.log(`  Last Update: ${new Date(session.lastUpdate).toLocaleTimeString('en-IN')}`);
                console.log(`  Timer Value: ${session.timerValue} seconds`);
                console.log(`  Active: ${session.isActive ? '🟢 Yes' : '🔴 No'}`);
                console.log(`  WiFi Connected: ${session.wifiConnected ? '✅ Yes' : '❌ No'}`);
                console.log('');
            });
        } else {
            console.log('⚠️  No active sessions found');
        }
        
        // Summary
        console.log('\n📈 SUMMARY:');
        console.log('═'.repeat(80));
        
        const presentDays = records.filter(r => r.status === 'present').length;
        const absentDays = records.filter(r => r.status === 'absent').length;
        const totalDays = records.length;
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;
        
        console.log(`Total Days Recorded: ${totalDays}`);
        console.log(`Present: ${presentDays} days`);
        console.log(`Absent: ${absentDays} days`);
        console.log(`Attendance Percentage: ${percentage}%`);
        
        let status = '🟢 EXCELLENT';
        if (percentage < 75) status = '🔴 CRITICAL - Below 75%';
        else if (percentage < 85) status = '🟡 WARNING - Below 85%';
        else if (percentage < 90) status = '🟢 GOOD';
        
        console.log(`Status: ${status}`);
        console.log('═'.repeat(80));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkStudent();
