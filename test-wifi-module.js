/**
 * Test WiFi Module Loading
 * Quick test to see if react-native-wifi-reborn is properly linked
 */

console.log('🧪 Testing WiFi module loading...');

try {
  const WifiReborn = require('react-native-wifi-reborn');
  console.log('✅ react-native-wifi-reborn imported successfully');
  console.log('   Module type:', typeof WifiReborn);
  console.log('   Default export:', typeof WifiReborn.default);
  console.log('   Available methods:', Object.keys(WifiReborn.default || WifiReborn));
} catch (error) {
  console.error('❌ Failed to import react-native-wifi-reborn:', error);
  console.error('   Error message:', error.message);
  console.error('   Error code:', error.code);
}

console.log('🧪 Test complete');