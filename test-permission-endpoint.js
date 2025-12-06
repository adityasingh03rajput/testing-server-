// Test script to verify permission endpoint
const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testRefreshProfile() {
    console.log('🧪 Testing /api/refresh-profile endpoint...\n');
    
    try {
        const response = await fetch(`${SERVER_URL}/api/refresh-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 'TEACH001',
                role: 'teacher'
            })
        });
        
        const data = await response.json();
        
        console.log('✅ Response received:');
        console.log(JSON.stringify(data, null, 2));
        console.log('\n📊 Key fields:');
        console.log('   success:', data.success);
        console.log('   user.name:', data.user?.name);
        console.log('   user.canEditTimetable:', data.user?.canEditTimetable);
        console.log('   user.canEditTimetable type:', typeof data.user?.canEditTimetable);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testRefreshProfile();
