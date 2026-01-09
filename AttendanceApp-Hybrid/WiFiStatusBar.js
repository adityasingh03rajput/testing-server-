import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeModules } from 'react-native';
import WiFiManager from './WiFiManager';
import NativeWiFiService from './NativeWiFiService';

/**
 * WiFi Status Bar Component
 * Shows real-time BSSID information for debugging
 */
export default function WiFiStatusBar({ theme, currentRoom = null, serverUrl = null }) {
  const [wifiStatus, setWifiStatus] = useState({
    isConnected: false,
    currentBSSID: null,
    expectedBSSID: null,
    ssid: null,
    isValidating: false,
    lastUpdated: null,
    error: null
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Initial WiFi status check
    checkWiFiStatus();

    // Set up periodic checking every 5 seconds
    const interval = setInterval(checkWiFiStatus, 5000);

    return () => clearInterval(interval);
  }, [currentRoom, serverUrl]);

  const checkWiFiStatus = async () => {
    try {
      setWifiStatus(prev => ({ ...prev, isValidating: true }));

      // Get current BSSID
      const currentBSSID = await WiFiManager.getCurrentBSSID();
      
      // Get expected BSSID for current room
      let expectedBSSID = null;
      if (currentRoom && serverUrl) {
        await WiFiManager.loadAuthorizedBSSIDs(serverUrl);
        const authResult = await WiFiManager.isAuthorizedForRoom(currentRoom);
        expectedBSSID = authResult.expectedBSSID;
      }

      setWifiStatus({
        isConnected: currentBSSID !== null,
        currentBSSID: currentBSSID || 'Not detected',
        expectedBSSID: expectedBSSID || 'Not configured',
        ssid: 'Unknown', // We'll enhance this later
        isValidating: false,
        lastUpdated: new Date().toLocaleTimeString(),
        error: null
      });

    } catch (error) {
      console.error('❌ WiFi status check failed:', error);
      setWifiStatus(prev => ({
        ...prev,
        isValidating: false,
        error: error.message,
        lastUpdated: new Date().toLocaleTimeString()
      }));
    }
  };

  const handleRefresh = () => {
    checkWiFiStatus();
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const showDetailedInfo = () => {
    const info = `WiFi Status Details:

Current BSSID: ${wifiStatus.currentBSSID}
Expected BSSID: ${wifiStatus.expectedBSSID}
Room: ${currentRoom || 'Unknown'}
Connected: ${wifiStatus.isConnected ? 'Yes' : 'No'}
Last Updated: ${wifiStatus.lastUpdated}
${wifiStatus.error ? `Error: ${wifiStatus.error}` : ''}`;

    Alert.alert('WiFi Status', info, [{ text: 'OK' }]);
  };

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
      
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      Alert.alert('Test Failed', `Error: ${error.message}`);
    }
    
    console.log('🔧 === BSSID DETECTION TEST END ===');
  };

  const getStatusColor = () => {
    if (wifiStatus.isValidating) return '#f59e0b'; // Orange for loading
    if (wifiStatus.error) return '#ef4444'; // Red for error
    if (!wifiStatus.isConnected) return '#ef4444'; // Red for not connected
    if (wifiStatus.currentBSSID === wifiStatus.expectedBSSID) return '#10b981'; // Green for match
    return '#f59e0b'; // Orange for mismatch
  };

  const getStatusIcon = () => {
    if (wifiStatus.isValidating) return '🔄';
    if (wifiStatus.error) return '❌';
    if (!wifiStatus.isConnected) return '📶';
    if (wifiStatus.currentBSSID === wifiStatus.expectedBSSID) return '✅';
    return '⚠️';
  };

  const getStatusText = () => {
    if (wifiStatus.isValidating) return 'Checking...';
    if (wifiStatus.error) return 'Error';
    if (!wifiStatus.isConnected) return 'No WiFi';
    if (wifiStatus.currentBSSID === wifiStatus.expectedBSSID) return 'Valid';
    return 'Wrong WiFi';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      {/* Compact Status Bar */}
      <TouchableOpacity 
        style={[styles.statusBar, { borderColor: getStatusColor() }]}
        onPress={handleToggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.statusLeft}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <Text style={[styles.statusText, { color: theme.text }]}>
            WiFi: {getStatusText()}
          </Text>
        </View>
        
        <View style={styles.statusRight}>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshIcon}>🔄</Text>
          </TouchableOpacity>
          <Text style={[styles.expandIcon, { color: theme.textSecondary }]}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={[styles.detailsContainer, { backgroundColor: theme.background }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Room:</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {currentRoom || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Expected BSSID:</Text>
            <Text style={[styles.detailValue, { 
              color: theme.text, 
              fontFamily: 'monospace',
              fontSize: 12 
            }]}>
              {wifiStatus.expectedBSSID}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Current BSSID:</Text>
            <Text style={[styles.detailValue, { 
              color: getStatusColor(),
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 'bold'
            }]}>
              {wifiStatus.currentBSSID}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(), fontWeight: 'bold' }]}>
              {wifiStatus.currentBSSID === wifiStatus.expectedBSSID ? 'MATCH ✅' : 'MISMATCH ❌'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Last Updated:</Text>
            <Text style={[styles.detailValue, { color: theme.textSecondary, fontSize: 12 }]}>
              {wifiStatus.lastUpdated || 'Never'}
            </Text>
          </View>

          {wifiStatus.error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: '#ef4444' }]}>
                Error: {wifiStatus.error}
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              onPress={handleRefresh} 
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.actionButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={showDetailedInfo} 
              style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
            >
              <Text style={styles.actionButtonText}>ℹ️ Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={runBSSIDTest} 
              style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
            >
              <Text style={styles.actionButtonText}>🔧 Test BSSID</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderLeftWidth: 4,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 4,
    marginRight: 8,
  },
  refreshIcon: {
    fontSize: 16,
  },
  expandIcon: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    flex: 2,
    textAlign: 'right',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
  },
  errorText: {
    fontSize: 11,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});