// Test local attendance endpoints
const SERVER_URL = 'http://localhost:3000';

async function testLocalAttendance() {
    console.log('🧪 Testing Local Attendance Endpoints...\n');
    
    try {
        // Get students
        const studentsRes = await fetch(`${SERVER_URL}/api/students`);
        const studentsData = await studentsRes.json();
        const cseStudents = studentsData.students.filter(s => s.course === 'CSE' && s.semester === '1');
        
        console.log(`📊 Found ${cseStudents.length} CSE Semester 1 students`);
        
        if (cseStudents.length > 0) {
            const testStudent = cseStudents[0];
            console.log(`\n👤 Testing with: ${testStudent.name} (${testStudent.enrollmentNo})`);
            
            // Test attendance summary
            console.log('\n📊 Testing attendance summary...');
            const summaryRes = await fetch(`${SERVER_URL}/api/attendance/summary/${testStudent.enrollmentNo}`);
            const summaryData = await summaryRes.json();
            
            console.log('   Status:', summaryRes.status);
            console.log('   Response:', JSON.stringify(summaryData, null, 2));
            
            // Check if we have any records for this student
            const recordsRes = await fetch(`${SERVER_URL}/api/attendance/records`);
            const recordsData = await recordsRes.json();
            const studentRecords = recordsData.records.filter(r => 
                r.studentId === testStudent.enrollmentNo || 
                r.enrollmentNumber === testStudent.enrollmentNo
            );
            console.log(`\n   Direct record check: ${studentRecords.length} records found`);
            if (studentRecords.length > 0) {
                console.log('   Sample record:', JSON.stringify(studentRecords[0], null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLocalAttendance();
