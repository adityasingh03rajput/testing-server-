import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { WifiModule } = NativeModules;

class WiFiBSSIDService {
  constructor() {
    this.currentBSSID = null;
    this.isConnected = false;
    this.listeners = [];
    this.checkInterval = null;
    this.isMonitoring = false;
  }

  /**
   * Request location permissions required for BSSID access
   * Copied from LetsBunk MainActivity.kt permission logic
   */
  async requestLocationPermissions() {
    if (Platform.OS !== 'android') {
      return { granted: false, message: 'Only Android is supported' };
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      return {
        granted: allGranted,
        permissions: granted,
        message: allGranted ? 'All permissions granted' : 'Some permissions denied'
      };
    } catch (error) {
      console.error('Permission request error:', error);
      return { granted: false, message: error.message };
    }
  }

  /**
   * Get current WiFi BSSID
   * Exact logic from LetsBunk MainActivity.kt updateWifiInfo()
   */
  async getBSSID() {
    try {
      if (!WifiModule) {
        throw new Error('WifiModule not available');
      }

      // Check permissions first
      const permissionCheck = await this.checkPermissions();
      if (!permissionCheck.hasLocationPermission) {
        throw new Error('Location permission required for BSSID access');
      }

      const wifiInfo = await WifiModule.getBSSID();
      
      // Validate BSSID (same logic as LetsBunk)
      if (!wifiInfo.bssid || 
          wifiInfo.bssid === '02:00:00:00:00:00' || 
          wifiInfo.bssid === '<unknown ssid>') {
        throw new Error('BSSID not available - check WiFi connection and location services');
      }

      return {
        success: true,
        bssid: wifiInfo.bssid.toLowerCase(),
        ssid: wifiInfo.ssid,
        rssi: wifiInfo.rssi,
        linkSpeed: wifiInfo.linkSpeed,
        frequency: wifiInfo.frequency,
        macAddress: wifiInfo.macAddress,
        networkId: wifiInfo.networkId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('BSSID fetch error:', error);
      return {
        success: false,
        error: error.message,
        bssid: null,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check WiFi and permission status
   * Logic from LetsBunk MainActivity.kt checkPermissions()
   */
  async checkPermissions() {
    try {
      if (!WifiModule) {
        return { hasLocationPermission: false, isWifiEnabled: false };
      }

      const [permissionStatus, wifiState] = await Promise.all([
        WifiModule.checkPermissions(),
        WifiModule.getWifiState()
      ]);

      return {
        hasLocationPermission: permissionStatus.ACCESS_FINE_LOCATION || permissionStatus.ACCESS_COARSE_LOCATION,
        hasWifiPermission: permissionStatus.ACCESS_WIFI_STATE,
        hasBackgroundLocation: permissionStatus.ACCESS_BACKGROUND_LOCATION || false,
        isWifiEnabled: wifiState.isWifiEnabled,
        androidVersion: wifiState.androidVersion,
        sdkVersion: wifiState.sdkVersion,
        allPermissions: permissionStatus
      };
    } catch (error) {
      console.error('Permission check error:', error);
      return { hasLocationPermission: false, isWifiEnabled: false, error: error.message };
    }
  }

  /**
   * Verify if current BSSID matches authorized BSSID
   * Logic from LetsBunk MainActivity.kt updateWifiInfo() verification
   */
  async verifyAuthorizedBSSID(authorizedBSSID) {
    try {
      const result = await this.getBSSID();
      
      if (!result.success) {
        return {
          authorized: false,
          currentBSSID: null,
          authorizedBSSID,
          error: result.error
        };
      }

      const isAuthorized = result.bssid === authorizedBSSID.toLowerCase();
      
      return {
        authorized: isAuthorized,
        currentBSSID: result.bssid,
        authorizedBSSID: authorizedBSSID.toLowerCase(),
        wifiInfo: result,
        message: isAuthorized ? 'Connected to authorized network' : 'Not connected to authorized network'
      };

    } catch (error) {
      return {
        authorized: false,
        currentBSSID: null,
        authorizedBSSID,
        error: error.message
      };
    }
  }

  /**
   * Start monitoring WiFi BSSID changes
   * Logic from LetsBunk MainActivity.kt onResume() WiFi monitoring
   */
  startMonitoring(callback, interval = 5000) {
    if (this.isMonitoring) {
      console.log('WiFi monitoring already active');
      return;
    }

    this.isMonitoring = true;
    this.listeners.push(callback);

    console.log('Starting WiFi BSSID monitoring...');

    this.checkInterval = setInterval(async () => {
      try {
        const result = await this.getBSSID();
        
        // Check if BSSID changed
        const bssidChanged = this.currentBSSID !== result.bssid;
        const connectionChanged = this.isConnected !== result.success;

        if (bssidChanged || connectionChanged) {
          this.currentBSSID = result.bssid;
          this.isConnected = result.success;

          // Notify all listeners
          this.listeners.forEach(listener => {
            try {
              listener({
                ...result,
                bssidChanged,
                connectionChanged,
                previousBSSID: bssidChanged ? this.currentBSSID : result.bssid
              });
            } catch (error) {
              console.error('Listener callback error:', error);
            }
          });
        }

      } catch (error) {
        console.error('WiFi monitoring error:', error);
        
        // Notify listeners of error
        this.listeners.forEach(listener => {
          try {
            listener({
              success: false,
              error: error.message,
              bssid: null,
              bssidChanged: false,
              connectionChanged: this.isConnected !== false
            });
          } catch (callbackError) {
            console.error('Error listener callback error:', callbackError);
          }
        });

        this.isConnected = false;
        this.currentBSSID = null;
      }
    }, interval);
  }

  /**
   * Stop WiFi monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.isMonitoring = false;
    this.listeners = [];
    
    console.log('WiFi BSSID monitoring stopped');
  }

  /**
   * Get detailed WiFi information
   * Enhanced version of LetsBunk WiFi info gathering
   */
  async getDetailedWiFiInfo() {
    try {
      const [bssidResult, permissionStatus] = await Promise.all([
        this.getBSSID(),
        this.checkPermissions()
      ]);

      return {
        ...bssidResult,
        permissions: permissionStatus,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        permissions: await this.checkPermissions()
      };
    }
  }

  /**
   * Test WiFi functionality
   * Diagnostic function similar to LetsBunk test scripts
   */
  async testWiFiCapabilities() {
    console.log('🧪 Testing WiFi BSSID capabilities...');
    
    try {
      // Test 1: Check permissions
      console.log('📋 Checking permissions...');
      const permissions = await this.checkPermissions();
      console.log('Permissions:', permissions);

      // Test 2: Get BSSID
      console.log('📡 Getting BSSID...');
      const bssidResult = await this.getBSSID();
      console.log('BSSID Result:', bssidResult);

      // Test 3: Get detailed info
      console.log('📊 Getting detailed WiFi info...');
      const detailedInfo = await this.getDetailedWiFiInfo();
      console.log('Detailed Info:', detailedInfo);

      const testResults = {
        success: true,
        permissions,
        bssidResult,
        detailedInfo,
        timestamp: new Date().toISOString()
      };

      console.log('✅ WiFi test completed successfully');
      return testResults;

    } catch (error) {
      console.error('❌ WiFi test failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new WiFiBSSIDService();

// Export class for multiple instances if needed
export { WiFiBSSIDService };