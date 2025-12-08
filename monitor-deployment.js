// Monitor Azure deployment and test attendance endpoints
const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function checkDeployment() {
    console.log('🔍 Checking Azure deployment status...\n');
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes (10 seconds interval)
    
    while (attempts < maxAttempts) {
        attempts++;
        
        try {
            console.log(`Attempt ${attempts}/${maxAttempts}...`);
            
            // Test health endpoint
            const healthRes = await fetch(`${SERVER_URL}/api/health`);
            if (!healthRes.ok) {
                console.log('   ⏳ Server not ready yet...');
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }
            
            // Test attendance summary endpoint with a known student
            const studentsRes = await fetch(`${SERVER_URL}/api/students`);
            const studentsData = await studentsRes.json();
            
            if (!studentsData.success || !studentsData.students || studentsData.students.length === 0) {
                console.log('   ⏳ No students found yet...');
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }
            
            const testStudent = studentsData.students.find(s => s.course === 'CSE' && s.semester === '1');
            if (!testStudent) {
                console.log('   ⏳ No CSE Semester 1 students found...');
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }
            
            console.log(`\n✅ Server is ready!`);
            console.log(`👤 Testing with: ${testStudent.name} (${testStudent.enrollmentNo})\n`);
            
            // Test attendance summary
            const summaryRes = await fetch(`${SERVER_URL}/api/attendance/summary/${testStudent.enrollmentNo}`);
            const summaryData = await summaryRes.json();
            
            console.log('📊 Attendance Summary Test:');
            console.log('   Status:', summaryRes.status);
            console.log('   Success:', summaryData.success);
            
            if (summaryData.success && summaryData.summary) {
                console.log('   Total Days:', summaryData.summary.totalDays);
                console.log('   Present Days:', summaryData.summary.presentDays);
                console.log('   Percentage:', summaryData.summary.overallPercentage + '%');
                console.log('   Total Hours:', Math.floor(summaryData.summary.totalAttendedMinutes / 60) + 'h');
                
                if (summaryData.summary.totalDays > 0) {
                    console.log('\n✅ DEPLOYMENT SUCCESSFUL! Attendance data is loading correctly.');
                    console.log('\n📋 Next Steps:');
                    console.log('   1. Open the Admin Panel');
                    console.log('   2. Go to Attendance History');
                    console.log('   3. Select "Computer Science (CSE)" and "Semester 1"');
                    console.log('   4. Click "Fetch Computer Science (CSE) - Semester 1"');
                    console.log('   5. You should now see attendance data!');
                    return;
                } else {
                    console.log('\n⚠️  Deployment successful but no attendance records found for this student.');
                    console.log('   This might be normal if the student has no attendance yet.');
                }
            } else {
                console.log('   ❌ Error:', summaryData.error || 'Unknown error');
            }
            
            break;
            
        } catch (error) {
            console.log('   ❌ Error:', error.message);
            if (attempts < maxAttempts) {
                console.log('   ⏳ Waiting 10 seconds before retry...\n');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
    
    if (attempts >= maxAttempts) {
        console.log('\n⏰ Timeout: Deployment is taking longer than expected.');
        console.log('   Check GitHub Actions: https://github.com/adityasingh03rajput/testing-server-/actions');
    }
}

checkDeployment();
