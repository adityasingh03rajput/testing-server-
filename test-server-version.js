require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testServerVersion() {
    console.log('🧪 Testing if new timer broadcast system is deployed...\n');
    
    // The new system should have the teacher-action endpoint
    try {
        const response = await fetch(`${SOCKET_URL}/api/random-ring/teacher-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        });
        
        if (response.status === 404) {
            console.log('❌ OLD VERSION - teacher-action endpoint not found');
            console.log('   Deployment not complete yet');
            return false;
        } else {
            console.log('✅ NEW VERSION - teacher-action endpoint exists');
            console.log(`   Status: ${response.status}`);
            return true;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

testServerVersion();
