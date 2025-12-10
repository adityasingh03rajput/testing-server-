import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * WiFi Manager for BSSID Detection and Validation
 * Handles WiFi connection monitoring for attendance tracking
 */

const WIFI_CACHE_KEY = '@wifi_cache';
const AUTHORIZED_BSSIDS_KEY = '@authorized_bssids';

class WiFiManager {
  constructor() {
    this.currentBSSID = null;
    this.isConnected = false;
    this.authorizedBSSIDs = [];
    this.listeners = [];
    this.checkInterval = null;
    this.graceTimer = null;
    this.isInGracePeriod = false;
  }

  /**
   * Initialize WiFi manager
   * Safe version to prevent crashes
   */
  async initialize() {
    try {
      console.log('📶 Initializing WiFi Manager (safe mode)...');
      
      // Request permissions (non-blocking)
      try {
        await this.requestPermissions();
      } catch (permError) {
        console.warn('⚠️ Permission request failed, continuing anyway:', permError);
      }
      
      // Load cached authorized BSSIDs (non-blocking)
      try {
        await this.loadAuthorizedBSSIDs();
      } catch (loadError) {
        console.warn('⚠️ Failed to load BSSIDs, using defaults:', loadError);
      }
      
      // Start monitoring (non-blocking)
      try {
        this.startMonitoring();
      } catch (monitorError) {
        console.warn('⚠️ Failed to start monitoring, using fallback mode:', monitorError);
      }
      
      console.log('✅ WiFi Manager initialized (safe mode)');
      return true;
    } catch (error) {
      console.error('❌ WiFi Manager initialization failed, using fallback mode:', error);
      // Always return true to prevent app crashes
      return true;
    }
  }

  /**
   * Request necessary permissions for WiFi access
   * Safe version to prevent null permission crashes
   */
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        // Use string literals to prevent undefined permission constants
        const permissions = [
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.ACCESS_COARSE_LOCATION',
          'android.permission.ACCESS_WIFI_STATE',
          'android.permission.CHANGE_WIFI_STATE',
        ].filter(permission => permission != null); // Filter out any null/undefined

        if (permissions.length === 0) {
          console.log('⚠️ No valid permissions to request, skipping...');
          return;
        }

        console.log('📱 Requesting WiFi permissions:', permissions);
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.warn('⚠️ Some WiFi permissions not granted, continuing anyway...');
          console.log('Permission results:', granted);
        } else {
          console.log('✅ All WiFi permissions granted');
        }
      } catch (error) {
        console.error('❌ Permission request failed, continuing without permissions:', error);
        // Don't throw error - continue without permissions for now
      }
    }
  }

  /**
   * Get current WiFi BSSID
   * Real implementation with react-native-wifi-reborn
   */
  async getCurrentBSSID() {
    try {
      // Import WiFi module dynamically to prevent crashes
      let WifiManager;
      try {
        WifiManager = require('react-native-wifi-reborn').default;
      } catch (importError) {
        console.warn('⚠️ WiFi module not available, using fallback mode');
        return this.getFallbackBSSID();
      }

      // Check if WiFi is enabled
      const isEnabled = await WifiManager.isEnabled();
      if (!isEnabled) {
        console.log('📶 WiFi is disabled');
        return null;
      }

      // Get current WiFi info
      const wifiInfo = await WifiManager.getCurrentWifiSSID();
      if (!wifiInfo) {
        console.log('📶 No WiFi connection detected');
        return null;
      }

      // Get BSSID (requires location permission on Android)
      const bssid = await WifiManager.getBSSID();
      if (bssid && bssid !== '<unknown ssid>') {
        console.log(`📶 Current BSSID: ${bssid}`);
        return bssid.toLowerCase(); // Normalize to lowercase
      }

      console.log('📶 BSSID not available (may need location permission)');
      return null;

    } catch (error) {
      console.error('❌ Error getting BSSID:', error);
      return this.getFallbackBSSID();
    }
  }

  /**
   * Get fallback BSSID for development/testing
   */
  getFallbackBSSID() {
    if (__DEV__) {
      console.log('📶 Using development BSSID for testing');
      return 'b4:86:18:6f:fb:ec'; // Example BSSID for testing
    }
    return null; // Production should return null if no real BSSID
  }

  /**
   * Check if currently connected to WiFi
   */
  async isWiFiConnected() {
    try {
      const bssid = await this.getCurrentBSSID();
      return bssid !== null;
    } catch (error) {
      console.error('❌ Error checking WiFi connection:', error);
      return false;
    }
  }

  /**
   * Load authorized BSSIDs from server and cache locally
   * Includes automatic room-time matching based on timetable
   */
  async loadAuthorizedBSSIDs(serverUrl, studentData = null) {
    try {
      if (serverUrl) {
        console.log('📥 Fetching authorized BSSIDs from server...');
        
        // Get classrooms with BSSID data
        const classroomResponse = await fetch(`${serverUrl}/api/classrooms`);
        const classroomData = await classroomResponse.json();
        
        if (classroomData.success && classroomData.classrooms) {
          this.authorizedBSSIDs = classroomData.classrooms
            .filter(room => room.wifiBSSID && room.isActive)
            .map(room => ({
              bssid: room.wifiBSSID.toLowerCase(), // Normalize to lowercase
              roomNumber: room.roomNumber,
              building: room.building || 'Main Building',
              capacity: room.capacity || 60
            }));
          
          // If student data available, get current lecture room
          if (studentData && studentData.semester && studentData.course) {
            try {
              const timetableResponse = await fetch(
                `${serverUrl}/api/timetable/${studentData.semester}/${encodeURIComponent(studentData.course)}`
              );
              const timetableData = await timetableResponse.json();
              
              if (timetableData.success) {
                const currentRoom = this.getCurrentLectureRoom(timetableData.timetable);
                if (currentRoom) {
                  console.log(`📚 Current lecture room: ${currentRoom}`);
                  // Mark current room as priority
                  this.authorizedBSSIDs = this.authorizedBSSIDs.map(room => ({
                    ...room,
                    isCurrentLecture: room.roomNumber === currentRoom
                  }));
                }
              }
            } catch (timetableError) {
              console.warn('⚠️ Could not fetch timetable for room matching:', timetableError);
            }
          }
          
          // Cache for offline use
          await AsyncStorage.setItem(AUTHORIZED_BSSIDS_KEY, JSON.stringify(this.authorizedBSSIDs));
          console.log(`✅ Loaded ${this.authorizedBSSIDs.length} authorized BSSIDs`);
          
          // Log current lecture room if found
          const currentLectureRoom = this.authorizedBSSIDs.find(room => room.isCurrentLecture);
          if (currentLectureRoom) {
            console.log(`🎯 Current lecture BSSID: ${currentLectureRoom.bssid} (${currentLectureRoom.roomNumber})`);
          }
        }
      } else {
        // Load from cache
        const cached = await AsyncStorage.getItem(AUTHORIZED_BSSIDS_KEY);
        if (cached) {
          this.authorizedBSSIDs = JSON.parse(cached);
          console.log(`📱 Loaded ${this.authorizedBSSIDs.length} cached BSSIDs`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading authorized BSSIDs:', error);
    }
  }

  /**
   * Get current lecture room based on time and timetable
   */
  getCurrentLectureRoom(timetable) {
    try {
      const now = new Date();
      const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
      
      const daySchedule = timetable.schedule?.[currentDay];
      if (!daySchedule || !timetable.periods) return null;
      
      // Find current period
      for (let i = 0; i < daySchedule.length; i++) {
        const period = daySchedule[i];
        const periodInfo = timetable.periods[i];
        
        if (!periodInfo || period.isBreak) continue;
        
        const [startH, startM] = periodInfo.startTime.split(':').map(Number);
        const [endH, endM] = periodInfo.endTime.split(':').map(Number);
        
        const periodStart = startH * 60 + startM;
        const periodEnd = endH * 60 + endM;
        
        if (currentTime >= periodStart && currentTime <= periodEnd) {
          return period.room;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting current lecture room:', error);
      return null;
    }
  }

  /**
   * Check if current BSSID is authorized for given room
   */
  async isAuthorizedForRoom(roomNumber) {
    try {
      const currentBSSID = await this.getCurrentBSSID();
      if (!currentBSSID) {
        console.log('📶 No WiFi connection detected');
        return { authorized: false, reason: 'no_wifi' };
      }

      // Find room's authorized BSSID
      const roomBSSID = this.authorizedBSSIDs.find(
        item => item.roomNumber === roomNumber
      );

      if (!roomBSSID) {
        console.log(`⚠️ No BSSID configured for room ${roomNumber}`);
        return { authorized: false, reason: 'room_not_configured' };
      }

      const isAuthorized = currentBSSID.toLowerCase() === roomBSSID.bssid.toLowerCase();
      
      console.log(`📶 BSSID Check for room ${roomNumber}:`);
      console.log(`   Current: ${currentBSSID}`);
      console.log(`   Expected: ${roomBSSID.bssid}`);
      console.log(`   Authorized: ${isAuthorized ? '✅' : '❌'}`);

      return {
        authorized: isAuthorized,
        currentBSSID,
        expectedBSSID: roomBSSID.bssid,
        roomInfo: roomBSSID,
        reason: isAuthorized ? 'authorized' : 'wrong_bssid'
      };
    } catch (error) {
      console.error('❌ Error checking BSSID authorization:', error);
      return { authorized: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Start monitoring WiFi connection
   */
  startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every 10 seconds
    this.checkInterval = setInterval(async () => {
      await this.checkConnection();
    }, 10000);

    // Initial check
    this.checkConnection();
  }

  /**
   * Stop monitoring WiFi connection
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
  }

  /**
   * Check current WiFi connection and notify listeners
   */
  async checkConnection() {
    try {
      const newBSSID = await this.getCurrentBSSID();
      const wasConnected = this.isConnected;
      const oldBSSID = this.currentBSSID;

      this.currentBSSID = newBSSID;
      this.isConnected = newBSSID !== null;

      // Detect connection changes
      if (wasConnected !== this.isConnected || oldBSSID !== newBSSID) {
        console.log(`📶 WiFi Status Changed:`);
        console.log(`   Connected: ${wasConnected} → ${this.isConnected}`);
        console.log(`   BSSID: ${oldBSSID} → ${newBSSID}`);

        // Handle disconnection with grace period
        if (wasConnected && !this.isConnected) {
          this.handleDisconnection();
        } else if (!wasConnected && this.isConnected) {
          this.handleConnection();
        } else if (this.isConnected && oldBSSID !== newBSSID) {
          this.handleBSSIDChange(oldBSSID, newBSSID);
        }
      }
    } catch (error) {
      console.error('❌ Error checking WiFi connection:', error);
    }
  }

  /**
   * Handle WiFi disconnection with grace period
   */
  handleDisconnection() {
    if (this.isInGracePeriod) return;

    console.log('📶 WiFi disconnected - starting 2-minute grace period');
    this.isInGracePeriod = true;

    // Notify listeners immediately
    this.notifyListeners({
      type: 'disconnected',
      bssid: null,
      gracePeriod: true,
      graceTimeRemaining: 120 // 2 minutes
    });

    // Start 2-minute grace timer
    this.graceTimer = setTimeout(() => {
      console.log('⏰ Grace period expired - pausing timer');
      this.isInGracePeriod = false;
      
      this.notifyListeners({
        type: 'grace_expired',
        bssid: null,
        gracePeriod: false
      });
    }, 120000); // 2 minutes
  }

  /**
   * Handle WiFi connection
   */
  handleConnection() {
    // Cancel grace period if active
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
      this.isInGracePeriod = false;
      console.log('✅ WiFi reconnected - grace period cancelled');
    }

    this.notifyListeners({
      type: 'connected',
      bssid: this.currentBSSID,
      gracePeriod: false
    });
  }

  /**
   * Handle BSSID change (different WiFi network)
   */
  handleBSSIDChange(oldBSSID, newBSSID) {
    console.log(`📶 BSSID changed: ${oldBSSID} → ${newBSSID}`);
    
    this.notifyListeners({
      type: 'bssid_changed',
      oldBSSID,
      newBSSID,
      gracePeriod: false
    });
  }

  /**
   * Add listener for WiFi events
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of WiFi events
   */
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ Error in WiFi listener:', error);
      }
    });
  }

  /**
   * Get current WiFi status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentBSSID: this.currentBSSID,
      isInGracePeriod: this.isInGracePeriod,
      authorizedBSSIDsCount: this.authorizedBSSIDs.length
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopMonitoring();
    this.listeners = [];
  }
}

// Export singleton instance
export default new WiFiManager();