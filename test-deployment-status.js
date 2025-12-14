/**
 * Deployment Status Test Script
 * Tests all critical endpoints to verify WiFi system deployment
 */

const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testEndpoint(url, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data: data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function checkDeploymentStatus() {
    console.log('🚀 CHECKING DEPLOYMENT STATUS...\n');
    
    const tests = [
        {
            name: 'Main API Config',
            url: `${SERVER_URL}/api/config`,
            expected: 'version should be 2.0.0'
        },
        {
            name: 'WiFi Event Logging',
            url: `${SERVER_URL}/api/attendance/wifi-event`,
            method: 'POST',
            body: {
                timestamp: new Date().toISOString(),
                type: 'test',
                bssid: 'test:bssid',
                studentId: 'test123',
                timerState: { isRunning: false }
            },
            expected: 'WiFi event endpoint should accept POST'
        },
        {
            name: 'Student Management',
            url: `${SERVER_URL}/api/students`,
            expected: 'Student management endpoint should respond'
        },
        {
            name: 'Timetable API',
            url: `${SERVER_URL}/api/timetable/3/B.Tech Computer Science`,
            expected: 'Timetable endpoint should respond'
        }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        console.log(`📋 Testing: ${test.name}`);
        
        const result = await testEndpoint(
            test.url, 
            test.method || 'GET', 
            test.body || null
        );
        
        if (result.success) {
            console.log(`✅ PASS: ${test.name} (Status: ${result.status})`);
            
            // Additional validation for specific endpoints
            if (test.name === 'Main API Config' && result.data.version) {
                console.log(`   📋 API Version: ${result.data.version}`);
            }
            if (test.name === 'WiFi Event Logging' && result.data.success) {
                console.log(`   📶 WiFi Logging: Working`);
            }
            
            passedTests++;
        } else {
            console.log(`❌ FAIL: ${test.name}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            } else {
                console.log(`   Status: ${result.status}`);
            }
        }
        console.log('');
    }
    
    // Summary
    console.log('=' .repeat(50));
    console.log(`📊 DEPLOYMENT STATUS SUMMARY`);
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📈 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log(`🎉 DEPLOYMENT SUCCESSFUL - All systems operational!`);
    } else if (passedTests >= totalTests * 0.75) {
        console.log(`⚠️  DEPLOYMENT PARTIAL - Most systems working, minor issues detected`);
    } else {
        console.log(`❌ DEPLOYMENT ISSUES - Multiple systems not responding`);
    }
    
    console.log(`🌐 Server URL: ${SERVER_URL}`);
    console.log(`📅 Checked: ${new Date().toLocaleString()}`);
}

// Run the test
checkDeploymentStatus().catch(console.error);