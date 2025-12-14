import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerTime } from './ServerTime';

/**
 * Offline Attendance Manager
 * Handles attendance tracking when WiFi/internet is unavailable
 * Syncs data when connection is restored
 */

const OFFLINE_ATTENDANCE_KEY = '@offline_attendance';
const OFFLINE_EVENTS_KEY = '@offline_events';
const SYNC_QUEUE_KEY = '@sync_queue';

class OfflineAttendanceManager {
  constructor() {
    this.isOffline = false;
    this.offlineStartTime = null;
    this.offlineAttendanceData = null;
    this.eventQueue = [];
    this.syncInProgress = false;
  }

  /**
   * Start offline attendance tracking
   */
  async startOfflineTracking(studentData, currentLecture) {
    try {
      console.log('📴 Starting offline attendance tracking...');
      
      this.isOffline = true;
      this.offlineStartTime = Date.now();
      
      // Create offline attendance session
      this.offlineAttendanceData = {
        studentId: studentData.enrollmentNo,
        studentName: studentData.name,
        semester: studentData.semester,
        branch: studentData.course,
        startTime: this.offlineStartTime,
        currentLecture: currentLecture ? {
          subject: currentLecture.subject,
          room: currentLecture.room,
          startTime: currentLecture.startTime,
          endTime: currentLecture.endTime,
          teacher: currentLecture.teacher
        } : null,
        events: [],
        totalOfflineSeconds: 0,
        lastKnownOnlineSeconds: studentData.attendedSeconds || 0
      };
      
      // Save to storage
      await AsyncStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(this.offlineAttendanceData));
      
      console.log('✅ Offline tracking started');
      console.log(`   Student: ${studentData.name} (${studentData.enrollmentNo})`);
      console.log(`   Lecture: ${currentLecture?.subject || 'Unknown'}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error starting offline tracking:', error);
      return false;
    }
  }

  /**
   * Log offline event (WiFi changes, timer actions, etc.)
   */
  async logOfflineEvent(eventType, eventData = {}) {
    try {
      if (!this.isOffline || !this.offlineAttendanceData) return;
      
      const event = {
        timestamp: Date.now(),
        type: eventType, // 'wifi_disconnected', 'wifi_connected', 'timer_paused', 'timer_resumed', 'grace_period_started', 'grace_period_expired'
        data: eventData,
        offsetFromStart: Date.now() - this.offlineStartTime
      };
      
      this.offlineAttendanceData.events.push(event);
      this.eventQueue.push(event);
      
      // Update total offline time
      this.offlineAttendanceData.totalOfflineSeconds = Math.floor((Date.now() - this.offlineStartTime) / 1000);
      
      // Save updated data
      await AsyncStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(this.offlineAttendanceData));
      await AsyncStorage.setItem(OFFLINE_EVENTS_KEY, JSON.stringify(this.eventQueue));
      
      console.log(`📴 Offline event logged: ${eventType}`, eventData);
      
    } catch (error) {
      console.error('❌ Error logging offline event:', error);
    }
  }

  /**
   * Stop offline tracking and prepare for sync
   */
  async stopOfflineTracking() {
    try {
      if (!this.isOffline || !this.offlineAttendanceData) return null;
      
      console.log('📶 Stopping offline tracking...');
      
      // Calculate final offline duration
      const offlineEndTime = Date.now();
      const totalOfflineMs = offlineEndTime - this.offlineStartTime;
      const totalOfflineSeconds = Math.floor(totalOfflineMs / 1000);
      
      // Log final event
      await this.logOfflineEvent('offline_session_ended', {
        endTime: offlineEndTime,
        totalDurationMs: totalOfflineMs,
        totalDurationSeconds: totalOfflineSeconds
      });
      
      // Prepare sync data
      const syncData = {
        ...this.offlineAttendanceData,
        endTime: offlineEndTime,
        totalOfflineSeconds: totalOfflineSeconds,
        readyForSync: true
      };
      
      // Save to sync queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncData));
      
      console.log(`✅ Offline session completed: ${Math.floor(totalOfflineSeconds / 60)} minutes`);
      
      // Reset offline state
      this.isOffline = false;
      this.offlineStartTime = null;
      this.offlineAttendanceData = null;
      
      return syncData;
      
    } catch (error) {
      console.error('❌ Error stopping offline tracking:', error);
      return null;
    }
  }

  /**
   * Sync offline data with server when connection is restored
   */
  async syncWithServer(serverUrl) {
    try {
      if (this.syncInProgress) {
        console.log('⏳ Sync already in progress, skipping...');
        return { success: false, reason: 'sync_in_progress' };
      }
      
      this.syncInProgress = true;
      console.log('🔄 Starting offline data sync...');
      
      // Get sync data
      const syncDataStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!syncDataStr) {
        console.log('ℹ️  No offline data to sync');
        this.syncInProgress = false;
        return { success: true, reason: 'no_data' };
      }
      
      const syncData = JSON.parse(syncDataStr);
      console.log(`📤 Syncing ${Math.floor(syncData.totalOfflineSeconds / 60)} minutes of offline attendance...`);
      
      // Send to server
      const response = await fetch(`${serverUrl}/api/attendance/sync-offline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: syncData.studentId,
          studentName: syncData.studentName,
          semester: syncData.semester,
          branch: syncData.branch,
          offlineStartTime: syncData.startTime,
          offlineEndTime: syncData.endTime,
          totalOfflineSeconds: syncData.totalOfflineSeconds,
          lastKnownOnlineSeconds: syncData.lastKnownOnlineSeconds,
          currentLecture: syncData.currentLecture,
          events: syncData.events,
          syncTimestamp: Date.now()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Offline data synced successfully');
        console.log(`   Accepted time: ${Math.floor(result.acceptedSeconds / 60)} minutes`);
        
        // Clear synced data
        await AsyncStorage.multiRemove([OFFLINE_ATTENDANCE_KEY, OFFLINE_EVENTS_KEY, SYNC_QUEUE_KEY]);
        this.eventQueue = [];
        
        this.syncInProgress = false;
        return {
          success: true,
          acceptedSeconds: result.acceptedSeconds,
          totalOfflineSeconds: syncData.totalOfflineSeconds,
          syncedEvents: syncData.events.length
        };
      } else {
        console.error('❌ Server rejected offline sync:', result.error);
        this.syncInProgress = false;
        return { success: false, reason: result.error };
      }
      
    } catch (error) {
      console.error('❌ Error syncing offline data:', error);
      this.syncInProgress = false;
      return { success: false, reason: error.message };
    }
  }

  /**
   * Check if there's pending offline data to sync
   */
  async hasPendingSync() {
    try {
      const syncData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return syncData !== null;
    } catch (error) {
      console.error('❌ Error checking pending sync:', error);
      return false;
    }
  }

  /**
   * Get offline status and statistics
   */
  getOfflineStatus() {
    return {
      isOffline: this.isOffline,
      offlineStartTime: this.offlineStartTime,
      offlineDurationSeconds: this.isOffline ? Math.floor((Date.now() - this.offlineStartTime) / 1000) : 0,
      eventCount: this.eventQueue.length,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Force clear all offline data (emergency reset)
   */
  async clearOfflineData() {
    try {
      await AsyncStorage.multiRemove([OFFLINE_ATTENDANCE_KEY, OFFLINE_EVENTS_KEY, SYNC_QUEUE_KEY]);
      this.isOffline = false;
      this.offlineStartTime = null;
      this.offlineAttendanceData = null;
      this.eventQueue = [];
      this.syncInProgress = false;
      console.log('🗑️ All offline data cleared');
    } catch (error) {
      console.error('❌ Error clearing offline data:', error);
    }
  }
}

// Export singleton instance
export default new OfflineAttendanceManager();