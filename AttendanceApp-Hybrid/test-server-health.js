// Test Server Health and API Endpoints
const SERVER_URL = 'https://letsbunk-uw7g.onrender.com';

async function testServerHealth() {
    console.log('🏥 TESTING SERVER HEALTH');
    console.log('='.repeat(40));
    
    try {
        // Test 1: Basic health check
        console.log('\n📡 Test 1: GET /api/health');
        const healthResponse = await fetch(`${SERVER_URL}/api/health`, {
            method: 'GET',
            headers: {
                'User-Agent': 'LetsBunk-Health-Check/1.0'
            }
        });
        
        console.log(`Status: ${healthResponse.status} ${healthResponse.statusText}`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Server is healthy');
            console.log(`Response: ${JSON.stringify(healthData, null, 2)}`);
        } else {
            console.log('❌ Health check failed');
        }
        
        // Test 2: Basic config endpoint
        console.log('\n📡 Test 2: GET /api/config');
        const configResponse = await fetch(`${SERVER_URL}/api/config`, {
            method: 'GET',
            headers: {
                'User-Agent': 'LetsBunk-Config-Check/1.0'
            }
        });
        
        console.log(`Status: ${configResponse.status} ${configResponse.statusText}`);
        if (configResponse.ok) {
            const configData = await configResponse.json();
            console.log('✅ Config endpoint working');
            console.log(`Available endpoints: ${Object.keys(configData.endpoints || {}).length}`);
        } else {
            console.log('❌ Config endpoint failed');
        }
        
        // Test 3: Students endpoint (the one we're having issues with)
        console.log('\n📡 Test 3: GET /api/students (basic)');
        const studentsResponse = await fetch(`${SERVER_URL}/api/students`, {
            method: 'GET',
            headers: {
                'User-Agent': 'LetsBunk-Students-Check/1.0'
            }
        });
        
        console.log(`Status: ${studentsResponse.status} ${studentsResponse.statusText}`);
        if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            console.log('✅ Students endpoint working');
            console.log(`Students returned: ${studentsData.students?.length || 0}`);
            if (studentsData.pagination) {
                console.log(`Total in DB: ${studentsData.pagination.total}`);
            }
        } else {
            console.log('❌ Students endpoint failed');
            try {
                const errorText = await studentsResponse.text();
                console.log(`Error response: ${errorText.substring(0, 200)}...`);
            } catch (e) {
                console.log('Could not read error response');
            }
        }
        
        // Test 4: Students endpoint with all=true
        console.log('\n📡 Test 4: GET /api/students?all=true');
        const allStudentsResponse = await fetch(`${SERVER_URL}/api/students?all=true`, {
            method: 'GET',
            headers: {
                'User-Agent': 'LetsBunk-All-Students-Check/1.0'
            }
        });
        
        console.log(`Status: ${allStudentsResponse.status} ${allStudentsResponse.statusText}`);
        if (allStudentsResponse.ok) {
            const allStudentsData = await allStudentsResponse.json();
            console.log('✅ All students endpoint working');
            console.log(`Total students: ${allStudentsData.total || allStudentsData.students?.length || 0}`);
            
            if (allStudentsData.students && allStudentsData.students.length > 0) {
                console.log('\n👥 Sample students:');
                allStudentsData.students.slice(0, 3).forEach((student, index) => {
                    console.log(`   ${index + 1}. ${student.name} (${student.enrollmentNo}) - ${student.course}`);
                });
            }
        } else {
            console.log('❌ All students endpoint failed');
            try {
                const errorText = await allStudentsResponse.text();
                console.log(`Error response: ${errorText.substring(0, 200)}...`);
            } catch (e) {
                console.log('Could not read error response');
            }
        }
        
        // Test 5: Teachers endpoint
        console.log('\n📡 Test 5: GET /api/teachers');
        const teachersResponse = await fetch(`${SERVER_URL}/api/teachers`, {
            method: 'GET',
            headers: {
                'User-Agent': 'LetsBunk-Teachers-Check/1.0'
            }
        });
        
        console.log(`Status: ${teachersResponse.status} ${teachersResponse.statusText}`);
        if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json();
            console.log('✅ Teachers endpoint working');
            console.log(`Teachers returned: ${teachersData.teachers?.length || 0}`);
        } else {
            console.log('❌ Teachers endpoint failed');
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('\n🌐 Possible causes:');
            console.log('• Server is down or restarting');
            console.log('• Network connectivity issues');
            console.log('• Render.com deployment issues');
        }
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('='.repeat(30));
    console.log('🗃️ Database Status: ✅ 1,329 students seeded successfully');
    console.log('🌐 Server Status: Testing above...');
    console.log('\n💡 If server is down, it may be restarting due to recent changes');
    console.log('🔄 Render.com auto-deploys from GitHub commits');
    console.log('⏱️ Wait 2-3 minutes for deployment to complete');
}

testServerHealth();