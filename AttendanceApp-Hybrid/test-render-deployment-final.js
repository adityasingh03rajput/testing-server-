/**
 * Final Render Deployment Test
 * Tests the deployed server on Render
 */

const axios = require('axios');

const RENDER_URL = 'https://letsbunk-uw7g.onrender.com';

async function testRenderDeployment() {
    console.log('🚀 Testing Render Deployment...');
    console.log(`📍 Server URL: ${RENDER_URL}`);
    
    try {
        // Test health endpoint
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await axios.get(`${RENDER_URL}/api/health`, {
            timeout: 30000
        });
        console.log('✅ Health check:', healthResponse.data);
        
        // Test time endpoint
        console.log('\n2. Testing time endpoint...');
        const timeResponse = await axios.get(`${RENDER_URL}/api/time`, {
            timeout: 10000
        });
        console.log('✅ Time sync:', timeResponse.data);
        
        // Test students endpoint
        console.log('\n3. Testing students endpoint...');
        const studentsResponse = await axios.get(`${RENDER_URL}/api/students`, {
            timeout: 15000
        });
        console.log('✅ Students API:', `${studentsResponse.data.students?.length || 0} students found`);
        
        // Test teachers endpoint
        console.log('\n4. Testing teachers endpoint...');
        const teachersResponse = await axios.get(`${RENDER_URL}/api/teachers`, {
            timeout: 15000
        });
        console.log('✅ Teachers API:', `${teachersResponse.data.teachers?.length || 0} teachers found`);
        
        console.log('\n🎉 All tests passed! Server is running successfully on Render.');
        
    } catch (error) {
        console.error('❌ Deployment test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Server might be starting up. Wait a few minutes and try again.');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('💡 Server is taking too long to respond. Check Render logs.');
        } else {
            console.log('💡 Check Render dashboard for deployment status and logs.');
        }
    }
}

// Run the test
testRenderDeployment();