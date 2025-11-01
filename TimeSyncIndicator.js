import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getServerTime } from './ServerTime';

export default function TimeSyncIndicator({ theme, position = 'top' }) {
  const [syncStatus, setSyncStatus] = useState({
    isSynced: false,
    offset: 0,
    lastSync: 0,
    serverTime: '',
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      try {
        const serverTime = getServerTime();
        setSyncStatus({
          isSynced: serverTime.isSynchronized(),
          offset: serverTime.serverTimeOffset,
          lastSync: serverTime.getTimeSinceLastSync(),
          serverTime: serverTime.format('HH:mm:ss'),
        });
      } catch (error) {
        setSyncStatus({
          isSynced: false,
          offset: 0,
          lastSync: 0,
          serverTime: '--:--:--',
        });
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const getSyncColor = () => {
    if (!syncStatus.isSynced) return '#ff4444';
    if (syncStatus.lastSync < 300) return '#4CAF50'; // < 5 minutes
    if (syncStatus.lastSync < 600) return '#FF9800'; // < 10 minutes
    return '#ff4444'; // > 10 minutes
  };

  const getSyncText = () => {
    if (!syncStatus.isSynced) return 'Not Synced';
    if (syncStatus.lastSync < 60) return 'Synced';
    if (syncStatus.lastSync < 300) return `${Math.floor(syncStatus.lastSync / 60)}m ago`;
    return 'Sync Old';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
        { backgroundColor: theme.cardBackground + 'E6' },
      ]}
      onPress={() => setShowDetails(!showDetails)}
      activeOpacity={0.8}
    >
      <View style={styles.indicator}>
        <View style={[styles.dot, { backgroundColor: getSyncColor() }]} />
        <Text style={[styles.text, { color: theme.text }]}>
          {syncStatus.serverTime}
        </Text>
        {showDetails && (
          <View style={[styles.details, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Status: {getSyncText()}
            </Text>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Offset: {syncStatus.offset}ms
            </Text>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Last sync: {syncStatus.lastSync}s ago
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  top: {
    top: 50,
  },
  bottom: {
    bottom: 100,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  details: {
    position: 'absolute',
    top: 30,
    left: 0,
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  detailText: {
    fontSize: 11,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
