import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Real-time attendance tracking hook
 * Handles connection/disconnection, auto-save, and time tracking
 */
export const useAttendanceTracking = (studentId, socketUrl) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [error, setError] = useState(null);

  const heartbeatInterval = useRef(null);
  const appState = useRef(AppState.currentState);
  const trackingStartTime = useRef(null);

  /**
   * Start tracking attendance for current lecture
   */
  const startTracking = async (lectureInfo, timetable) => {
    try {
      const response = await fetch(`${socketUrl}/api/attendance/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          lectureInfo,
          timetable
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsTracking(true);
        setCurrentLecture(lectureInfo);
        trackingStartTime.current = new Date();
        
        // Save to local storage for recovery
        await AsyncStorage.setItem('activeTracking', JSON.stringify({
          studentId,
          lectureInfo,
          startTime: trackingStartTime.current
        }));

        // Start heartbeat
        startHeartbeat();

        return { success: true, data };
      } else {
        throw new Error(data.error || 'Failed to start tracking');
      }
    } catch (err) {
      console.error('Error starting tracking:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  /**
   * Stop tracking attendance
   */
  const stopTracking = async (reason = 'manual') => {
    try {
      const response = await fetch(`${socketUrl}/api/attendance/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          reason
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsTracking(false);
        setCurrentLecture(null);
        setAttendanceData(data);
        trackingStartTime.current = null;

        // Clear local storage
        await AsyncStorage.removeItem('activeTracking');

        // Stop heartbeat
        stopHeartbeat();

        return { success: true, data };
      } else {
        throw new Error(data.error || 'Failed to stop tracking');
      }
    } catch (err) {
      console.error('Error stopping tracking:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  /**
   * Send heartbeat to server (every 30 seconds)
   */
  const startHeartbeat = () => {
    stopHeartbeat(); // Clear any existing interval

    heartbeatInterval.current = setInterval(async () => {
      try {
        await fetch(`${socketUrl}/api/attendance/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId })
        });
      } catch (err) {
        console.error('Heartbeat error:', err);
        // Don't stop tracking on heartbeat failure - server will handle it
      }
    }, 30000); // 30 seconds
  };

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  /**
   * Get attendance report
   */
  const getReport = async (date = null) => {
    try {
      const dateParam = date ? `?date=${date.toISOString()}` : '';
      const response = await fetch(`${socketUrl}/api/attendance/report/${studentId}${dateParam}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error getting report:', err);
      return { found: false, error: err.message };
    }
  };

  /**
   * Get attendance statistics
   */
  const getStats = async (startDate = null, endDate = null) => {
    try {
      let url = `${socketUrl}/api/attendance/stats/${studentId}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error getting stats:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        if (isTracking) {
          // Resume heartbeat
          startHeartbeat();
        } else {
          // Check if there was an active session
          const savedTracking = await AsyncStorage.getItem('activeTracking');
          if (savedTracking) {
            const { lectureInfo } = JSON.parse(savedTracking);
            // Resume tracking
            await startTracking(lectureInfo, null);
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - heartbeat will continue
        // Server will handle if connection is lost
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isTracking]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, []);

  /**
   * Auto-recovery on mount
   */
  useEffect(() => {
    const checkActiveTracking = async () => {
      const savedTracking = await AsyncStorage.getItem('activeTracking');
      if (savedTracking) {
        const { lectureInfo, startTime } = JSON.parse(savedTracking);
        const elapsed = (new Date() - new Date(startTime)) / 1000;
        
        // If less than 2 hours, resume tracking
        if (elapsed < 7200) {
          await startTracking(lectureInfo, null);
        } else {
          // Too old, clear it
          await AsyncStorage.removeItem('activeTracking');
        }
      }
    };

    checkActiveTracking();
  }, []);

  return {
    isTracking,
    currentLecture,
    attendanceData,
    error,
    startTracking,
    stopTracking,
    getReport,
    getStats
  };
};

export default useAttendanceTracking;
