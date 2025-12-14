/**
 * Xiaomi/MIUI WiFi BSSID Testing Script
 * Specifically designed for Xiaomi devices with MIUI and Android 13+
 */

import { NativeModules, PermissionsAndroid, Platform, Alert } from 'react-native';
import WiFiBSSIDService from './WiFiBSSIDService';
import NativeWiFiService from './NativeWiFiService';

const { WifiModule } = NativeModules;

class XiaomiWiFiTester {
  
  async runComprehensiveTest() {
    console.log('🔬 Xiaomi/MIUI WiFi BSSID Comprehensive Test');
    console.log('=' .repeat(60));
    console.log(`📱 Device: ${Platform.OS} ${Platform.Version}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log('');

    const results = {
      deviceInfo: {},
      permissions: {},
      wifiState: {},
      bssidTests: {},
      recommendations: []
    };

    try {
      // Step 1: Device Information
      console.log('📱 Step 1: Device Information');
      console.log('-'.repeat(40));
      
      if (WifiModule) {
        const wifiState = await WifiModule.getWifiState();
        results.deviceInfo = wifiState;
        
        console.log(`Manufacturer: ${wifiState.manufacturer}`);
        console.log(`Model: ${wifiState.model}`);
        console.log(`Android Version: ${wifiState.androidVersion} (SDK ${wifiState.sdkVersion})`);
        console.log(`Security Patch: ${wifiState.securityPatch}`);
        
        // Xiaomi-specific detection
        if (wifiState.manufacturer?.toLowerCase().includes('xiaomi')) {
          console.log('🎯 Xiaomi device detected - applying MIUI-specific tests');
          results.recommendations.push('MIUI device detected - special handling required');
        }
      }

      // Step 2: Permission Analysis
      console.log('\n🔐 Step 2: Permission Analysis');
      console.log('-'.repeat(40));
      
      if (WifiModule) {
        const permissions = await WifiModule.checkPermissions();
        results.permissions = permissions;
        
        console.log('Permission Status:');
        Object.entries(permissions).forEach(([key, value]) => {
          const status = value ? '✅' : '❌';
          console.log(`  ${status} ${key}: ${value}`);
        });

        // Check for Android 13+ specific permissions
        if (permissions.sdkVersion >= 33) {
          if (!permissions.NEARBY_WIFI_DEVICES) {
            results.recommendations.push('Android 13+: Grant "Nearby WiFi devices" permission');
          }
        }
      }

      // Step 3: Request Missing Permissions
      console.log('\n🔑 Step 3: Permission Request');
      console.log('-'.repeat(40));
      
      const missingPermissions = [];
      
      // Check location permissions
      const fineLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      const coarseLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
      
      if (!fineLocation && !coarseLocation) {
        missingPermissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }

      // For Android 13+, check nearby WiFi devices
      if (Platform.Version >= 33) {
        try {
          const nearbyWifi = await PermissionsAndroid.check('android.permission.NEARBY_WIFI_DEVICES');
          if (!nearbyWifi) {
            missingPermissions.push('android.permission.NEARBY_WIFI_DEVICES');
          }
        } catch (e) {
          console.log('⚠️ Could not check NEARBY_WIFI_DEVICES permission');
        }
      }

      if (missingPermissions.length > 0) {
        console.log(`❌ Missing ${missingPermissions.length} permissions`);
        console.log('Requesting permissions...');
        
        try {
          const granted = await PermissionsAndroid.requestMultiple(missingPermissions);
          console.log('Permission results:', granted);
        } catch (permError) {
          console.log('❌ Permission request failed:', permError);
        }
      } else {
        console.log('✅ All required permissions granted');
      }

      // Step 4: WiFi State Check
      console.log('\n📶 Step 4: WiFi State Check');
      console.log('-'.repeat(40));
      
      if (WifiModule) {
        const wifiState = await WifiModule.getWifiState();
        results.wifiState = wifiState;
        
        console.log(`WiFi Enabled: ${wifiState.isWifiEnabled ? '✅' : '❌'}`);
        console.log(`Location Permission: ${wifiState.hasLocationPermission ? '✅' : '❌'}`);
        console.log(`Enhanced Permission: ${wifiState.hasEnhancedLocationPermission ? '✅' : '❌'}`);
        
        if (!wifiState.isWifiEnabled) {
          results.recommendations.push('Enable WiFi on device');
        }
      }

      // Step 5: BSSID Detection Tests
      console.log('\n🔬 Step 5: BSSID Detection Tests');
      console.log('-'.repeat(40));
      
      // Test 5a: Standard method
      console.log('\n5a. Standard BSSID fetch:');
      try {
        const standardResult = await WiFiBSSIDService.getBSSID();
        results.bssidTests.standard = standardResult;
        
        if (standardResult.success) {
          console.log(`✅ Success: ${standardResult.bssid}`);
          console.log(`   SSID: ${standardResult.ssid}`);
          console.log(`   Method: ${standardResult.method}`);
          console.log(`   Signal: ${standardResult.rssi} dBm`);
        } else {
          console.log(`❌ Failed: ${standardResult.error}`);
        }
      } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
        results.bssidTests.standard = { success: false, error: error.message };
      }

      // Test 5b: All methods test
      console.log('\n5b. All methods test:');
      try {
        const allMethodsResult = await WiFiBSSIDService.testAllBSSIDMethods();
        results.bssidTests.allMethods = allMethodsResult;
        
        if (allMethodsResult.success) {
          const workingMethods = allMethodsResult.methodResults.filter(m => m.success);
          console.log(`✅ ${workingMethods.length}/${allMethodsResult.methodResults.length} methods successful`);
          
          workingMethods.forEach(method => {
            console.log(`   ✅ ${method.method}: ${method.data?.bssid || 'No BSSID'}`);
          });
          
          const failedMethods = allMethodsResult.methodResults.filter(m => !m.success);
          failedMethods.forEach(method => {
            console.log(`   ❌ ${method.method}: ${method.error}`);
          });
        } else {
          console.log(`❌ All methods test failed: ${allMethodsResult.error}`);
        }
      } catch (error) {
        console.log(`❌ All methods exception: ${error.message}`);
        results.bssidTests.allMethods = { success: false, error: error.message };
      }

      // Test 5c: Native service test
      console.log('\n5c. Native service test:');
      try {
        const nativeResult = await NativeWiFiService.getCurrentBSSID();
        results.bssidTests.native = nativeResult;
        
        if (nativeResult.success) {
          console.log(`✅ Native success: ${nativeResult.bssid}`);
        } else {
          console.log(`❌ Native failed: ${nativeResult.error}`);
        }
      } catch (error) {
        console.log(`❌ Native exception: ${error.message}`);
        results.bssidTests.native = { success: false, error: error.message };
      }

      // Step 6: Xiaomi/MIUI Specific Recommendations
      console.log('\n💡 Step 6: Xiaomi/MIUI Specific Recommendations');
      console.log('-'.repeat(40));
      
      const xiaomiRecommendations = [
        '1. WiFi Settings → Advanced → Enhanced Privacy → Disable',
        '2. WiFi Settings → Use randomized MAC → Turn OFF',
        '3. Settings → Apps → Permissions → Location → Allow all the time',
        '4. Settings → Additional Settings → Developer Options → MIUI Optimization → Disable',
        '5. Settings → Privacy → Location Services → High accuracy mode',
        '6. For Android 13+: Settings → Apps → Special Permissions → Nearby devices → Grant',
        '7. Restart WiFi connection after changing settings',
        '8. Try connecting to a different WiFi network for testing'
      ];
      
      xiaomiRecommendations.forEach(rec => {
        console.log(`   ${rec}`);
        results.recommendations.push(rec);
      });

      // Step 7: Final Analysis
      console.log('\n📊 Step 7: Final Analysis');
      console.log('-'.repeat(40));
      
      const hasWorkingMethod = Object.values(results.bssidTests).some(test => test.success);
      
      if (hasWorkingMethod) {
        console.log('✅ SUCCESS: At least one BSSID detection method is working');
        console.log('   The app should be able to detect WiFi BSSID for attendance');
      } else {
        console.log('❌ FAILURE: No BSSID detection methods are working');
        console.log('   Follow the recommendations above to fix the issue');
        
        // Additional troubleshooting
        console.log('\n🔧 Additional Troubleshooting:');
        console.log('   • Ensure you are connected to a WiFi network');
        console.log('   • Check if WiFi network uses WPA2/WPA3 security');
        console.log('   • Try connecting to a mobile hotspot for testing');
        console.log('   • Restart the device and try again');
        console.log('   • Check if device has any WiFi privacy features enabled');
      }

    } catch (error) {
      console.error('❌ Test suite error:', error);
      results.error = error.message;
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔬 Xiaomi/MIUI WiFi BSSID Test Completed');
    
    return results;
  }

  /**
   * Show user-friendly alert with results
   */
  async showTestResults() {
    const results = await this.runComprehensiveTest();
    
    const hasWorkingMethod = Object.values(results.bssidTests || {}).some(test => test.success);
    
    const title = hasWorkingMethod ? '✅ WiFi Test Successful' : '❌ WiFi Test Failed';
    const message = hasWorkingMethod 
      ? 'WiFi BSSID detection is working. The attendance system should function properly.'
      : 'WiFi BSSID detection failed. Please follow the recommendations in the console log to fix the issue.';
    
    Alert.alert(title, message, [
      { text: 'OK', style: 'default' }
    ]);
    
    return results;
  }
}

// Export for use
export default new XiaomiWiFiTester();

// Also export the class
export { XiaomiWiFiTester };