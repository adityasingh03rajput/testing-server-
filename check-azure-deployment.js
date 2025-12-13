const axios = require('axios');

const AZURE_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function checkDeployment() {
    console.log('🔍 Checking Azure Deployment Status...');
    console.log(`📍 URL: ${AZURE_URL}`);
    console.log('⏰ Time:', new Date().toLocaleString());
    console.log('');

    try {
        // Test root endpoint
        const response = await axios.get(AZURE_URL, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Deployment-Checker/1.0'
            }
        });

        console.log('✅ SERVER IS ONLINE!');
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📋 Content-Type: ${response.headers['content-type']}`);
        
        if (response.data && typeof response.data === 'object') {
            console.log('📄 Response Data:');
            console.log(JSON.stringify(response.data, null, 2));
        } else {
            console.log('📄 Response (first 200 chars):');
            console.log(String(response.data).substring(0, 200) + '...');
        }

        // Test API config endpoint
        try {
            const configResponse = await axios.get(`${AZURE_URL}/api/config`, { timeout: 5000 });
            console.log('');
            console.log('✅ API CONFIG ENDPOINT WORKING');
            console.log(`📊 Config Status: ${configResponse.status}`);
            console.log(`📋 Version: ${configResponse.data.version || 'Unknown'}`);
        } catch (configError) {
            console.log('');
            console.log('❌ API CONFIG ENDPOINT FAILED');
            console.log(`📊 Error: ${configError.message}`);
        }

    } catch (error) {
        console.log('❌ SERVER IS OFFLINE OR ERROR');
        console.log(`📊 Error: ${error.message}`);
        
        if (error.response) {
            console.log(`📊 Status: ${error.response.status} ${error.response.statusText}`);
            console.log(`📋 Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
            
            if (error.response.status === 503) {
                console.log('');
                console.log('🔄 503 Service Unavailable - Possible causes:');
                console.log('   • Deployment in progress');
                console.log('   • Application startup failure');
                console.log('   • Resource allocation issues');
                console.log('   • Configuration errors');
            }
        } else if (error.code === 'ECONNREFUSED') {
            console.log('');
            console.log('🔌 Connection refused - Server may be down');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('');
            console.log('⏰ Request timeout - Server may be slow to respond');
        }
    }

    console.log('');
    console.log('='.repeat(50));
}

// Run the check
checkDeployment();