const https = require('https');

const serverUrl = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

console.log('Testing Azure server deployment...');
console.log('Server URL:', serverUrl);

// Test health endpoint
const testEndpoint = (path, description) => {
  return new Promise((resolve) => {
    const url = `${serverUrl}${path}`;
    console.log(`\n🔍 Testing ${description}: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${description} - Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`📊 Response:`, parsed);
          } catch (e) {
            console.log(`📄 Response:`, data.substring(0, 200));
          }
        }
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description} - Error:`, err.message);
      resolve({ error: err.message });
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ ${description} - Timeout`);
      req.destroy();
      resolve({ error: 'Timeout' });
    });
  });
};

async function runTests() {
  const tests = [
    ['/', 'Root endpoint'],
    ['/api/health', 'Health check'],
    ['/api/students', 'Students API'],
    ['/api/teachers', 'Teachers API'],
    ['/api/timetable/3/B.Tech%20Data%20Science', 'Timetable API']
  ];
  
  for (const [path, description] of tests) {
    await testEndpoint(path, description);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }
  
  console.log('\n🏁 Test completed!');
}

runTests().catch(console.error);