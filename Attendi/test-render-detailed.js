async function testRenderDetailed() {
  const RENDER_URL = 'https://letsbunk-uw7g.onrender.com';
  
  console.log('🔍 DETAILED RENDER SERVER TESTING');
  console.log('📍 URL:', RENDER_URL);
  
  // Test critical endpoints with POST requests
  const tests = [
    {
      name: 'Student Registration',
      method: 'POST',
      path: '/api/students',
      body: {
        name: 'Test Student',
        enrollmentNo: 'TEST001',
        semester: '1',
        branch: 'Computer Science'
      }
    },
    {
      name: 'Face Verification',
      method: 'POST', 
      path: '/api/verify-face',
      body: {
        studentId: 'TEST001',
        imageData: 'data:image/jpeg;base64,test'
      }
    },
    {
      name: 'Timer Update',
      method: 'POST',
      path: '/api/attendance/update-timer',
      body: {
        studentId: 'TEST001',
        timerValue: 300,
        wifiConnected: true
      }
    },
    {
      name: 'WiFi Event (POST)',
      method: 'POST',
      path: '/api/attendance/wifi-event',
      body: {
        studentId: 'TEST001',
        type: 'connected',
        bssid: 'b4:86:18:6f:fb:ec',
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Login Endpoint',
      method: 'POST',
      path: '/api/login',
      body: {
        loginId: 'teacher001',
        password: 'test123'
      }
    }
  ];

  let workingEndpoints = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      
      const response = await fetch(`${RENDER_URL}${test.path}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(test.body)
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok || response.status === 400 || response.status === 401) {
        // 400/401 means endpoint exists but validation failed (expected)
        try {
          const data = await response.json();
          console.log(`✅ ENDPOINT EXISTS: ${test.name}`);
          console.log(`   Response: ${JSON.stringify(data).substring(0, 150)}...`);
          workingEndpoints++;
        } catch (e) {
          console.log(`⚠️  Response not JSON: ${test.name}`);
        }
      } else {
        const text = await response.text();
        console.log(`❌ ENDPOINT ISSUE: ${test.name}`);
        console.log(`   Error: ${text.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`❌ CONNECTION ERROR: ${test.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  // Test Socket.IO connectivity
  console.log('\n🔌 Testing Socket.IO Connection...');
  try {
    const socketResponse = await fetch(`${RENDER_URL}/socket.io/?EIO=4&transport=polling`);
    console.log(`   Socket.IO Status: ${socketResponse.status}`);
    if (socketResponse.ok) {
      console.log('✅ Socket.IO endpoint accessible');
      workingEndpoints++;
    } else {
      console.log('❌ Socket.IO endpoint not accessible');
    }
  } catch (error) {
    console.log(`❌ Socket.IO test failed: ${error.message}`);
  }

  console.log('\n==================================================');
  console.log('📊 DETAILED TEST SUMMARY');
  console.log(`✅ Working Endpoints: ${workingEndpoints}/${tests.length + 1}`);
  console.log(`📈 Functionality Rate: ${Math.round((workingEndpoints / (tests.length + 1)) * 100)}%`);
  
  if (workingEndpoints >= 4) {
    console.log('🎉 RENDER SERVER IS OPERATIONAL!');
    console.log('💡 Recommendation: Switch client to use Render URL');
  } else {
    console.log('⚠️  Limited functionality available');
  }
  
  console.log('==================================================');
}

testRenderDetailed().catch(console.error);