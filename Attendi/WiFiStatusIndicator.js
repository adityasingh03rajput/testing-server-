import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import WiFiBSSIDService from './WiFiBSSIDService';

const WiFiStatusIndicator = ({ 
  authorizedBSSID = null, 
  onBSSIDChange = null,
  showDetails = false,
  style = {}
}) => {
  const [wifiStatus, setWifiStatus] = useState({
    connected: false,
    bssid: null,
    ssid: null,
    authorized: false,
    error: null,
    loading: true
  });

  const [permissions, setPermissions] = useState({
    hasLocationPermission: false,
    isWifiEnabled: false
  });

  useEffect(() => {
    initializeWiFi();
    
    // Start monitoring WiFi changes
    WiFiBSSIDService.startMonitoring(handleWiFiChange, 3000);

    return () => {
      WiFiBSSIDService.stopMonitoring();
    };
  }, []);

  useEffect(() => {
    if (authorizedBSSID && wifiStatus.bssid) {
      checkAuthorization();
    }
  }, [authorizedBSSID, wifiStatus.bssid]);

  const initializeWiFi = async () => {
    try {
      // Check permissions first
      const permissionStatus = await WiFiBSSIDService.checkPermissions();
      setPermissions(permissionStatus);

      if (!permissionStatus.hasLocationPermission) {
        setWifiStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Location permission required'
        }));
        return;
      }

      // Get initial WiFi info
      const wifiInfo = await WiFiBSSIDService.getBSSID();
      updateWiFiStatus(wifiInfo);

    } catch (error) {
      console.error('WiFi initialization error:', error);
      setWifiStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const handleWiFiChange = (wifiInfo) => {
    updateWiFiStatus(wifiInfo);
    
    // Notify parent component of BSSID change
    if (onBSSIDChange && wifiInfo.bssidChanged) {
      onBSSIDChange(wifiInfo);
    }
  };

  const updateWiFiStatus = (wifiInfo) => {
    setWifiStatus(prev => ({
      ...prev,
      connected: wifiInfo.success,
      bssid: wifiInfo.bssid,
      ssid: wifiInfo.ssid,
      error: wifiInfo.success ? null : wifiInfo.error,
      loading: false,
      rssi: wifiInfo.rssi,
      linkSpeed: wifiInfo.linkSpeed
    }));
  };

  const checkAuthorization = async () => {
    if (!authorizedBSSID || !wifiStatus.bssid) return;

    try {
      const verification = await WiFiBSSIDService.verifyAuthorizedBSSID(authorizedBSSID);
      setWifiStatus(prev => ({
        ...prev,
        authorized: verification.authorized
      }));
    } catch (error) {
      console.error('Authorization check error:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const result = await WiFiBSSIDService.requestLocationPermissions();
      
      if (result.granted) {
        Alert.alert('Success', 'Permissions granted! WiFi info will now be available.');
        initializeWiFi();
      } else {
        Alert.alert('Permissions Required', 'Location permission is required to access WiFi BSSID information.');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to request permissions: ${error.message}`);
    }
  };

  const showWiFiDetails = () => {
    const details = `
WiFi Information:
• BSSID: ${wifiStatus.bssid || 'Not available'}
• SSID: ${wifiStatus.ssid || 'Not available'}
• Signal: ${wifiStatus.rssi ? `${wifiStatus.rssi} dBm` : 'Unknown'}
• Speed: ${wifiStatus.linkSpeed ? `${wifiStatus.linkSpeed} Mbps` : 'Unknown'}
• Authorized: ${authorizedBSSID ? (wifiStatus.authorized ? 'Yes' : 'No') : 'Not configured'}

Permissions:
• Location: ${permissions.hasLocationPermission ? 'Granted' : 'Denied'}
• WiFi: ${permissions.isWifiEnabled ? 'Enabled' : 'Disabled'}
    `.trim();

    Alert.alert('WiFi Details', details);
  };

  const getStatusColor = () => {
    if (wifiStatus.loading) return '#FFA500'; // Orange
    if (wifiStatus.error) return '#FF4444'; // Red
    if (!wifiStatus.connected) return '#FF4444'; // Red
    if (authorizedBSSID) {
      return wifiStatus.authorized ? '#00AA00' : '#FF4444'; // Green/Red
    }
    return '#00AA00'; // Green
  };

  const getStatusText = () => {
    if (wifiStatus.loading) return 'Checking WiFi...';
    if (wifiStatus.error) return 'WiFi Error';
    if (!permissions.hasLocationPermission) return 'Permission Required';
    if (!permissions.isWifiEnabled) return 'WiFi Disabled';
    if (!wifiStatus.connected) return 'Not Connected';
    if (authorizedBSSID) {
      return wifiStatus.authorized ? 'Authorized Network' : 'Unauthorized Network';
    }
    return 'WiFi Connected';
  };

  const getStatusIcon = () => {
    if (wifiStatus.loading) return '⏳';
    if (wifiStatus.error || !permissions.hasLocationPermission) return '❌';
    if (!wifiStatus.connected) return '📶';
    if (authorizedBSSID) {
      return wifiStatus.authorized ? '✅' : '⚠️';
    }
    return '📶';
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={showDetails ? showWiFiDetails : (!permissions.hasLocationPermission ? requestPermissions : null)}
      activeOpacity={0.7}
    >
      <View style={styles.statusRow}>
        <Text style={styles.icon}>{getStatusIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {wifiStatus.bssid && showDetails && (
            <Text style={styles.bssidText}>
              BSSID: {wifiStatus.bssid}
            </Text>
          )}
        </View>
      </View>
      
      {!permissions.hasLocationPermission && (
        <Text style={styles.permissionHint}>
          Tap to grant location permission
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bssidText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  permissionHint: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default WiFiStatusIndicator;