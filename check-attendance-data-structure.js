// Check attendance data structure
const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function checkDataStructure() {
    console.log('🔍 Checking data structure...\n');
    
    try {
        // Get a student
        const studentsRes = await fetch(`${SERVER_URL}/api/students`);
        const studentsData = await studentsRes.json();
        const student = studentsData.students.find(s => s.course === 'CSE' && s.semester === '1');
        
        if (student) {
            console.log('👤 Sample Student:');
            console.log('   enrollmentNo:', student.enrollmentNo);
            console.log('   studentId:', student.studentId);
            console.log('   name:', student.name);
            console.log('   course:', student.course);
            console.log('   semester:', student.semester);
        }
        
        // Get attendance records
        console.log('\n📊 Sample Attendance Records:');
        const recordsRes = await fetch(`${SERVER_URL}/api/attendance/records`);
        const recordsData = await recordsRes.json();
        
        if (recordsData.records && recordsData.records.length > 0) {
            const sampleRecord = recordsData.records[0];
            console.log('   Record structure:', Object.keys(sampleRecord));
            console.log('   Sample record:', JSON.stringify(sampleRecord, null, 2));
            
            // Check if studentId matches
            if (student) {
                const matchingRecords = recordsData.records.filter(r => 
                    r.studentId === student.studentId || 
                    r.enrollmentNo === student.enrollmentNo
                );
                console.log(`\n   Records for ${student.name}:`, matchingRecords.length);
                if (matchingRecords.length > 0) {
                    console.log('   First matching record:', JSON.stringify(matchingRecords[0], null, 2));
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkDataStructure();
