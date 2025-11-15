import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAttendanceTracking } from './useAttendanceTracking';
import { getServerTime } from './ServerTime';

export default function StudentHomeScreen({ 
  theme, 
  userData, 
  timetable, 
  socketUrl,
  onShowFluidSim 
}) {
  const [currentLecture, setCurrentLecture] = useState(null);
  const [todayLectures, setTodayLectures] = useState([]);
  const [dailyStats, setDailyStats] = useState(null);

  const {
    isTracking,
    currentLecture: trackingLecture,
    attendanceData,
    startTracking,
    stopTracking,
    getReport
  } = useAttendanceTracking(userData?.enrollmentNo, socketUrl);

  useEffect(() => {
    detectCurrentLecture();
    loadTodayLectures();
    loadDailyStats();

    // Check every minute for lecture changes
    const interval = setInterval(() => {
      detectCurrentLecture();
    }, 60000);

    return () => clearInterval(interval);
  }, [timetable]);

  const detectCurrentLecture = () => {
    if (!timetable) return;

    try {
      const serverTime = getServerTime();
      const now = serverTime.nowDate();
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const todaySchedule = timetable.timetable?.[dayName];
      if (!todaySchedule) return;

      // Find current lecture
      for (const period of timetable.periods || []) {
        const [startHour, startMin] = period.startTime.split(':').map(Number);
        const [endHour, endMin] = period.endTime.split(':').map(Number);
        const periodStart = startHour * 60 + startMin;
        const periodEnd = endHour * 60 + endMin;

        if (currentTime >= periodStart && currentTime < periodEnd) {
          const lecture = {
            subject: todaySchedule[period.name],
            room: period.room || 'N/A',
            startTime: period.startTime,
            endTime: period.endTime,
            periodName: period.name,
            totalMinutes: periodEnd - periodStart,
            semester: userData?.semester,
            branch: userData?.course,
            teacherName: period.teacher || 'N/A'
          };

          setCurrentLecture(lecture);

          // Auto-start tracking if not already tracking
          if (!isTracking && lecture.subject !== 'Break') {
            startTracking(lecture, timetable);
          }

          return;
        }
      }

      // No current lecture
      setCurrentLecture(null);
      if (isTracking) {
        stopTracking('lecture_ended');
      }
    } catch (error) {
      console.error('Error detecting lecture:', error);
    }
  };

  const loadTodayLectures = () => {
    if (!timetable) return;

    try {
      const serverTime = getServerTime();
      const now = serverTime.nowDate();
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const todaySchedule = timetable.timetable?.[dayName];

      if (!todaySchedule) return;

      const lectures = (timetable.periods || [])
        .filter(period => todaySchedule[period.name] && todaySchedule[period.name] !== 'Break')
        .map(period => ({
          subject: todaySchedule[period.name],
          startTime: period.startTime,
          endTime: period.endTime,
          room: period.room || 'N/A'
        }));

      setTodayLectures(lectures);
    } catch (error) {
      console.error('Error loading lectures:', error);
    }
  };

  const loadDailyStats = async () => {
    try {
      const serverTime = getServerTime();
      const today = serverTime.nowDate();
      const report = await getReport(today);

      if (report.found) {
        setDailyStats(report.dailySummary);
      }
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  const formatTime = (timeObj) => {
    if (!timeObj) return '0m 0s';
    return `${timeObj.hours}h ${timeObj.minutes}m ${timeObj.seconds}s`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Current Lecture Card */}
      {currentLecture ? (
        <View style={[styles.currentLectureCard, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.primary 
        }]}>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.liveText, { color: '#10b981' }]}>LIVE NOW</Text>
          </View>

          <Text style={[styles.currentSubject, { color: theme.text }]}>
            {currentLecture.subject}
          </Text>

          <View style={styles.lectureDetails}>
            <Text style={[styles.lectureTime, { color: theme.textSecondary }]}>
              ⏰ {currentLecture.startTime} - {currentLecture.endTime}
            </Text>
            <Text style={[styles.lectureRoom, { color: theme.textSecondary }]}>
              📍 Room {currentLecture.room}
            </Text>
          </View>

          {isTracking && (
            <View style={[styles.trackingStatus, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.trackingText, { color: theme.primary }]}>
                ✓ Attendance Being Tracked
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.noLectureCard, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.border 
        }]}>
          <Text style={[styles.noLectureText, { color: theme.textSecondary }]}>
            📚 No lecture right now
          </Text>
          <Text style={[styles.noLectureSubtext, { color: theme.textSecondary }]}>
            Enjoy your break!
          </Text>
        </View>
      )}

      {/* Daily Summary */}
      {dailyStats && (
        <View style={[styles.summaryCard, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.border 
        }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Today's Attendance
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {dailyStats.percentage}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Overall
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {formatTime(dailyStats.totalAttended)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Attended
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {formatTime(dailyStats.totalClass)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { 
            backgroundColor: dailyStats.isPresentForDay ? '#10b98120' : '#ef444420' 
          }]}>
            <Text style={[styles.statusText, { 
              color: dailyStats.isPresentForDay ? '#10b981' : '#ef4444' 
            }]}>
              {dailyStats.isPresentForDay ? '✓ Present' : '✗ Absent'} 
              {' '}(Need {dailyStats.requiredDailyPercentage}%)
            </Text>
          </View>
        </View>
      )}

      {/* Today's Lectures */}
      <View style={[styles.lecturesCard, { 
        backgroundColor: theme.cardBackground,
        borderColor: theme.border 
      }]}>
        <Text style={[styles.lecturesTitle, { color: theme.text }]}>
          Today's Schedule ({todayLectures.length} lectures)
        </Text>

        {todayLectures.map((lecture, index) => (
          <View 
            key={index}
            style={[styles.lectureItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.lectureLeft}>
              <Text style={[styles.lectureSubject, { color: theme.text }]}>
                {lecture.subject}
              </Text>
              <Text style={[styles.lectureTimeSmall, { color: theme.textSecondary }]}>
                {lecture.startTime} - {lecture.endTime}
              </Text>
            </View>
            <Text style={[styles.lectureRoomSmall, { color: theme.textSecondary }]}>
              {lecture.room}
            </Text>
          </View>
        ))}
      </View>

      {/* Fun Button */}
      <TouchableOpacity
        style={[styles.funButton, { backgroundColor: theme.primary }]}
        onPress={onShowFluidSim}
      >
        <Text style={styles.funButtonText}>🎮 Take a Break</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  currentLectureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentSubject: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  lectureDetails: {
    gap: 8,
  },
  lectureTime: {
    fontSize: 16,
  },
  lectureRoom: {
    fontSize: 16,
  },
  trackingStatus: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noLectureCard: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  noLectureText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  noLectureSubtext: {
    fontSize: 14,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lecturesCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  lecturesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  lectureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lectureLeft: {
    flex: 1,
  },
  lectureSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lectureTimeSmall: {
    fontSize: 12,
  },
  lectureRoomSmall: {
    fontSize: 14,
  },
  funButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  funButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
