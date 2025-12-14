const https = require('https');

const RENDER_URL = 'https://letsbunk-uw7g.onrender.com';

async function testRenderServer() {
  console.log('🌐 Testing Render Server Endpoints...');
  console.log('📍 URL:', RENDER_URL);
  
  const endpoints = [
    { name: 'Root', path: '' },
    { name: 'Health Check', path: '/health' },
    { name: 'API Config', path: '/api/config' },
    { name: 'Time Sync', path: '/api/time' },
    { name: 'Students API', path: '/api/students' },
    { name: 'WiFi Event Logging', path: '/api/attendance/wifi-event' },
    { name: 'Student Management', path: '/api/student-management' },
    { name: 'Timetable API', path: '/api/timetable/1/Computer%20Science' },
    { name: 'Subjects API', path: '/api/subjects' },
    { name: 'Classrooms API', path: '/api/classrooms' }
  ];

  let passedTests = 0;
  const totalTests = endpoints.length;

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📋 Testing: ${endpoint.name}`);
      const url = `${RENDER_URL}${endpoint.path}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Deployment-Test/1.0'
        },
        timeout: 10000
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            console.log(`✅ PASS: ${endpoint.name}`);
            console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
            passedTests++;
          } catch (jsonError) {
            console.log(`⚠️  JSON Parse Error: ${jsonError.message}`);
          }
        } else {
          const text = await response.text();
          console.log(`✅ PASS: ${endpoint.name} (Non-JSON)`);
          console.log(`   Response: ${text.substring(0, 100)}...`);
          passedTests++;
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ FAIL: ${endpoint.name}`);
        console.log(`   Error: ${errorText.substring(0, 200)}`);
      }

    } catch (error) {
      console.log(`❌ FAIL: ${endpoint.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n==================================================');
  console.log('📊 RENDER SERVER TEST SUMMARY');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Render server is fully operational!');
  } else if (passedTests > 0) {
    console.log('⚠️  PARTIAL SUCCESS - Some endpoints working');
  } else {
    console.log('❌ ALL TESTS FAILED - Server not responding');
  }
  
  console.log(`🌐 Server URL: ${RENDER_URL}`);
  console.log(`📅 Checked: ${new Date().toLocaleString()}`);
  console.log('==================================================');
}

testRenderServer().catch(console.error);