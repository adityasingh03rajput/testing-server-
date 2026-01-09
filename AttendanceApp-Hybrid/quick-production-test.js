// Quick Production Server Test - Critical Endpoints Only
const SERVER_URL = 'https://letsbunk-uw7g.onrender.com';

const CRITICAL_ENDPOINTS = [
    'GET /api/health',
    'GET /api/config',
    'GET /api/config/app',
    'GET /api/students',
    'GET /api/teachers',
    'GET /api/departments',
    'GET /api/classrooms',
    'GET /api/settings/attendance-threshold',
    'GET /api/holidays',
    'GET /api/timetables',
    'POST /api/login'
];

async function quickProductionTest() {
    console.log('🚀 Quick Production API Test');
    console.log(`🔗 Server: ${SERVER_URL}\n`);
    
    let passed = 0;
    let total = 0;
    const results = [];
    
    for (const endpoint of CRITICAL_ENDPOINTS) {
        const [method, path] = endpoint.split(' ');
        total++;
        
        try {
            const options = { method };
            
            // Add body for POST requests
            if (method === 'POST' && path.includes('/login')) {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ id: 'TEST001', password: 'test123' });
            }
            
            const startTime = Date.now();
            const response = await fetch(`${SERVER_URL}${path}`, options);
            const responseTime = Date.now() - startTime;
            const status = response.status;
            
            const emoji = status >= 200 && status < 300 ? '✅' : 
                         status === 404 ? '❌' : 
                         status >= 500 ? '🔥' : '⚠️';
            
            if (status >= 200 && status < 300) passed++;
            
            results.push({ endpoint, status, responseTime, success: status >= 200 && status < 300 });
            console.log(`${emoji} ${endpoint.padEnd(45)} - ${status} (${responseTime}ms)`);
            
        } catch (error) {
            console.log(`💥 ${endpoint.padEnd(45)} - ERROR: ${error.message}`);
            results.push({ endpoint, status: 'ERROR', responseTime: 0, success: false });
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`\n🎯 PRODUCTION SUCCESS RATE: ${successRate}% (${passed}/${total})`);
    
    // Performance analysis
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
        const avgTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
        console.log(`⚡ Average Response Time: ${avgTime.toFixed(0)}ms`);
    }
    
    // Check new endpoints specifically
    const newEndpoints = ['GET /api/departments', 'GET /api/classrooms', 'GET /api/settings/attendance-threshold', 'GET /api/holidays'];
    const newResults = results.filter(r => newEndpoints.includes(r.endpoint));
    const newPassed = newResults.filter(r => r.success).length;
    
    console.log(`\n🆕 NEW ENDPOINTS: ${newPassed}/${newResults.length} working`);
    
    if (successRate >= 90) {
        console.log('\n✅ PRODUCTION DEPLOYMENT SUCCESSFUL');
    } else if (successRate >= 75) {
        console.log('\n⚠️ PRODUCTION MOSTLY WORKING - Minor issues detected');
    } else {
        console.log('\n❌ PRODUCTION ISSUES DETECTED - Needs attention');
    }
    
    return results;
}

quickProductionTest();