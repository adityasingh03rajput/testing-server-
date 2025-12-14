/**
 * Test Classrooms API Endpoint
 * Check if the server is returning classroom BSSID data
 */

const SOCKET_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testClassroomsAPI() {
  console.log('🧪 Testing Classrooms API...');
  console.log('🌐 Server URL:', SOCKET_URL);
  
  try {
    // Test the classrooms endpoint
    const url = `${SOCKET_URL}/api/classrooms`;
    console.log('📡 Fetching:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📡 Response data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.classrooms) {
      console.log(`✅ Found ${data.classrooms.length} classrooms`);
      
      // Look for room A2 specifically
      const roomA2 = data.classrooms.find(room => room.roomNumber === 'A2');
      if (roomA2) {
        console.log('🎯 Found room A2:', JSON.stringify(roomA2, null, 2));
        console.log(`   BSSID: ${roomA2.wifiBSSID}`);
        console.log(`   Active: ${roomA2.isActive}`);
      } else {
        console.log('❌ Room A2 not found in classrooms data');
        console.log('Available rooms:', data.classrooms.map(r => r.roomNumber).join(', '));
      }
    } else {
      console.log('❌ Invalid response format or no classrooms data');
    }
    
  } catch (error) {
    console.error('❌ Error testing classrooms API:', error);
    console.error('   Error type:', error.constructor.name);
    console.error('   Error message:', error.message);
  }
}

// Run the test
testClassroomsAPI();