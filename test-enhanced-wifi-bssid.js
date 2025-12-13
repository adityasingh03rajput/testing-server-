/**
 * Enhanced WiFi BSSID Testing Script
 * Tests all BSSID detection methods for Android 13+ and MIUI devices
 */

const { NativeModules } = require('react-native');

const { WifiModule } = NativeModules;

async function testEnhancedWiFiBSSID() {
    console.log('🧪 Enhanced WiFi BSSID Testing Started');
    console.log('=' .repeat(60));
    
    if (!WifiModule) {
        console.error('❌ WifiModule not available');
        return;
    }

    try {
        // Test 1: Check WiFi State and Permissions
        console.log('\n📋 Test 1: WiFi State and Permissions');
        console.log('-'.repeat(40));
        
        const wifiState = await WifiModule.getWifiState();
        console.log('WiFi State:', JSON.stringify(wifiState, null, 2));
        
        // Test 2: Check All Permissions
        console.log('\n🔐 Test 2: Permission Status');
        console.log('-'.repeat(40));
        
        const permissions = await WifiModule.checkPermissions();
        console.log('Permissions:', JSON.stringify(permissions, null, 2));
        
        // Test 3: Standard BSSID Fetch
        console.log('\n📶 Test 3: Standard BSSID Fetch');
        console.log('-'.repeat(40));
        
        try {
            const bssidResult = await WifiModule.getBSSID();
            console.log('✅ BSSID Success:', JSON.stringify(bssidResult, null, 2));
        } catch (bssidError) {
            console.log('❌ BSSID Error:', bssidError.message);
            console.log('   Code:', bssidError.code);
        }
        
        // Test 4: Test All Methods
        console.log('\n🔬 Test 4: All BSSID Detection Methods');
        console.log('-'.repeat(40));
        
        try {
            const allMethodsResult = await WifiModule.testAllBSSIDMethods();
            console.log('All Methods Result:', JSON.stringify(allMethodsResult, null, 2));
            
            // Analyze results
            const methodResults = allMethodsResult.methodResults;
            const successfulMethods = methodResults.filter(result => result.success);
            
            console.log('\n📊 Analysis:');
            console.log(`   Total methods tested: ${methodResults.length}`);
            console.log(`   Successful methods: ${successfulMethods.length}`);
            
            if (successfulMethods.length > 0) {
                console.log('\n✅ Working Methods:');
                successfulMethods.forEach(method => {
                    console.log(`   • ${method.method}: ${method.data?.bssid || 'No BSSID'}`);
                    if (method.data?.ssid) {
                        console.log(`     SSID: ${method.data.ssid}`);
                    }
                    if (method.data?.rssi) {
                        console.log(`     Signal: ${method.data.rssi} dBm`);
                    }
                });
            } else {
                console.log('\n❌ No methods successfully detected BSSID');
                console.log('\n🔧 Troubleshooting Steps:');
                console.log('   1. Ensure WiFi is connected');
                console.log('   2. Grant location permissions in device settings');
                console.log('   3. For Android 13+: Grant "Nearby WiFi devices" permission');
                console.log('   4. For MIUI: Disable "Enhanced privacy" in WiFi settings');
                console.log('   5. Try connecting to a different WiFi network');
            }
            
        } catch (allMethodsError) {
            console.log('❌ All Methods Test Error:', allMethodsError.message);
        }
        
        // Test 5: Device-Specific Recommendations
        console.log('\n💡 Test 5: Device-Specific Recommendations');
        console.log('-'.repeat(40));
        
        if (wifiState.manufacturer?.toLowerCase().includes('xiaomi')) {
            console.log('📱 Xiaomi/MIUI Device Detected');
            console.log('   Recommendations:');
            console.log('   • Go to WiFi Settings > Advanced > Enhanced Privacy');
            console.log('   • Disable "Use device MAC" or "Enhanced privacy"');
            console.log('   • Enable "Use randomized MAC" = OFF');
            console.log('   • Grant location permission with "Allow all the time"');
            console.log('   • Disable MIUI Optimization in Developer Options');
        }
        
        if (wifiState.sdkVersion >= 33) {
            console.log('📱 Android 13+ Device Detected');
            console.log('   Required Permissions:');
            console.log('   • Location (Fine/Coarse)');
            console.log('   • Nearby WiFi Devices');
            console.log('   • WiFi State Access');
        }
        
        // Test 6: Permission Request Guidance
        console.log('\n🔐 Test 6: Permission Request Guidance');
        console.log('-'.repeat(40));
        
        try {
            const permissionGuidance = await WifiModule.requestLocationPermission();
            console.log('Permission Guidance:', JSON.stringify(permissionGuidance, null, 2));
        } catch (permissionError) {
            console.log('❌ Permission Guidance Error:', permissionError.message);
        }
        
    } catch (error) {
        console.error('❌ Test Suite Error:', error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Enhanced WiFi BSSID Testing Completed');
}

// Export for use in React Native
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testEnhancedWiFiBSSID };
}

// Run if called directly
if (require.main === module) {
    testEnhancedWiFiBSSID().catch(console.error);
}