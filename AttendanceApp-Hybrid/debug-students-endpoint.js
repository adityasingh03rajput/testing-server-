// Debug the students endpoint issue on production
const SERVER_URL = 'https://letsbunk-uw7g.onrender.com';

async function debugStudentsEndpoint() {
    console.log('🔍 Debugging Students Endpoint Issue...\n');
    
    // First, let's check if the server is responsive
    console.log('1. Testing server responsiveness...');
    try {
        const healthResponse = await fetch(`${SERVER_URL}/api/health`);
        console.log(`✅ Health check: ${healthResponse.status}`);
    } catch (error) {
        console.log(`❌ Health check failed: ${error.message}`);
        return;
    }
    
    // Test if it's a timeout issue by using a shorter timeout
    console.log('\n2. Testing students endpoint with short timeout...');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const studentsResponse = await fetch(`${SERVER_URL}/api/students`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Debug-Test/1.0' }
        });
        
        clearTimeout(timeoutId);
        console.log(`✅ Students endpoint: ${studentsResponse.status}`);
        
        if (studentsResponse.status === 200) {
            const data = await studentsResponse.json();
            console.log(`📊 Response received: ${JSON.stringify(data).substring(0, 200)}...`);
        } else {
            const errorText = await studentsResponse.text();
            console.log(`❌ Error response: ${errorText.substring(0, 200)}...`);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏰ Students endpoint timed out after 5 seconds');
        } else {
            console.log(`❌ Students endpoint error: ${error.message}`);
        }
    }
    
    // Test with query parameters to see if it's a data volume issue
    console.log('\n3. Testing students endpoint with limit parameter...');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const limitedResponse = await fetch(`${SERVER_URL}/api/students?limit=5`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Debug-Test/1.0' }
        });
        
        clearTimeout(timeoutId);
        console.log(`✅ Students with limit: ${limitedResponse.status}`);
        
        if (limitedResponse.status === 200) {
            const data = await limitedResponse.json();
            console.log(`📊 Limited response: ${JSON.stringify(data, null, 2)}`);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏰ Limited students endpoint also timed out');
        } else {
            console.log(`❌ Limited students error: ${error.message}`);
        }
    }
    
    // Check if the issue is with the StudentManagement model vs Student model
    console.log('\n4. Testing student-management endpoint (alternative)...');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const mgmtResponse = await fetch(`${SERVER_URL}/api/student-management?enrollmentNo=TEST001`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Debug-Test/1.0' }
        });
        
        clearTimeout(timeoutId);
        console.log(`✅ Student management: ${mgmtResponse.status}`);
        
        if (mgmtResponse.status === 200) {
            const data = await mgmtResponse.json();
            console.log(`📊 Management response: ${JSON.stringify(data, null, 2)}`);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏰ Student management also timed out');
        } else {
            console.log(`❌ Student management error: ${error.message}`);
        }
    }
    
    console.log('\n🔍 DEBUG COMPLETE');
    console.log('\n💡 ANALYSIS:');
    console.log('If /api/students times out but other endpoints work,');
    console.log('the issue is likely:');
    console.log('1. Large dataset causing timeout');
    console.log('2. Database query optimization needed');
    console.log('3. Model mismatch (Student vs StudentManagement)');
    console.log('4. Missing indexes on the students collection');
}

debugStudentsEndpoint();