// Monitor Render deployment status
const SERVER_URL = 'https://google-8j5x.onrender.com';

async function checkDeployment() {
    console.log('🔍 Checking Render Deployment Status...\n');
    
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    try {
        const healthResponse = await fetch(`${SERVER_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('   ✅ Server is running');
        console.log('   📊 Status:', healthData.status);
        console.log('   🗄️  Database:', healthData.database);
        console.log('   ⏰ Server Time:', healthData.timestamp);
    } catch (error) {
        console.log('   ❌ Health check failed:', error.message);
        return;
    }

    console.log('\n2️⃣ Testing Period Update Endpoint...');
    try {
        const testPeriods = [
            { number: 1, startTime: '09:00', endTime: '09:50', isBreak: false }
        ];

        const response = await fetch(`${SERVER_URL}/api/periods/update-all`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ periods: testPeriods })
        });

        console.log('   📡 Status Code:', response.status);
        
        const contentType = response.headers.get('content-type');
        
        if (response.status === 404) {
            console.log('   ❌ Endpoint not found (404)');
            console.log('   ⏳ Deployment may still be in progress...');
            console.log('   💡 Wait 2-3 more minutes and try again');
            return;
        }

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('   ✅ Endpoint is working!');
            console.log('   📊 Response:', data);
            
            if (data.success) {
                console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
                console.log('✅ Period management is now available');
                console.log('✅ You can now use "Save & Apply to All Timetables"');
            }
        } else {
            const text = await response.text();
            console.log('   ⚠️  Non-JSON response:', text.substring(0, 100));
        }

    } catch (error) {
        console.log('   ❌ Test failed:', error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('Run this script again in 2 minutes if deployment is pending');
}

checkDeployment();
