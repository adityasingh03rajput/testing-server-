async function testEnhancedEndpoints() {
  const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
  
  console.log('🧪 TESTING ENHANCED AZURE ENDPOINTS');
  console.log('📍 URL:', SERVER_URL);
  
  const endpoints = [
    { name: 'Root Endpoint', path: '' },
    { name: 'API Health', path: '/api/health' },
    { name: 'Health (old)', path: '/health' },
    { name: 'API Config', path: '/api/config' },
    { name: 'API Time', path: '/api/time' },
    { name: 'API Students', path: '/api/students' }
  ];

  let workingCount = 0;

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📋 Testing: ${endpoint.name}`);
      const response = await fetch(`${SERVER_URL}${endpoint.path}`);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        workingCount++;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`✅ WORKING: ${endpoint.name}`);
          
          // Show specific info for key endpoints
          if (endpoint.path === '') {
            console.log(`   Version: ${data.version || 'N/A'}`);
            console.log(`   Status: ${data.status || 'N/A'}`);
          } else if (endpoint.path === '/api/health') {
            console.log(`   Uptime: ${Math.floor((data.uptime || 0) / 60)} minutes`);
            console.log(`   Database: ${data.database || 'N/A'}`);
          } else if (endpoint.path === '/api/students') {
            console.log(`   Students: ${data.students?.length || 0}`);
          }
        } else {
          console.log(`✅ WORKING: ${endpoint.name} (Non-JSON)`);
        }
      } else {
        const text = await response.text();
        console.log(`❌ FAILED: ${endpoint.name}`);
        console.log(`   Error: ${text.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${endpoint.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n==================================================');
  console.log('📊 ENHANCED ENDPOINT TEST RESULTS');
  console.log(`✅ Working: ${workingCount}/${endpoints.length} endpoints`);
  console.log(`📈 Success Rate: ${Math.round((workingCount / endpoints.length) * 100)}%`);
  
  if (workingCount >= 3) {
    console.log('🎉 AZURE SERVER IS RECOVERING!');
    console.log('💡 Core API endpoints are functional');
  } else if (workingCount > 0) {
    console.log('⚠️  PARTIAL RECOVERY - Some endpoints working');
  } else {
    console.log('❌ STILL NOT WORKING - All endpoints failing');
  }
  
  console.log('==================================================');
}

testEnhancedEndpoints().catch(console.error);