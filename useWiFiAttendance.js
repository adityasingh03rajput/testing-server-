import { useState, useEffect, useRef } from 'react';
import WiFiManager from './WiFiManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * React Hook for WiFi-based Attendance Tracking
 * Manages timer state based on WiFi BSSID validation
 */
export const useWiFiAttendance = (serverUrl, currentLecture, studentId) => {
  // ENABLED: Using native Kotlin WiFi module for reliable BSSID detection
  console.log('📶 WiFi system enabled with native Kotlin module');
  const [wifiStatus, setWifiStatus] = useState({
    isConnected: false,
    currentBSSID: null,
    isAuthorized: false,
    isInGracePeriod: false,
    graceTimeRemaining: 0,
    roomInfo: null,
    lastCheck: null
  });

  const [timerState, setTimerState] = useState({
    isRunning: false,
    isPaused: false,
    pauseReason: null,
    canStart: false
  });

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const graceTimerRef = useRef(null);
  const wifiListenerRef = useRef(null);

  // Initialize WiFi Manager with native Kotlin module
  useEffect(() => {
    console.log('📶 Initializing WiFi system with native Kotlin module');
    
    const initializeWiFi = async () => {
      try {
        // Initialize WiFi Manager
        await WiFiManager.initialize();
        
        // Load authorized BSSIDs from server
        if (serverUrl) {
          await WiFiManager.loadAuthorizedBSSIDs(serverUrl, { 
            semester: currentLecture?.semester, 
            course: currentLecture?.course 
          });
        }
        
        // Set up WiFi event listener
        wifiListenerRef.current = WiFiManager.addListener(handleWiFiEvent);
        
        // Initial WiFi check
        await checkWiFiAuthorization();
        
        console.log('✅ WiFi system initialized successfully');
      } catch (error) {
        console.error('❌ WiFi initialization failed:', error);
        // Set fallback state
        setWifiStatus(prev => ({
          ...prev,
          isConnected: false,
          isAuthorized: false,
          lastCheck: new Date()
        }));
      }
    };
    
    initializeWiFi();

    // Cleanup on unmount
    return () => {
      if (wifiListenerRef.current) {
        wifiListenerRef.current();
      }
      if (graceTimerRef.current) {
        clearInterval(graceTimerRef.current);
      }
      WiFiManager.cleanup();
    };
  }, [serverUrl]);

  // Check WiFi authorization when lecture changes
  useEffect(() => {
    if (currentLecture && currentLecture.room) {
      checkWiFiAuthorization();
    }
  }, [currentLecture]);

  /**
   * Handle WiFi events from WiFiManager
   */
  const handleWiFiEvent = async (event) => {
    console.log('📶 WiFi Event:', event.type, event);
    
    switch (event.type) {
      case 'connected':
        await handleWiFiConnected(event);
        break;
      case 'disconnected':
        await handleWiFiDisconnected(event);
        break;
      case 'bssid_changed':
        await handleBSSIDChanged(event);
        break;
      case 'grace_expired':
        await handleGraceExpired(event);
        break;
    }

    // Log event to attendance history
    await logAttendanceEvent(event);
  };

  /**
   * Handle WiFi connection
   */
  const handleWiFiConnected = async (event) => {
    await checkWiFiAuthorization();
    
    // If authorized and was paused due to WiFi, resume timer
    if (wifiStatus.isAuthorized && timerState.isPaused && timerState.pauseReason === 'wifi_disconnected') {
      resumeTimer('wifi_reconnected');
    }
  };

  /**
   * Handle WiFi disconnection
   */
  const handleWiFiDisconnected = async (event) => {
    setWifiStatus(prev => ({
      ...prev,
      isConnected: false,
      currentBSSID: null,
      isAuthorized: false,
      isInGracePeriod: event.gracePeriod,
      graceTimeRemaining: event.graceTimeRemaining || 0
    }));

    // Start grace period countdown
    if (event.gracePeriod) {
      startGraceCountdown(event.graceTimeRemaining || 120);
    }

    // Don't pause timer immediately - wait for grace period
    if (!event.gracePeriod) {
      pauseTimer('wifi_disconnected');
    }
  };

  /**
   * Handle BSSID change (different WiFi network)
   */
  const handleBSSIDChanged = async (event) => {
    await checkWiFiAuthorization();
    
    // If new BSSID is not authorized, pause timer
    if (!wifiStatus.isAuthorized && timerState.isRunning) {
      pauseTimer('wrong_bssid');
    }
  };

  /**
   * Handle grace period expiration
   */
  const handleGraceExpired = async (event) => {
    setWifiStatus(prev => ({
      ...prev,
      isInGracePeriod: false,
      graceTimeRemaining: 0
    }));

    // Pause timer if still disconnected
    if (!wifiStatus.isConnected && timerState.isRunning) {
      pauseTimer('grace_period_expired');
    }
  };

  /**
   * Start grace period countdown
   */
  const startGraceCountdown = (initialSeconds) => {
    if (graceTimerRef.current) {
      clearInterval(graceTimerRef.current);
    }

    let remainingSeconds = initialSeconds;
    
    graceTimerRef.current = setInterval(() => {
      remainingSeconds -= 1;
      
      setWifiStatus(prev => ({
        ...prev,
        graceTimeRemaining: remainingSeconds
      }));

      if (remainingSeconds <= 0) {
        clearInterval(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    }, 1000);
  };

  /**
   * Check WiFi authorization for current lecture
   */
  const checkWiFiAuthorization = async () => {
    try {
      if (!currentLecture || !currentLecture.room) {
        setWifiStatus(prev => ({
          ...prev,
          isAuthorized: false,
          canStart: false
        }));
        setTimerState(prev => ({
          ...prev,
          canStart: false
        }));
        return;
      }

      const authResult = await WiFiManager.isAuthorizedForRoom(currentLecture.room);
      
      setWifiStatus(prev => ({
        ...prev,
        isConnected: authResult.currentBSSID !== null,
        currentBSSID: authResult.currentBSSID,
        isAuthorized: authResult.authorized,
        roomInfo: authResult.roomInfo,
        lastCheck: new Date()
      }));

      setTimerState(prev => ({
        ...prev,
        canStart: authResult.authorized
      }));

      // If not authorized and timer is running, pause it
      if (!authResult.authorized && timerState.isRunning) {
        pauseTimer(authResult.reason);
      }

      return authResult;
    } catch (error) {
      console.error('❌ Error checking WiFi authorization:', error);
      return { authorized: false, reason: 'error' };
    }
  };

  /**
   * Pause timer with reason
   */
  const pauseTimer = (reason) => {
    console.log(`⏸️ Pausing timer: ${reason}`);
    
    setTimerState(prev => ({
      ...prev,
      isPaused: true,
      pauseReason: reason
    }));

    // Notify parent component
    if (onTimerPaused) {
      onTimerPaused(reason);
    }
  };

  /**
   * Resume timer with reason
   */
  const resumeTimer = (reason) => {
    console.log(`▶️ Resuming timer: ${reason}`);
    
    setTimerState(prev => ({
      ...prev,
      isPaused: false,
      pauseReason: null
    }));

    // Notify parent component
    if (onTimerResumed) {
      onTimerResumed(reason);
    }
  };

  /**
   * Start timer (only if authorized)
   */
  const startTimer = async () => {
    const authResult = await checkWiFiAuthorization();
    
    if (!authResult.authorized) {
      throw new Error(`Cannot start timer: ${authResult.reason}`);
    }

    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      pauseReason: null
    }));

    return true;
  };

  /**
   * Stop timer
   */
  const stopTimer = () => {
    setTimerState({
      isRunning: false,
      isPaused: false,
      pauseReason: null,
      canStart: wifiStatus.isAuthorized
    });
  };

  /**
   * Log attendance event to history
   */
  const logAttendanceEvent = async (event) => {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: event.type,
        bssid: event.bssid || event.newBSSID || null,
        lecture: currentLecture ? {
          subject: currentLecture.subject,
          room: currentLecture.room,
          startTime: currentLecture.startTime,
          endTime: currentLecture.endTime
        } : null,
        studentId: studentId,
        timerState: { ...timerState },
        gracePeriod: event.gracePeriod || false
      };

      // Add to local history
      setAttendanceHistory(prev => [...prev.slice(-49), logEntry]); // Keep last 50 events

      // Send to server
      if (serverUrl && studentId) {
        await fetch(`${serverUrl}/api/attendance/wifi-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      }

      // Cache locally for offline sync
      const cachedEvents = await AsyncStorage.getItem('@wifi_events') || '[]';
      const events = JSON.parse(cachedEvents);
      events.push(logEntry);
      await AsyncStorage.setItem('@wifi_events', JSON.stringify(events.slice(-100))); // Keep last 100

    } catch (error) {
      console.error('❌ Error logging attendance event:', error);
    }
  };

  /**
   * Get user-friendly status message
   */
  const getStatusMessage = () => {
    if (!currentLecture) {
      return { message: 'No active lecture', type: 'info' };
    }

    if (wifiStatus.isInGracePeriod) {
      return {
        message: `WiFi disconnected - ${Math.floor(wifiStatus.graceTimeRemaining / 60)}:${(wifiStatus.graceTimeRemaining % 60).toString().padStart(2, '0')} grace period remaining`,
        type: 'warning'
      };
    }

    if (!wifiStatus.isConnected) {
      return { message: 'Not connected to WiFi', type: 'error' };
    }

    if (!wifiStatus.isAuthorized) {
      return {
        message: `Wrong classroom - Connect to ${currentLecture.room} WiFi`,
        type: 'error'
      };
    }

    return {
      message: `Connected to ${currentLecture.room} WiFi`,
      type: 'success'
    };
  };

  /**
   * Manual WiFi check (for pull-to-refresh)
   */
  const refreshWiFiStatus = async () => {
    await WiFiManager.loadAuthorizedBSSIDs(serverUrl);
    await checkWiFiAuthorization();
  };

  // Return WiFi attendance hook interface
  return {
    // WiFi Status
    wifiStatus,
    
    // Timer State  
    timerState,
    
    // Actions
    startTimer,
    stopTimer,
    checkWiFiAuthorization,
    refreshWiFiStatus,
    
    // Status
    getStatusMessage,
    
    // History
    attendanceHistory,
    
    // Computed values
    canStartTimer: timerState.canStart && wifiStatus.isAuthorized,
    shouldPauseTimer: timerState.isPaused,
    isInValidLocation: wifiStatus.isAuthorized
  };
};