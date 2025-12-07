require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = process.env.SERVER_URL || 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testEndpoint() {
    console.log('🧪 Testing teacher-action endpoint...');
    console.log(`📡 Server URL: ${SOCKET_URL}`);
    console.log(`📡 Full endpoint: ${SOCKET_URL}/api/random-ring/teacher-action`);
    
    try {
        // Test with dummy data
        const response = await fetch(`${SOCKET_URL}/api/random-ring/teacher-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                randomRingId: 'test123',
                studentId: 'test456',
                action: 'accepted'
            })
        });
        
        console.log(`\n📥 Response status: ${response.status}`);
        console.log(`📥 Response status text: ${response.statusText}`);
        
        const text = await response.text();
        console.log(`📥 Response body: ${text}`);
        
        if (response.status === 404) {
            console.log('\n❌ ENDPOINT NOT FOUND (404)');
            console.log('   This means the route is not registered on the server');
            console.log('   Possible causes:');
            console.log('   1. Server code not deployed');
            console.log('   2. Server needs restart');
            console.log('   3. Route definition has syntax error');
        } else if (response.status === 400 || response.status === 500) {
            console.log('\n✅ ENDPOINT EXISTS (but returned error as expected with test data)');
        } else {
            console.log('\n✅ ENDPOINT ACCESSIBLE');
        }
        
    } catch (error) {
        console.error('\n❌ Error testing endpoint:', error.message);
        console.log('   This could mean:');
        console.log('   1. Server is not running');
        console.log('   2. Network connection issue');
        console.log('   3. CORS issue');
    }
}

testEndpoint();
