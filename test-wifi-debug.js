/**
 * WiFi Debug Test
 * Test WiFi module functionality
 */

console.log('🧪 Testing WiFi module...');

// Test 1: Check if module can be imported
try {
  const WifiReborn = require('react-native-wifi-reborn');
  console.log('✅ react-native-wifi-reborn imported successfully');
  console.log('   Module:', typeof WifiReborn);
  console.log('   Default export:', typeof WifiReborn.default);
  
  if (WifiReborn.default) {
    console.log('   Available methods:', Object.getOwnPropertyNames(WifiReborn.default));
  }
} catch (error) {
  console.error('❌ Failed to import react-native-wifi-reborn:', error);
}

// Test 2: Check permissions
console.log('🔐 Checking permissions...');
try {
  const { PermissionsAndroid } = require('react-native');
  
  const checkPermission = async (permission) => {
    try {
      const result = await PermissionsAndroid.check(permission);
      console.log(`   ${permission}: ${result ? '✅ GRANTED' : '❌ DENIED'}`);
      return result;
    } catch (error) {
      console.log(`   ${permission}: ❌ ERROR - ${error.message}`);
      return false;
    }
  };
  
  // Check required permissions
  checkPermission('android.permission.ACCESS_FINE_LOCATION');
  checkPermission('android.permission.ACCESS_COARSE_LOCATION');
  checkPermission('android.permission.ACCESS_WIFI_STATE');
  checkPermission('android.permission.CHANGE_WIFI_STATE');
  
} catch (error) {
  console.error('❌ Permission check failed:', error);
}

console.log('🧪 WiFi debug test complete');