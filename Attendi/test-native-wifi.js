/**
 * Test Native WiFi Module Integration
 * Run this to verify Kotlin WifiModule is working correctly
 */

import NativeWiFiService from './NativeWiFiService';

async function testNativeWiFi() {
  console.log('🧪 Testing Native WiFi Module Integration...\n');

  try {
    // Test 1: Initialize service
    console.log('📶 Test 1: Initializing Native WiFi Service...');
    const initResult = await NativeWiFiService.initialize();
    console.log(`   Result: ${initResult ? '✅ Success' : '❌ Failed'}\n`);

    // Test 2: Test module connection
    console.log('🔗 Test 2: Testing native module connection...');
    const connectionTest = await NativeWiFiService.testConnection();
    console.log('   Results:');
    console.log(`   - Module exists: ${connectionTest.tests.moduleExists ? '✅' : '❌'}`);
    console.log(`   - Permissions check: ${connectionTest.tests.permissionsCheck ? '✅' : '❌'}`);
    console.log(`   - WiFi state check: ${connectionTest.tests.wifiStateCheck ? '✅' : '❌'}`);
    console.log(`   - BSSID check: ${connectionTest.tests.bssidCheck ? '✅' : '❌'}`);
    console.log(`   Overall: ${connectionTest.success ? '✅ Success' : '❌ Failed'}\n`);

    // Test 3: Check permissions
    console.log('🔐 Test 3: Checking permissions...');
    const permissions = await NativeWiFiService.checkPermissions();
    console.log('   Permissions:');
    console.log(`   - Location: ${permissions.hasLocationPermission ? '✅' : '❌'}`);
    console.log(`   - WiFi: ${permissions.hasWifiPermission ? '✅' : '❌'}`);
    console.log(`   - Background Location: ${permissions.hasBackgroundLocation ? '✅' : '❌'}\n`);

    // Test 4: Get WiFi state
    console.log('📶 Test 4: Getting WiFi state...');
    const wifiState = await NativeWiFiService.getWiFiState();
    console.log('   WiFi State:');
    console.log(`   - Enabled: ${wifiState.isWifiEnabled ? '✅' : '❌'}`);
    console.log(`   - Has Location Permission: ${wifiState.hasLocationPermission ? '✅' : '❌'}`);
    console.log(`   - Android Version: ${wifiState.androidVersion}`);
    console.log(`   - SDK Version: ${wifiState.sdkVersion}\n`);

    // Test 5: Get current BSSID
    console.log('📡 Test 5: Getting current BSSID...');
    const bssidResult = await NativeWiFiService.getCurrentBSSID();
    
    if (bssidResult && !bssidResult.error) {
      console.log('   ✅ BSSID detected successfully:');
      console.log(`   - BSSID: ${bssidResult.bssid}`);
      console.log(`   - SSID: ${bssidResult.ssid}`);
      console.log(`   - Signal Strength: ${bssidResult.rssi} dBm`);
      console.log(`   - Link Speed: ${bssidResult.linkSpeed} Mbps`);
      console.log(`   - Frequency: ${bssidResult.frequency} MHz`);
    } else if (bssidResult && bssidResult.error) {
      console.log(`   ⚠️ BSSID detection failed: ${bssidResult.error}`);
      console.log(`   Message: ${bssidResult.message}`);
      
      if (bssidResult.error === 'permission_denied') {
        console.log('   💡 Solution: Grant location permission in device settings');
      } else if (bssidResult.error === 'wifi_disabled') {
        console.log('   💡 Solution: Enable WiFi on device');
      } else if (bssidResult.error === 'no_bssid') {
        console.log('   💡 Solution: Connect to a WiFi network');
      }
    } else {
      console.log('   ❌ No BSSID result returned');
    }

    console.log('\n📋 Test Summary:');
    console.log('================');
    
    if (connectionTest.success && permissions.hasLocationPermission && wifiState.isWifiEnabled) {
      console.log('✅ Native WiFi integration is working correctly!');
      console.log('   - Kotlin module is properly integrated');
      console.log('   - Permissions are granted');
      console.log('   - WiFi is enabled');
      console.log('   - BSSID detection should work');
    } else {
      console.log('⚠️ Native WiFi integration needs attention:');
      
      if (!connectionTest.success) {
        console.log('   - Native module integration issue');
      }
      if (!permissions.hasLocationPermission) {
        console.log('   - Location permission required');
      }
      if (!wifiState.isWifiEnabled) {
        console.log('   - WiFi needs to be enabled');
      }
    }

    // Test 6: Get detailed info for debugging
    console.log('\n🔍 Detailed Debug Information:');
    const detailedInfo = await NativeWiFiService.getDetailedInfo();
    console.log(JSON.stringify(detailedInfo, null, 2));

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('   Error type:', error.constructor.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
  }
}

// Export for use in other files
export { testNativeWiFi };

// Run test if this file is executed directly
if (require.main === module) {
  testNativeWiFi();
}