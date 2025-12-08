// Test the calculation logic
const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testCalculation() {
    try {
        // Get a student
        const studentsRes = await fetch(`${SERVER_URL}/api/students`);
        const studentsData = await studentsRes.json();
        const student = studentsData.students.find(s => s.enrollmentNo === '0246CS221001');
        
        console.log('👤 Student:', student.name, '(' + student.enrollmentNo + ')');
        
        // Get all records
        const recordsRes = await fetch(`${SERVER_URL}/api/attendance/records`);
        const recordsData = await recordsRes.json();
        
        // Filter for this student
        const studentRecords = recordsData.records.filter(r => 
            r.studentId === student.enrollmentNo || 
            r.enrollmentNumber === student.enrollmentNo
        );
        
        console.log('\n📊 Found', studentRecords.length, 'records for this student');
        
        if (studentRecords.length > 0) {
            console.log('\n📋 Sample records:');
            studentRecords.slice(0, 3).forEach((r, i) => {
                console.log(`\n   Record ${i + 1}:`);
                console.log('      Date:', new Date(r.date).toLocaleDateString());
                console.log('      Status:', r.status);
                console.log('      totalAttended:', r.totalAttended);
                console.log('      totalClassTime:', r.totalClassTime);
                console.log('      lecturesAttended:', r.lecturesAttended);
                console.log('      totalLectures:', r.totalLectures);
            });
            
            // Calculate manually
            const totalLecturesAttended = studentRecords.reduce((sum, r) => sum + (r.lecturesAttended || 0), 0);
            const totalLecturesTotal = studentRecords.reduce((sum, r) => sum + (r.totalLectures || 0), 0);
            const calculatedMinutesAttended = totalLecturesAttended * 50;
            const calculatedMinutesTotal = totalLecturesTotal * 50;
            const calculatedPercentage = calculatedMinutesTotal > 0 
                ? Math.round((calculatedMinutesAttended / calculatedMinutesTotal) * 100)
                : 0;
            
            console.log('\n🧮 Manual Calculation:');
            console.log('   Total Lectures Attended:', totalLecturesAttended);
            console.log('   Total Lectures:', totalLecturesTotal);
            console.log('   Calculated Minutes Attended:', calculatedMinutesAttended);
            console.log('   Calculated Minutes Total:', calculatedMinutesTotal);
            console.log('   Calculated Percentage:', calculatedPercentage + '%');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCalculation();
