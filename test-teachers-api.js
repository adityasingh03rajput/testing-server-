const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test the teachers API endpoint
async function testTeachersAPI() {
    try {
        const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
        
        console.log('🌐 Testing Teachers API...');
        console.log(`📡 Server URL: ${SERVER_URL}`);
        
        // Test GET /api/teachers
        console.log('\n📋 Testing GET /api/teachers...');
        const response = await fetch(`${SERVER_URL}/api/teachers`);
        
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        console.log(`📄 Response Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('\n✅ API Response:');
            console.log(JSON.stringify(data, null, 2));
            
            if (data.teachers && Array.isArray(data.teachers)) {
                console.log(`\n👥 Teachers found: ${data.teachers.length}`);
                
                if (data.teachers.length > 0) {
                    console.log('\n📋 Teacher List:');
                    data.teachers.forEach((teacher, index) => {
                        console.log(`${index + 1}. ${teacher.name} (${teacher.employeeId}) - ${teacher.department}`);
                    });
                    
                    // Get unique departments
                    const departments = [...new Set(data.teachers.map(t => t.department))];
                    console.log(`\n🏢 Departments: ${departments.join(', ')}`);
                }
            }
        } else {
            const errorText = await response.text();
            console.log(`❌ API Error: ${errorText}`);
        }
        
        // Test departments endpoint
        console.log('\n🏢 Testing GET /api/departments...');
        const deptResponse = await fetch(`${SERVER_URL}/api/departments`);
        console.log(`📊 Departments Response Status: ${deptResponse.status}`);
        
        if (deptResponse.ok) {
            const deptData = await deptResponse.json();
            console.log('✅ Departments API Response:');
            console.log(JSON.stringify(deptData, null, 2));
        } else {
            const deptError = await deptResponse.text();
            console.log(`❌ Departments API Error: ${deptError}`);
        }
        
        // Test bulk teachers endpoint
        console.log('\n📥 Testing POST /api/teachers/bulk...');
        const bulkResponse = await fetch(`${SERVER_URL}/api/teachers/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teachers: [] })
        });
        console.log(`📊 Bulk Teachers Response Status: ${bulkResponse.status}`);
        
        if (bulkResponse.ok) {
            const bulkData = await bulkResponse.json();
            console.log('✅ Bulk Teachers API Response:');
            console.log(JSON.stringify(bulkData, null, 2));
        } else {
            const bulkError = await bulkResponse.text();
            console.log(`❌ Bulk Teachers API Error: ${bulkError}`);
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error);
        
        if (error.code === 'ENOTFOUND') {
            console.log('💡 Network error - server might be down or URL incorrect');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('💡 Connection refused - server not responding');
        }
    }
}

// Run the test
testTeachersAPI();