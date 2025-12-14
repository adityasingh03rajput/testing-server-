import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

const StudentCard = ({ student, onToggleAttendance, isDark, theme }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const getStatusStyle = (status) => {
    if (status === 'present') {
      return {
        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#D1FAE5',
        color: isDark ? '#34D399' : '#059669',
      };
    }
    if (status === 'attending') {
      // Green style for attending (timer running)
      return {
        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#D1FAE5',
        color: isDark ? '#34D399' : '#059669',
      };
    }
    if (status === 'absent') {
      return {
        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : '#FEE2E2',
        color: isDark ? '#F87171' : '#DC2626',
      };
    }
    // Default: Unknown status (yellow/amber)
    return {
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7',
      color: isDark ? '#FBBF24' : '#D97706',
    };
  };

  const getStatusIcon = (status) => {
    if (status === 'present') return '✅';
    if (status === 'attending') return '⏱️'; // Timer icon for attending
    if (status === 'absent') return '❌';
    return '❓'; // Question mark for unknown
  };

  const statusStyle = getStatusStyle(student.status || 'absent');

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.cardBackground }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {student.photoUrl ? (
          <Image source={{ uri: student.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {getInitials(student.name || 'Student')}
            </Text>
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>
            {student.name || 'Unknown'}
          </Text>
          <Text style={[styles.rollNumber, { color: theme.textSecondary }]}>
            {student.enrollmentNo || student.enrollmentNumber || 'N/A'}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {(student.status || 'absent').charAt(0).toUpperCase() + (student.status || 'absent').slice(1)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggleAttendance(student._id || student.id);
          }}
          style={styles.iconButton}
        >
          <Text style={{ fontSize: 24 }}>
            {getStatusIcon(student.status || 'absent')}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Student Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Student Details
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 24, color: theme.text }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.profileSection}>
                {student.photoUrl ? (
                  <Image
                    source={{ uri: student.photoUrl }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={[styles.profileImage, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.avatarText, { fontSize: 40 }]}>
                      {getInitials(student.name || 'Student')}
                    </Text>
                  </View>
                )}
                <Text style={[styles.profileName, { color: theme.text }]}>
                  {student.name || 'Unknown'}
                </Text>
                <Text style={[styles.profileRoll, { color: theme.textSecondary }]}>
                  {student.enrollmentNo || student.enrollmentNumber || 'N/A'}
                </Text>
              </View>

              <View style={[styles.statsSection, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {student.attendancePercentage || 0}%
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Attendance
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {student.totalClasses || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Total Classes
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Current Status
                </Text>
                <View style={[styles.statusContainer, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>
                    {getStatusIcon(student.status || 'absent')}
                  </Text>
                  <Text style={[styles.statusLabel, { color: statusStyle.color }]}>
                    {(student.status || 'absent').charAt(0).toUpperCase() + (student.status || 'absent').slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.actionButton, { 
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#D1FAE5',
                  }]}
                  onPress={() => {
                    onToggleAttendance(student._id || student.id, 'present');
                    setModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 8 }}>✅</Text>
                  <Text style={[styles.actionButtonText, { 
                    color: isDark ? '#34D399' : '#059669',
                  }]}>
                    Mark Present
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { 
                    backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : '#FEE2E2',
                  }]}
                  onPress={() => {
                    onToggleAttendance(student._id || student.id, 'absent');
                    setModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 8 }}>❌</Text>
                  <Text style={[styles.actionButtonText, { 
                    color: isDark ? '#F87171' : '#DC2626',
                  }]}>
                    Mark Absent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { 
                    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7',
                  }]}
                  onPress={() => {
                    onToggleAttendance(student._id || student.id, 'attending');
                    setModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 8 }}>⏱️</Text>
                  <Text style={[styles.actionButtonText, { 
                    color: isDark ? '#FBBF24' : '#D97706',
                  }]}>
                    Mark Active
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rollNumber: {
    fontSize: 14,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileRoll: {
    fontSize: 16,
  },
  statsSection: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StudentCard;
