const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testSubjectsAPI() {
    console.log('🧪 Testing Subjects API...\n');
    
    try {
        // Test 1: Get all subjects
        console.log('1️⃣ Testing GET /api/subjects');
        const response = await fetch(`${SERVER_URL}/api/subjects`);
        const data = await response.json();
        console.log('Response:', data);
        console.log('Status:', response.status);
        
        if (data.success) {
            console.log(`✅ Found ${data.count} subjects`);
        } else {
            console.log('❌ Failed:', data.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSubjectsAPI();
