// Check if our changes are actually deployed on production
const SERVER_URL = 'https://letsbunk-uw7g.onrender.com';

async function checkDeployment() {
    console.log('🔍 Checking Production Deployment Status...\n');
    
    // Test endpoints that should exist if our changes are deployed
    const testEndpoints = [
        { url: '/api/health', description: 'Health check (should always work)' },
        { url: '/api/departments', description: 'NEW: Departments endpoint' },
        { url: '/api/students', description: 'FIXED: Students endpoint (was causing 500 errors)' },
        { url: '/api/settings/attendance-threshold', description: 'NEW: Settings endpoint' }
    ];
    
    for (const endpoint of testEndpoints) {
        try {
            console.log(`Testing ${endpoint.url}...`);
            const response = await fetch(`${SERVER_URL}${endpoint.url}`, {
                method: 'GET',
                headers: { 'User-Agent': 'Deployment-Check/1.0' }
            });
            
            const status = response.status;
            const emoji = status === 200 ? '✅' : status === 404 ? '❌' : status >= 500 ? '🔥' : '⚠️';
            
            console.log(`${emoji} ${endpoint.url} - ${status} - ${endpoint.description}`);
            
            if (status === 200) {
                try {
                    const data = await response.json();
                    if (endpoint.url === '/api/students' && data.students) {
                        console.log(`   📊 Found ${data.students.length} students in database`);
                    } else if (endpoint.url === '/api/departments' && data.departments) {
                        console.log(`   📊 Found ${data.departments.length} departments`);
                    }
                } catch (e) {
                    console.log(`   ⚠️ Response not JSON or parsing failed`);
                }
            }
            
        } catch (error) {
            console.log(`💥 ${endpoint.url} - ERROR: ${error.message}`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🔍 DEPLOYMENT CHECK COMPLETE');
}

checkDeployment();