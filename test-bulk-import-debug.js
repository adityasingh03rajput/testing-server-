const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test data for bulk import
const testTeachers = [
    {
        employeeId: 'TEST001',
        name: 'Test Teacher 1',
        email: 'test1@college.edu',
        password: 'password123',
        department: 'CSE',
        subject: 'Test Subject 1',
        dob: '1980-01-01',
        phone: '+91-1234567890',
        semester: '1',
        canEditTimetable: false
    },
    {
        employeeId: 'TEST002',
        name: 'Test Teacher 2',
        email: 'test2@college.edu',
        password: 'password123',
        department: 'ECE',
        subject: 'Test Subject 2',
        dob: '1985-01-01',
        phone: '+91-1234567891',
        semester: '2',
        canEditTimetable: true
    }
];

async function testBulkImport() {
    try {
        const SERVER_URL = 'http://localhost:3001';
        
        console.log('🧪 Testing Bulk Import Debug...');
        console.log(`📡 Server URL: ${SERVER_URL}`);
        console.log(`📝 Test Data:`, JSON.stringify(testTeachers, null, 2));
        
        // Test bulk import
        console.log('\n📥 Testing bulk import...');
        const response = await fetch(`${SERVER_URL}/api/teachers/bulk`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ teachers: testTeachers })
        });
        
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        console.log(`📄 Response Headers:`, Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log(`📄 Raw Response:`, responseText);
        
        try {
            const data = JSON.parse(responseText);
            console.log(`✅ Parsed Response:`, JSON.stringify(data, null, 2));
        } catch (parseError) {
            console.log(`❌ Failed to parse JSON:`, parseError.message);
        }
        
        // Verify if teachers were added
        console.log('\n🔍 Verifying teachers after import...');
        const verifyResponse = await fetch(`${SERVER_URL}/api/teachers`);
        const verifyData = await verifyResponse.json();
        
        console.log(`👥 Teachers in database after import: ${verifyData.teachers.length}`);
        if (verifyData.teachers.length > 0) {
            console.log('📋 Current teachers:');
            verifyData.teachers.forEach((teacher, index) => {
                console.log(`${index + 1}. ${teacher.name} (${teacher.employeeId}) - ${teacher.department}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error testing bulk import:', error);
    }
}

// Run the test
testBulkImport();