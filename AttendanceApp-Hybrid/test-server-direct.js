const https = require('https');

const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testServerDirect() {
  console.log('🌐 Testing Server Direct Connection...');
  console.log('📍 URL:', SERVER_URL);
  
  // Test basic connectivity
  try {
    console.log('\n1️⃣ Testing basic HTTP response...');
    const response = await fetch(SERVER_URL);
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    console.log('   Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('   Response Length:', text.length);
    console.log('   First 200 chars:', text.substring(0, 200));
    
  } catch (error) {
    console.error('❌ Basic connection failed:', error.message);
  }
  
  // Test API endpoint
  try {
    console.log('\n2️⃣ Testing API endpoint...');
    const apiResponse = await fetch(`${SERVER_URL}/api/config`);
    console.log('   API Status:', apiResponse.status);
    console.log('   API Content-Type:', apiResponse.headers.get('content-type'));
    
    const apiText = await apiResponse.text();
    console.log('   API Response Length:', apiText.length);
    console.log('   API First 200 chars:', apiText.substring(0, 200));
    
  } catch (error) {
    console.error('❌ API endpoint failed:', error.message);
  }
  
  // Test health endpoint
  try {
    console.log('\n3️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    console.log('   Health Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   Health Data:', JSON.stringify(healthData, null, 2));
    } else {
      const healthText = await healthResponse.text();
      console.log('   Health Response:', healthText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message);
  }
}

testServerDirect();