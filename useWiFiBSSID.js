import { useState, useEffect, useCallback } from 'react';
import WiFiBSSIDService from './WiFiBSSIDService';

/**
 * Custom hook for WiFi BSSID functionality
 * Copied logic from LetsBunk MainActivity.kt WiFi handling
 */
const useWiFiBSSID = (options = {}) => {
  const {
    authorizedBSSID = null,
    monitoringInterval = 5000,
    autoStart = true,
    onBSSIDChange = null,
    onAuthorizationChange = null
  } = options;

  const [wifiState, setWifiState] = useState({
    // Connection state
    isConnected: false,
    isMonitoring: false,
    
    // WiFi information
    bssid: null,
    ssid: null,
    rssi: null,
    linkSpeed: null,
    frequency: null,
    
    // Authorization
    isAuthorized: false,
    authorizedBSSID: authorizedBSSID,
    
    // Permissions
    hasLocationPermission: false,
    hasWifiPermission: false,
    isWifiEnabled: false,
    
    // Status
    loading: true,
    error: null,
    lastUpdate: null
  });

  // Initialize WiFi monitoring
  useEffect(() => {
    if (autoStart) {
      initializeWiFi();
    }

    return () => {
      stopMonitoring();
    };
  }, [autoStart]);

  // Monitor authorization changes
  useEffect(() => {
    if (authorizedBSSID && wifiState.bssid) {
      checkAuthorization();
    }
  }, [authorizedBSSID, wifiState.bssid]);

  const initializeWiFi = async () => {
    try {
      setWifiState(prev => ({ ...prev, loading: true, error: null }));

      // Check permissions and WiFi state
      const permissionStatus = await WiFiBSSIDService.checkPermissions();
      
      setWifiState(prev => ({
        ...prev,
        hasLocationPermission: permissionStatus.hasLocationPermission,
        hasWifiPermission: permissionStatus.hasWifiPermission,
        isWifiEnabled: permissionStatus.isWifiEnabled,
        loading: false
      }));

      if (!permissionStatus.hasLocationPermission) {
        setWifiState(prev => ({
          ...prev,
          error: 'Location permission required for BSSID access'
        }));
        return;
      }

      if (!permissionStatus.isWifiEnabled) {
        setWifiState(prev => ({
          ...prev,
          error: 'WiFi is not enabled'
        }));
        return;
      }

      // Get initial WiFi information
      await refreshWiFiInfo();

    } catch (error) {
      console.error('WiFi initialization error:', error);
      setWifiState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const refreshWiFiInfo = async () => {
    try {
      const wifiInfo = await WiFiBSSIDService.getBSSID();
      
      const newState = {
        isConnected: wifiInfo.success,
        bssid: wifiInfo.bssid,
        ssid: wifiInfo.ssid,
        rssi: wifiInfo.rssi,
        linkSpeed: wifiInfo.linkSpeed,
        frequency: wifiInfo.frequency,
        error: wifiInfo.success ? null : wifiInfo.error,
        lastUpdate: new Date().toISOString()
      };

      setWifiState(prev => ({ ...prev, ...newState }));

      return wifiInfo;
    } catch (error) {
      console.error('WiFi refresh error:', error);
      setWifiState(prev => ({
        ...prev,
        isConnected: false,
        error: error.message,
        lastUpdate: new Date().toISOString()
      }));
      throw error;
    }
  };

  const checkAuthorization = async () => {
    if (!authorizedBSSID || !wifiState.bssid) {
      setWifiState(prev => ({ ...prev, isAuthorized: false }));
      return false;
    }

    try {
      const verification = await WiFiBSSIDService.verifyAuthorizedBSSID(authorizedBSSID);
      
      const wasAuthorized = wifiState.isAuthorized;
      const isNowAuthorized = verification.authorized;

      setWifiState(prev => ({
        ...prev,
        isAuthorized: isNowAuthorized,
        authorizedBSSID: authorizedBSSID
      }));

      // Notify of authorization change
      if (wasAuthorized !== isNowAuthorized && onAuthorizationChange) {
        onAuthorizationChange({
          isAuthorized: isNowAuthorized,
          currentBSSID: wifiState.bssid,
          authorizedBSSID,
          changed: true
        });
      }

      return isNowAuthorized;
    } catch (error) {
      console.error('Authorization check error:', error);
      setWifiState(prev => ({ ...prev, isAuthorized: false }));
      return false;
    }
  };

  const startMonitoring = useCallback(() => {
    if (wifiState.isMonitoring) {
      console.log('WiFi monitoring already active');
      return;
    }

    console.log('Starting WiFi BSSID monitoring...');
    
    WiFiBSSIDService.startMonitoring((wifiInfo) => {
      const previousBSSID = wifiState.bssid;
      
      setWifiState(prev => ({
        ...prev,
        isConnected: wifiInfo.success,
        bssid: wifiInfo.bssid,
        ssid: wifiInfo.ssid,
        rssi: wifiInfo.rssi,
        linkSpeed: wifiInfo.linkSpeed,
        frequency: wifiInfo.frequency,
        error: wifiInfo.success ? null : wifiInfo.error,
        lastUpdate: new Date().toISOString()
      }));

      // Notify of BSSID change
      if (wifiInfo.bssidChanged && onBSSIDChange) {
        onBSSIDChange({
          currentBSSID: wifiInfo.bssid,
          previousBSSID,
          wifiInfo,
          timestamp: new Date().toISOString()
        });
      }
    }, monitoringInterval);

    setWifiState(prev => ({ ...prev, isMonitoring: true }));
  }, [wifiState.isMonitoring, wifiState.bssid, monitoringInterval, onBSSIDChange]);

  const stopMonitoring = useCallback(() => {
    WiFiBSSIDService.stopMonitoring();
    setWifiState(prev => ({ ...prev, isMonitoring: false }));
    console.log('WiFi monitoring stopped');
  }, []);

  const requestPermissions = async () => {
    try {
      const result = await WiFiBSSIDService.requestLocationPermissions();
      
      if (result.granted) {
        await initializeWiFi();
        return { success: true, message: 'Permissions granted' };
      } else {
        return { success: false, message: 'Permissions denied' };
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return { success: false, message: error.message };
    }
  };

  const testWiFiCapabilities = async () => {
    try {
      const testResults = await WiFiBSSIDService.testWiFiCapabilities();
      return testResults;
    } catch (error) {
      console.error('WiFi test error:', error);
      return { success: false, error: error.message };
    }
  };

  // Return hook interface
  return {
    // State
    ...wifiState,
    
    // Actions
    refreshWiFiInfo,
    startMonitoring,
    stopMonitoring,
    requestPermissions,
    checkAuthorization,
    testWiFiCapabilities,
    
    // Computed values
    isReady: !wifiState.loading && wifiState.hasLocationPermission && wifiState.isWifiEnabled,
    needsPermission: !wifiState.hasLocationPermission,
    needsWiFi: !wifiState.isWifiEnabled,
    
    // Status helpers
    getStatusText: () => {
      if (wifiState.loading) return 'Checking WiFi...';
      if (wifiState.error) return `Error: ${wifiState.error}`;
      if (!wifiState.hasLocationPermission) return 'Location permission required';
      if (!wifiState.isWifiEnabled) return 'WiFi disabled';
      if (!wifiState.isConnected) return 'Not connected to WiFi';
      if (authorizedBSSID) {
        return wifiState.isAuthorized ? 'Connected to authorized network' : 'Connected to unauthorized network';
      }
      return 'Connected to WiFi';
    },
    
    getStatusColor: () => {
      if (wifiState.loading) return '#FFA500';
      if (wifiState.error || !wifiState.hasLocationPermission || !wifiState.isWifiEnabled) return '#FF4444';
      if (!wifiState.isConnected) return '#FF4444';
      if (authorizedBSSID) {
        return wifiState.isAuthorized ? '#00AA00' : '#FF4444';
      }
      return '#00AA00';
    }
  };
};

export default useWiFiBSSID;