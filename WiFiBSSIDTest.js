import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import useWiFiBSSID from './useWiFiBSSID';
import WiFiStatusIndicator from './WiFiStatusIndicator';

const WiFiBSSIDTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Example authorized BSSID (you can change this)
  const EXAMPLE_AUTHORIZED_BSSID = "ee:ee:6d:9d:6f:ba";

  const {
    // WiFi State
    isConnected,
    bssid,
    ssid,
    rssi,
    linkSpeed,
    isAuthorized,
    hasLocationPermission,
    isWifiEnabled,
    loading,
    error,
    lastUpdate,
    
    // Actions
    refreshWiFiInfo,
    requestPermissions,
    testWiFiCapabilities,
    
    // Status
    getStatusText,
    getStatusColor,
    isReady
  } = useWiFiBSSID({
    authorizedBSSID: EXAMPLE_AUTHORIZED_BSSID,
    autoStart: true,
    onBSSIDChange: (info) => {
      console.log('BSSID Changed:', info);
      Alert.alert('WiFi Changed', `New BSSID: ${info.currentBSSID}`);
    },
    onAuthorizationChange: (info) => {
      console.log('Authorization Changed:', info);
      const message = info.isAuthorized ? 'Connected to authorized network' : 'Connected to unauthorized network';
      Alert.alert('Authorization Status', message);
    }
  });

  const runComprehensiveTest = async () => {
    setIsRunningTest(true);
    try {
      console.log('🧪 Running comprehensive WiFi BSSID test...');
      
      const results = await testWiFiCapabilities();
      setTestResults(results);
      
      Alert.alert(
        'Test Complete', 
        results.success ? 'All tests passed!' : `Test failed: ${results.error}`
      );
    } catch (error) {
      Alert.alert('Test Error', error.message);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const result = await requestPermissions();
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.message
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshWiFiInfo();
      Alert.alert('Success', 'WiFi information refreshed');
    } catch (error) {
      Alert.alert('Error', `Failed to refresh: ${error.message}`);
    }
  };

  const formatTestResults = (results) => {
    if (!results) return 'No test results available';
    
    return JSON.stringify(results, null, 2);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>WiFi BSSID Test</Text>
      <Text style={styles.subtitle}>Testing LetsBunk WiFi Integration</Text>

      {/* WiFi Status Indicator */}
      <WiFiStatusIndicator 
        authorizedBSSID={EXAMPLE_AUTHORIZED_BSSID}
        showDetails={true}
        style={styles.statusIndicator}
      />

      {/* Current Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* WiFi Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WiFi Information</Text>
        <View style={styles.infoContainer}>
          <InfoRow label="Connected" value={isConnected ? 'Yes' : 'No'} />
          <InfoRow label="BSSID" value={bssid || 'Not available'} />
          <InfoRow label="SSID" value={ssid || 'Not available'} />
          <InfoRow label="Signal Strength" value={rssi ? `${rssi} dBm` : 'Unknown'} />
          <InfoRow label="Link Speed" value={linkSpeed ? `${linkSpeed} Mbps` : 'Unknown'} />
          <InfoRow label="Authorized" value={isAuthorized ? 'Yes' : 'No'} />
          <InfoRow label="Last Update" value={lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'} />
        </View>
      </View>

      {/* Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions & Settings</Text>
        <View style={styles.infoContainer}>
          <InfoRow label="Location Permission" value={hasLocationPermission ? 'Granted' : 'Denied'} />
          <InfoRow label="WiFi Enabled" value={isWifiEnabled ? 'Yes' : 'No'} />
          <InfoRow label="Ready" value={isReady ? 'Yes' : 'No'} />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        {!hasLocationPermission && (
          <TouchableOpacity style={styles.button} onPress={handleRequestPermissions}>
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.button} onPress={handleRefresh}>
          <Text style={styles.buttonText}>Refresh WiFi Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={runComprehensiveTest}
          disabled={isRunningTest}
        >
          {isRunningTest ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Run Comprehensive Test</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      {testResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <ScrollView style={styles.resultsContainer} horizontal>
            <Text style={styles.resultsText}>
              {formatTestResults(testResults)}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This component tests the WiFi BSSID functionality copied from the LetsBunk system.
        </Text>
      </View>
    </ScrollView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  statusIndicator: {
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  infoContainer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    padding: 12,
    maxHeight: 200,
  },
  resultsText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WiFiBSSIDTest;