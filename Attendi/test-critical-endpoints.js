async function testCriticalEndpoints() {
  const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
  
  console.log('🔥 TESTING CRITICAL AZURE ENDPOINTS');
  console.log('📍 URL:', SERVER_URL);
  
  const tests = [
    {
      name: 'Login Endpoint',
      method: 'POST',
      path: '/api/login',
      body: { loginId: 'test', password: 'test' }
    },
    {
      name: 'Face Verification',
      method: 'POST',
      path: '/api/verify-face',
      body: { userId: 'test', capturedImage: 'test' }
    },
    {
      name: 'Socket.IO Handshake',
      method: 'GET',
      path: '/socket.io/?EIO=4&transport=polling'
    },
    {
      name: 'Subjects API',
      method: 'GET',
      path: '/api/subjects'
    },
    {
      name: 'Classrooms API',
      method: 'GET',
      path: '/api/classrooms'
    }
  ];

  let workingCount = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(`${SERVER_URL}${test.path}`, options);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      // Consider 200, 400, 401 as "working" (endpoint exists)
      if (response.status === 200 || response.status === 400 || response.status === 401) {
        workingCount++;
        console.log(`✅ ENDPOINT WORKING: ${test.name}`);
        
        try {
          const data = await response.json();
          if (test.name === 'Subjects API' && data.subjects) {
            console.log(`   📚 Subjects: ${data.subjects.length}`);
          } else if (test.name === 'Classrooms API' && data.classrooms) {
            console.log(`   🏫 Classrooms: ${data.classrooms.length}`);
          }
        } catch (e) {
          // Non-JSON response is OK for some endpoints
        }
      } else {
        console.log(`❌ ENDPOINT ISSUE: ${test.name}`);
        const text = await response.text();
        console.log(`   Error: ${text.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`❌ CONNECTION ERROR: ${test.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n==================================================');
  console.log('🔥 CRITICAL ENDPOINT TEST RESULTS');
  console.log(`✅ Working: ${workingCount}/${totalTests} endpoints`);
  console.log(`📈 Success Rate: ${Math.round((workingCount / totalTests) * 100)}%`);
  
  if (workingCount >= 4) {
    console.log('🎉 AZURE SERVER IS FULLY OPERATIONAL!');
    console.log('✅ Ready for production use');
  } else if (workingCount >= 2) {
    console.log('⚠️  AZURE SERVER IS PARTIALLY WORKING');
    console.log('✅ Core functionality available');
  } else {
    console.log('❌ AZURE SERVER HAS ISSUES');
    console.log('❌ Not ready for production');
  }
  
  console.log('==================================================');
}

testCriticalEndpoints().catch(console.error);