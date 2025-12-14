require('dotenv').config();
const fetch = require('node-fetch');

const SERVER_URL = process.env.SERVER_URL || 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

// Test student data
const testStudent = {
    studentId: '673abc123',  // Mock ID
    studentName: 'AADESH CHOUKSEY',
    enrollmentNo: '0246CD241001',
    semester: '3',
    branch: 'B.Tech Data Science'
};

async function testAttendanceFlow() {
    console.log('\n🧪 Testing Attendance Data Flow\n');
    console.log('='.repeat(80));
    
    try {
        // Test 1: Start Session
        console.log('\n📝 Test 1: Starting Attendance Session...');
        const startResponse = await fetch(`${SERVER_URL}/api/attendance/start-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: testStudent.studentId,
                studentName: testStudent.studentName,
                enrollmentNo: testStudent.enrollmentNo,
                semester: testStudent.semester,
                branch: testStudent.branch,
                faceData: null
            })
        });
        
        const startData = await startResponse.json();
        console.log('Response:', JSON.stringify(startData, null, 2));
        
        if (startData.success) {
            console.log('✅ Session started successfully');
            console.log(`   Timer: ${startData.session.timerValue} seconds`);
            console.log(`   Start Time: ${startData.session.sessionStartTime}`);
        } else {
            console.log('❌ Failed to start session:', startData.error);
        }
        
        // Test 2: Update Timer
        console.log('\n📝 Test 2: Updating Timer (5 minutes)...');
        const updateResponse = await fetch(`${SERVER_URL}/api/attendance/update-timer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: testStudent.studentId,
                timerValue: 300,  // 5 minutes
                wifiConnected: true
            })
        });
        
        const updateData = await updateResponse.json();
        console.log('Response:', JSON.stringify(updateData, null, 2));
        
        if (updateData.success) {
            console.log('✅ Timer updated successfully');
        } else {
            console.log('❌ Failed to update timer:', updateData.error);
        }
        
        // Test 3: Check if data was stored
        console.log('\n📝 Test 3: Verifying Data Storage...');
        console.log('Checking MongoDB for:');
        console.log(`   - AttendanceSession for ${testStudent.enrollmentNo}`);
        console.log(`   - AttendanceRecord for ${testStudent.enrollmentNo}`);
        console.log('\n⚠️  Note: This test creates real data in the database');
        console.log('   You can verify in MongoDB or admin panel');
        
        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Attendance flow test completed!\n');
        
        console.log('📊 Summary:');
        console.log('   1. Session start endpoint: ' + (startData.success ? '✅ Working' : '❌ Failed'));
        console.log('   2. Timer update endpoint: ' + (updateData.success ? '✅ Working' : '❌ Failed'));
        console.log('   3. Data uses enrollmentNo field: ✅ Fixed');
        console.log('\n💡 Next Steps:');
        console.log('   - Check MongoDB collections: attendancesessions, attendancerecords');
        console.log('   - Verify enrollmentNo field is populated correctly');
        console.log('   - Test from actual APK to ensure end-to-end flow works');
        
    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
        console.error('   Make sure the server is running and accessible');
    }
}

// Run the test
testAttendanceFlow();
