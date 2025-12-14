const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAzureDeployment() {
    const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
    
    console.log('🌐 Testing Azure Server Deployment...');
    console.log(`📡 Server URL: ${SERVER_URL}`);
    console.log('='.repeat(80));
    
    try {
        // Test 1: Health endpoint
        console.log('🏥 Testing health endpoint...');
        const healthResponse = await fetch(`${SERVER_URL}/api/health`, {
            timeout: 10000
        });
        console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log(`   ✅ Server is healthy: ${JSON.stringify(healthData)}`);
        }
        
        // Test 2: Teachers endpoint
        console.log('\n👥 Testing teachers endpoint...');
        const teachersResponse = await fetch(`${SERVER_URL}/api/teachers`, {
            timeout: 10000
        });
        console.log(`   Status: ${teachersResponse.status} ${teachersResponse.statusText}`);
        
        if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json();
            console.log(`   ✅ Teachers found: ${teachersData.teachers?.length || 0}`);
            if (teachersData.teachers?.length > 0) {
                console.log(`   📋 Sample teacher: ${teachersData.teachers[0].name} (${teachersData.teachers[0].department})`);
            }
        } else {
            console.log(`   ❌ Teachers endpoint failed`);
        }
        
        // Test 3: Departments endpoint (our new endpoint)
        console.log('\n🏢 Testing departments endpoint (NEW)...');
        const deptResponse = await fetch(`${SERVER_URL}/api/departments`, {
            timeout: 10000
        });
        console.log(`   Status: ${deptResponse.status} ${deptResponse.statusText}`);
        
        if (deptResponse.ok) {
            const deptData = await deptResponse.json();
            console.log(`   ✅ Departments found: ${deptData.departments?.length || 0}`);
            if (deptData.departments?.length > 0) {
                console.log(`   📋 Available departments:`);
                deptData.departments.forEach(dept => {
                    console.log(`      - ${dept.name} (${dept.code})`);
                });
            }
        } else {
            console.log(`   ❌ Departments endpoint failed`);
            if (deptResponse.status === 404) {
                console.log('   💡 Endpoint not found - deployment might not be complete');
            }
        }
        
        // Test 4: Students endpoint
        console.log('\n🎓 Testing students endpoint...');
        const studentsResponse = await fetch(`${SERVER_URL}/api/students`, {
            timeout: 10000
        });
        console.log(`   Status: ${studentsResponse.status} ${studentsResponse.statusText}`);
        
        if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            console.log(`   ✅ Students found: ${studentsData.students?.length || 0}`);
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('🎉 Azure deployment test completed!');
        
        // Summary
        const endpoints = [
            { name: 'Health', status: healthResponse.status },
            { name: 'Teachers', status: teachersResponse.status },
            { name: 'Departments', status: deptResponse.status },
            { name: 'Students', status: studentsResponse.status }
        ];
        
        const working = endpoints.filter(e => e.status >= 200 && e.status < 300).length;
        const total = endpoints.length;
        
        console.log(`📊 Summary: ${working}/${total} endpoints working`);
        
        if (working === total) {
            console.log('✅ All endpoints are working! Deployment successful!');
        } else {
            console.log('⚠️  Some endpoints are not working. Check deployment.');
        }
        
    } catch (error) {
        console.error('❌ Error testing Azure deployment:', error.message);
        
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log('💡 DNS resolution issue. Server might be restarting after deployment.');
            console.log('💡 Try again in a few minutes.');
        } else if (error.message.includes('timeout')) {
            console.log('💡 Request timeout. Server might be slow to respond.');
        }
    }
}

// Run the test
testAzureDeployment();