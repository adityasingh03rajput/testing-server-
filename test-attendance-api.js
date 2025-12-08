// Test script to verify attendance API endpoints
const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testAttendanceAPI() {
    console.log('🧪 Testing Attendance API Endpoints...\n');
    
    try {
        // Test 1: Get all students
        console.log('1️⃣ Testing GET /api/students');
        const studentsRes = await fetch(`${SERVER_URL}/api/students`);
        const studentsData = await studentsRes.json();
        console.log(`   ✅ Status: ${studentsRes.status}`);
        console.log(`   📊 Total students: ${studentsData.students?.length || 0}`);
        
        if (studentsData.students && studentsData.students.length > 0) {
            const cseStudents = studentsData.students.filter(s => s.course === 'CSE' && s.semester === '5');
            console.log(`   📊 CSE Semester 5 students: ${cseStudents.length}`);
            
            if (cseStudents.length > 0) {
                const testStudent = cseStudents[0];
                console.log(`   👤 Test student: ${testStudent.name} (${testStudent.enrollmentNo})`);
                
                // Test 2: Get attendance summary for one student
                console.log('\n2️⃣ Testing GET /api/attendance/summary/:enrollmentNo');
                const summaryRes = await fetch(`${SERVER_URL}/api/attendance/summary/${testStudent.enrollmentNo}`);
                const summaryData = await summaryRes.json();
                console.log(`   ✅ Status: ${summaryRes.status}`);
                console.log(`   📊 Summary:`, JSON.stringify(summaryData.summary, null, 2));
            }
        }
        
        // Test 3: Get date range
        console.log('\n3️⃣ Testing GET /api/attendance/date-range');
        const dateRangeRes = await fetch(`${SERVER_URL}/api/attendance/date-range`);
        const dateRangeData = await dateRangeRes.json();
        console.log(`   ✅ Status: ${dateRangeRes.status}`);
        console.log(`   📅 Date range:`, dateRangeData);
        
        // Test 4: Get all attendance records
        console.log('\n4️⃣ Testing GET /api/attendance/records');
        const recordsRes = await fetch(`${SERVER_URL}/api/attendance/records`);
        const recordsData = await recordsRes.json();
        console.log(`   ✅ Status: ${recordsRes.status}`);
        console.log(`   📊 Total records: ${recordsData.records?.length || 0}`);
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAttendanceAPI();
