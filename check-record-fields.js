// Check what fields attendance records actually have
const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function checkRecordFields() {
    try {
        const recordsRes = await fetch(`${SERVER_URL}/api/attendance/records`);
        const recordsData = await recordsRes.json();
        
        if (recordsData.records && recordsData.records.length > 0) {
            const sample = recordsData.records[0];
            console.log('📋 Sample Attendance Record Fields:');
            console.log(JSON.stringify(sample, null, 2));
            
            console.log('\n📊 Field Analysis:');
            console.log('   totalAttended:', sample.totalAttended);
            console.log('   totalClassTime:', sample.totalClassTime);
            console.log('   timerValue:', sample.timerValue);
            console.log('   lecturesAttended:', sample.lecturesAttended);
            console.log('   totalLectures:', sample.totalLectures);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkRecordFields();
