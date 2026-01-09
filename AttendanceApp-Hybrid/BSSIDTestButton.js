import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { NativeModules } from 'react-native';
import NativeWiFiService from './NativeWiFiService';

/**
 * BSSID Test Button Component
 * Triggers comprehensive BSSID detection test with detailed logging
 */
export default function BSSIDTestButton({ theme }) {
  
  const runBSSIDTest = async () => {
    console.log('🔧 === BSSID DETECTION TEST START ===');
    
    try {
      // Test 1: Check if native module is available
      console.log('📱 Test 1: Checking native module availability...');
      const { WifiModule } = NativeModules;
      
      if (!WifiModule) {
        console.error('❌ WifiModule not found in NativeModules');
        Alert.alert('Error', 'WiFi module not available');
        return;
      }
      
      console.log('✅ WifiModule found');
      
      // Test 2: Check permissions
      console.log('📱 Test 2: Checking permissions...');
      const permissions = await WifiModule.checkPermissions();
      console.log('🔐 Permissions:', JSON.stringify(permissions, null, 2));
      
      const hasLocationPermission = permissions.ACCESS_FINE_LOCATION || permissions.ACCESS_COARSE_LOCATION;
      console.log(`🔐 Has location permission: ${hasLocationPermission}`);
      
      // Test 3: Check WiFi state
      console.log('📱 Test 3: Checking WiFi state...');
      const wifiState = await WifiModule.getWifiState();
      console.log('📶 WiFi State:', JSON.stringify(wifiState, null, 2));
      
      if (!wifiState.isWifiEnabled) {
        console.error('❌ WiFi is disabled on device');
        Alert.alert('WiFi Disabled', 'Please enable WiFi and try again');
        return;
      }
      
      console.log('✅ WiFi is enabled');
      
      // Test 4: Try to get BSSID
      console.log('📱 Test 4: Attempting to get BSSID...');
      let bssidResult;
      let errorMessage = '';
      
      try {
        bssidResult = await WifiModule.getBSSID();
        console.log('🎯 BSSID Result:', JSON.stringify(bssidResult, null, 2));
        
        if (bssidResult.bssid) {
          console.log('✅ SUCCESS: BSSID detected:', bssidResult.bssid);
          console.log('📶 SSID:', bssidResult.ssid);
          console.log('📶 Signal strength:', bssidResult.rssi, 'dBm');
          console.log('📶 Link speed:', bssidResult.linkSpeed, 'Mbps');
          console.log('📶 Frequency:', bssidResult.frequency, 'MHz');
          
          console.log('🔍 BSSID Detection Result:');
          console.log(`   Current BSSID: ${bssidResult.bssid}`);
          console.log(`   SSID: ${bssidResult.ssid}`);
          console.log(`   Signal: ${bssidResult.rssi} dBm`);
          
          // Show success dialog
          Alert.alert(
            '✅ BSSID Detection Success',
            `BSSID: ${bssidResult.bssid}\nSSID: ${bssidResult.ssid}\nSignal: ${bssidResult.rssi} dBm\nFrequency: ${bssidResult.frequency} MHz\nLink Speed: ${bssidResult.linkSpeed} Mbps`,
            [{ text: 'OK' }]
          );
          
        } else {
          console.error('❌ No BSSID in result');
          errorMessage = 'No BSSID detected in result';
        }
        
      } catch (bssidError) {
        console.error('❌ BSSID detection failed:', bssidError);
        console.error('   Error code:', bssidError.code);
        console.error('   Error message:', bssidError.message);
        
        errorMessage = `${bssidError.code}: ${bssidError.message}`;
        
        // Provide specific guidance based on error
        let solution = '';
        if (bssidError.code === 'PERMISSION_DENIED') {
          solution = 'Grant location permission in Android settings';
        } else if (bssidError.code === 'WIFI_DISABLED') {
          solution = 'Enable WiFi on your device';
        } else if (bssidError.code === 'NO_BSSID') {
          solution = 'Connect to a WiFi network';
        }
        
        Alert.alert(
          '❌ BSSID Detection Failed',
          `Error: ${errorMessage}\n\nSolution: ${solution}\n\nPermissions:\nFine Location: ${permissions.ACCESS_FINE_LOCATION ? 'YES' : 'NO'}\nCoarse Location: ${permissions.ACCESS_COARSE_LOCATION ? 'YES' : 'NO'}\nWiFi State: ${permissions.ACCESS_WIFI_STATE ? 'YES' : 'NO'}`,
          [{ text: 'OK' }]
        );
      }
      
      // Test 5: Test using NativeWiFiService wrapper
      console.log('📱 Test 5: Testing NativeWiFiService wrapper...');
      const serviceResult = await NativeWiFiService.validateWiFiWithPermissions();
      console.log('🔧 Service Result:', JSON.stringify(serviceResult, null, 2));
      
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      Alert.alert('Test Failed', `Error: ${error.message}`);
    }
    
    console.log('🔧 === BSSID DETECTION TEST END ===');
  };

  return (
    <TouchableOpacity
      onPress={runBSSIDTest}
      style={[styles.testButton, { backgroundColor: '#8b5cf6' }]}
    >
      <Text style={styles.testButtonText}>🔧 Test BSSID Detection</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  testButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});