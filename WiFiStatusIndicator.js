import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * WiFi Status Indicator Component
 * Shows current WiFi connection status and BSSID validation
 */
export default function WiFiStatusIndicator({ 
  wifiStatus, 
  timerState, 
  currentLecture, 
  onRefresh, 
  theme,
  style 
}) {
  const getStatusInfo = () => {
    if (!currentLecture) {
      return {
        icon: '📚',
        message: 'No active lecture',
        color: theme.textSecondary,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border
      };
    }

    if (wifiStatus.isInGracePeriod) {
      const minutes = Math.floor(wifiStatus.graceTimeRemaining / 60);
      const seconds = wifiStatus.graceTimeRemaining % 60;
      return {
        icon: '⏳',
        message: `Grace period: ${minutes}:${seconds.toString().padStart(2, '0')}`,
        color: '#f59e0b',
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b'
      };
    }

    if (!wifiStatus.isConnected) {
      return {
        icon: '📶',
        message: 'Not connected to WiFi',
        color: '#ef4444',
        backgroundColor: '#fee2e2',
        borderColor: '#ef4444'
      };
    }

    if (!wifiStatus.isAuthorized) {
      return {
        icon: '🚫',
        message: `Wrong classroom - Need ${currentLecture.room} WiFi`,
        color: '#ef4444',
        backgroundColor: '#fee2e2',
        borderColor: '#ef4444'
      };
    }

    if (timerState.isPaused) {
      return {
        icon: '⏸️',
        message: `Timer paused - ${timerState.pauseReason}`,
        color: '#f59e0b',
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b'
      };
    }

    return {
      icon: '✅',
      message: `Connected to ${currentLecture.room} WiFi`,
      color: '#22c55e',
      backgroundColor: '#dcfce7',
      borderColor: '#22c55e'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: statusInfo.backgroundColor,
          borderColor: statusInfo.borderColor,
        },
        style
      ]}
      onPress={onRefresh}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{statusInfo.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: statusInfo.color }]}>
            {statusInfo.message}
          </Text>
          {wifiStatus.currentBSSID && (
            <Text style={[styles.bssid, { color: statusInfo.color + '80' }]}>
              BSSID: {wifiStatus.currentBSSID}
            </Text>
          )}
          {wifiStatus.lastCheck && (
            <Text style={[styles.lastCheck, { color: statusInfo.color + '60' }]}>
              Last check: {new Date(wifiStatus.lastCheck).toLocaleTimeString()}
            </Text>
          )}
        </View>
        <Text style={[styles.refreshIcon, { color: statusInfo.color }]}>🔄</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bssid: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 1,
  },
  lastCheck: {
    fontSize: 10,
  },
  refreshIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
});