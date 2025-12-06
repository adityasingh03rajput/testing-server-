import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import FilterButtons from './FilterButtons';

const StudentList = ({ theme, students = [], onStudentPress, activeRandomRing = null, onTeacherAction }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filter students based on selected filter
  const filteredStudents = students.filter((student) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return student.isRunning === true; // Only show students with timer running
    return student.status === selectedFilter;
  });

  // Calculate counts for each filter
  const filterCounts = {
    all: students.length,
    active: students.filter((s) => s.isRunning === true).length, // Count students with timer running
    present: students.filter((s) => s.status === 'present').length,
    absent: students.filter((s) => s.status === 'absent').length,
    left: students.filter((s) => s.status === 'left').length,
  };

  const presentCount = students.filter(
    (s) => s.isRunning === true || s.status === 'present'
  ).length;

  const handleStudentPress = (student) => {
    setSelectedStudent(student);
    if (onStudentPress) {
      onStudentPress(student);
    }
  };

  const renderStudentItem = ({ item: student }) => {
    // Check if this student is in active random ring
    const randomRingStudent = activeRandomRing?.selectedStudents?.find(
      s => s.studentId === student._id || s.enrollmentNo === student.enrollmentNo
    );
    
    return (
      <StudentItem
        student={student}
        theme={theme}
        onPress={() => handleStudentPress(student)}
        randomRingStudent={randomRingStudent}
        onTeacherAction={onTeacherAction || (() => console.log('onTeacherAction not provided'))}
        randomRingId={activeRandomRing?._id}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Class Attendance
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {presentCount} / {students.length} Present
        </Text>
      </View>

      {/* Filter Buttons */}
      <FilterButtons
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        counts={filterCounts}
        theme={theme}
      />

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {selectedFilter === 'all' 
              ? 'No students enrolled in this class yet.'
              : `No students with status: ${selectedFilter}`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item._id || item.id || item.enrollmentNo}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const StudentItem = ({ student, theme, onPress, randomRingStudent, onTeacherAction, randomRingId }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [currentTimerValue, setCurrentTimerValue] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Update currentTimerValue when student.timerValue changes from socket
  useEffect(() => {
    if (student.timerValue !== undefined) {
      setCurrentTimerValue(student.timerValue);
    }
  }, [student.timerValue]);

  useEffect(() => {
    if (student.status === 'absent') {
      setElapsedTime('00:00');
      setCurrentTimerValue(0);
      return;
    }

    // Use timerValue from student object if available
    if (student.timerValue !== undefined) {
      // If timer is running, increment every second
      if (student.isRunning) {
        const interval = setInterval(() => {
          setCurrentTimerValue(prev => {
            const newValue = prev + 1;
            const mins = Math.floor(newValue / 60);
            const secs = newValue % 60;
            setElapsedTime(
              `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            );
            return newValue;
          });
        }, 1000);
        return () => clearInterval(interval);
      } else {
        // Timer not running, just display current value
        const minutes = Math.floor(currentTimerValue / 60);
        const seconds = currentTimerValue % 60;
        setElapsedTime(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    } else {
      // Fallback: calculate from joinTime
      const updateTimer = () => {
        const now = new Date();
        const joinTime = student.joinTime ? new Date(student.joinTime) : new Date();
        const diff = Math.floor((now.getTime() - joinTime.getTime()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setElapsedTime(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [student.joinTime, student.status, student.isRunning, currentTimerValue]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
      case 'attending':
        return { bg: '#d1fae5', text: '#059669' };
      case 'present':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'absent':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'left':
        return { bg: '#fed7aa', text: '#ea580c' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
      case 'attending':
        return 'Attending';
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'left':
        return 'Left Early';
      default:
        return 'Unknown';
    }
  };

  const statusStyle = getStatusStyle(student.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.studentCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
    >
      <View style={styles.studentContent}>
        {/* Profile Image */}
        <Image
          source={{ uri: student.profileImage || student.profilePhoto || 'https://via.placeholder.com/56' }}
          style={styles.profileImage}
        />

        {/* Name and Status */}
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>
            {student.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {getStatusLabel(student.status)}
            </Text>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: theme.text }]}>
            {elapsedTime}
          </Text>
        </View>
      </View>
      
      {/* Accept/Reject Buttons for Random Ring */}
      {randomRingStudent && randomRingStudent.teacherAction === 'pending' && !randomRingStudent.verified && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.acceptButton, { opacity: actionLoading ? 0.5 : 1 }]}
            onPress={async () => {
              if (actionLoading) return;
              if (!onTeacherAction) {
                alert('Error: Teacher action handler not available');
                return;
              }
              setActionLoading(true);
              try {
                await onTeacherAction(randomRingId, student._id || student.enrollmentNo, 'accepted');
              } catch (error) {
                console.error('Error accepting student:', error);
                alert('Error accepting student. Please check your connection.');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
          >
            <Text style={styles.acceptButtonText}>✓ Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.rejectButton, { opacity: actionLoading ? 0.5 : 1 }]}
            onPress={async () => {
              if (actionLoading) return;
              if (!onTeacherAction) {
                alert('Error: Teacher action handler not available');
                return;
              }
              setActionLoading(true);
              try {
                await onTeacherAction(randomRingId, student._id || student.enrollmentNo, 'rejected');
              } catch (error) {
                console.error('Error rejecting student:', error);
                alert('Error rejecting student. Please check your connection.');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
          >
            <Text style={styles.rejectButtonText}>✕ Reject</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Show status after teacher action */}
      {randomRingStudent && randomRingStudent.teacherAction !== 'pending' && (
        <View style={styles.actionStatus}>
          {randomRingStudent.teacherAction === 'accepted' && (
            <Text style={[styles.actionStatusText, { color: '#059669' }]}>
              ✓ Accepted by teacher
            </Text>
          )}
          {randomRingStudent.teacherAction === 'rejected' && !randomRingStudent.faceVerifiedAfterRejection && (
            <Text style={[styles.actionStatusText, { color: '#dc2626' }]}>
              ✕ Rejected - Waiting for face verification
            </Text>
          )}
          {randomRingStudent.faceVerifiedAfterRejection && (
            <Text style={[styles.actionStatusText, { color: '#059669' }]}>
              ✓ Face verified after rejection
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    maxWidth: 768, // 3xl
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
  },
  studentCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16, // space-y-4 = 16px
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  studentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  emptyContainer: {
    borderRadius: 8,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionStatusText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default StudentList;
