/**
 * Test BSSID Detection Script
 * Tests the native Kotlin WiFi module directly
 */

const { NativeModules } = require('react-native');
const NativeWiFiService = require('./NativeWiFiService').default;

async function testBSSIDDetection() {
  console.log('🔧 === BSSID DETECTION TEST START ===');
  
  try {
    // Test 1: Check if native module is available
    console.log('📱 Test 1: Checking native module availability...');
    const { WifiModule } = NativeModules;
    
    if (!WifiModule) {
      console.error('❌ WifiModule not found in NativeModules');
      console.log('Available modules:', Object.keys(NativeModules));
      return;
    }
    
    console.log('✅ WifiModule found');
    
    // Test 2: Check permissions
    console.log('📱 Test 2: Checking permissions...');
    try {
      const permissions = await WifiModule.checkPermissions();
      console.log('🔐 Permissions:', JSON.stringify(permissions, null, 2));
      
      const hasLocationPermission = permissions.ACCESS_FINE_LOCATION || permissions.ACCESS_COARSE_LOCATION;
      console.log(`🔐 Has location permission: ${hasLocationPermission}`);
      
      if (!hasLocationPermission) {
        console.warn('⚠️ Location permission not granted - BSSID detection may fail');
      }
    } catch (permError) {
      console.error('❌ Permission check failed:', permError);
    }
    
    // Test 3: Check WiFi state
    console.log('📱 Test 3: Checking WiFi state...');
    try {
      const wifiState = await WifiModule.getWifiState();
      console.log('📶 WiFi State:', JSON.stringify(wifiState, null, 2));
      
      if (!wifiState.isWifiEnabled) {
        console.error('❌ WiFi is disabled on device');
        return;
      }
      
      console.log('✅ WiFi is enabled');
    } catch (stateError) {
      console.error('❌ WiFi state check failed:', stateError);
    }
    
    // Test 4: Try to get BSSID
    console.log('📱 Test 4: Attempting to get BSSID...');
    try {
      const bssidResult = await WifiModule.getBSSID();
      console.log('🎯 BSSID Result:', JSON.stringify(bssidResult, null, 2));
      
      if (bssidResult.bssid) {
        console.log('✅ SUCCESS: BSSID detected:', bssidResult.bssid);
        console.log('📶 SSID:', bssidResult.ssid);
        console.log('📶 Signal strength:', bssidResult.rssi, 'dBm');
        console.log('📶 Link speed:', bssidResult.linkSpeed, 'Mbps');
        console.log('📶 Frequency:', bssidResult.frequency, 'MHz');
        
        // Check if this matches expected BSSID for room A2
        const expectedBSSID = 'b4:86:18:6f:fb:ec';
        const currentBSSID = bssidResult.bssid.toLowerCase();
        
        console.log('🔍 BSSID Comparison:');
        console.log(`   Expected: ${expectedBSSID}`);
        console.log(`   Current:  ${currentBSSID}`);
        console.log(`   Match:    ${currentBSSID === expectedBSSID ? '✅ YES' : '❌ NO'}`);
        
      } else {
        console.error('❌ No BSSID in result');
      }
      
    } catch (bssidError) {
      console.error('❌ BSSID detection failed:', bssidError);
      console.error('   Error code:', bssidError.code);
      console.error('   Error message:', bssidError.message);
      
      // Provide specific guidance based on error
      if (bssidError.code === 'PERMISSION_DENIED') {
        console.log('💡 Solution: Grant location permission in Android settings');
      } else if (bssidError.code === 'WIFI_DISABLED') {
        console.log('💡 Solution: Enable WiFi on your device');
      } else if (bssidError.code === 'NO_BSSID') {
        console.log('💡 Solution: Connect to a WiFi network');
      }
    }
    
    // Test 5: Test using NativeWiFiService wrapper
    console.log('📱 Test 5: Testing NativeWiFiService wrapper...');
    try {
      const serviceResult = await NativeWiFiService.validateWiFiWithPermissions();
      console.log('🔧 Service Result:', JSON.stringify(serviceResult, null, 2));
      
      if (serviceResult.success) {
        console.log('✅ NativeWiFiService working correctly');
        console.log(`📶 Current BSSID: ${serviceResult.currentBSSID}`);
      } else {
        console.error('❌ NativeWiFiService failed:', serviceResult.error);
      }
    } catch (serviceError) {
      console.error('❌ NativeWiFiService error:', serviceError);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
  
  console.log('🔧 === BSSID DETECTION TEST END ===');
}

// Export for use in React Native
module.exports = { testBSSIDDetection };

// If running directly (for testing)
if (typeof global !== 'undefined' && global.testBSSIDDetection) {
  testBSSIDDetection();
}