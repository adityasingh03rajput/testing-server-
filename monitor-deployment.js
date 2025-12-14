const axios = require('axios');

const AZURE_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function monitorDeployment() {
    console.log('🔄 Monitoring Azure Deployment...');
    console.log(`📍 URL: ${AZURE_URL}`);
    console.log('⏰ Started:', new Date().toLocaleString());
    console.log('');

    let attempts = 0;
    const maxAttempts = 10;
    const interval = 30000; // 30 seconds

    while (attempts < maxAttempts) {
        attempts++;
        console.log(`🔍 Attempt ${attempts}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);

        try {
            const response = await axios.get(AZURE_URL, { 
                timeout: 15000,
                headers: {
                    'User-Agent': 'Deployment-Monitor/1.0'
                }
            });

            console.log('✅ SUCCESS! Server is online');
            console.log(`📊 Status: ${response.status} ${response.statusText}`);
            console.log(`📋 Content-Type: ${response.headers['content-type']}`);
            
            if (response.data && typeof response.data === 'object') {
                console.log('📄 Server Response:');
                console.log(JSON.stringify(response.data, null, 2));
            }

            // Test API endpoint
            try {
                const apiResponse = await axios.get(`${AZURE_URL}/api/config`, { timeout: 10000 });
                console.log('');
                console.log('✅ API endpoints working');
                console.log(`📊 API Version: ${apiResponse.data.version || 'Unknown'}`);
            } catch (apiError) {
                console.log('');
                console.log('⚠️  API endpoints not ready yet');
            }

            console.log('');
            console.log('🎉 DEPLOYMENT SUCCESSFUL!');
            return;

        } catch (error) {
            console.log(`❌ Attempt ${attempts} failed: ${error.message}`);
            
            if (error.response) {
                console.log(`   Status: ${error.response.status} ${error.response.statusText}`);
                
                if (error.response.status === 503) {
                    console.log('   🔄 Service unavailable - deployment likely in progress');
                } else if (error.response.status === 502) {
                    console.log('   🔧 Bad gateway - server startup issues');
                } else if (error.response.status === 500) {
                    console.log('   💥 Internal server error - check application logs');
                }
            } else if (error.code === 'ECONNREFUSED') {
                console.log('   🔌 Connection refused');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('   ⏰ Request timeout');
            }

            if (attempts < maxAttempts) {
                console.log(`   ⏳ Waiting ${interval/1000} seconds before next attempt...`);
                console.log('');
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
    }

    console.log('');
    console.log('❌ DEPLOYMENT MONITORING FAILED');
    console.log(`   Tried ${maxAttempts} times over ${(maxAttempts * interval) / 60000} minutes`);
    console.log('   Server may need manual intervention');
}

// Run monitoring
monitorDeployment().catch(console.error);