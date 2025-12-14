import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TeacherStats = ({ students, isDark, theme }) => {
  const totalStudents = students.length;
  const presentStudents = students.filter(s => s && s.status === 'present').length;
  const absentStudents = students.filter(s => s && s.status === 'absent').length;
  const attendingStudents = students.filter(s => s && s.status === 'attending').length;
  const attendancePercentage = totalStudents > 0 
    ? Math.round((presentStudents / totalStudents) * 100) 
    : 0;

  const stats = [
    {
      id: 1,
      label: 'Total',
      value: totalStudents,
      icon: '👥',
      color: theme.primary,
      bgColor: isDark ? 'rgba(96, 165, 250, 0.2)' : '#DBEAFE',
    },
    {
      id: 2,
      label: 'Present',
      value: presentStudents,
      icon: '✅',
      color: isDark ? '#34D399' : '#059669',
      bgColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#D1FAE5',
    },
    {
      id: 3,
      label: 'Absent',
      value: absentStudents,
      icon: '❌',
      color: isDark ? '#F87171' : '#DC2626',
      bgColor: isDark ? 'rgba(248, 113, 113, 0.2)' : '#FEE2E2',
    },
    {
      id: 4,
      label: 'Active',
      value: attendingStudents,
      icon: '⏱️',
      color: isDark ? '#FBBF24' : '#D97706',
      bgColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View
            key={stat.id}
            style={[
              styles.statCard,
              { 
                backgroundColor: theme.cardBackground,
                borderLeftColor: stat.color,
              },
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: stat.bgColor }]}>
              <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.attendanceCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.attendanceHeader}>
          <Text style={[styles.attendanceTitle, { color: theme.text }]}>
            Today's Attendance
          </Text>
          <View style={[styles.percentageBadge, { 
            backgroundColor: attendancePercentage >= 75 
              ? (isDark ? 'rgba(52, 211, 153, 0.2)' : '#D1FAE5')
              : (isDark ? 'rgba(248, 113, 113, 0.2)' : '#FEE2E2')
          }]}>
            <Text style={[styles.percentageText, { 
              color: attendancePercentage >= 75 
                ? (isDark ? '#34D399' : '#059669')
                : (isDark ? '#F87171' : '#DC2626')
            }]}>
              {attendancePercentage}%
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${attendancePercentage}%`,
                  backgroundColor: attendancePercentage >= 75 
                    ? (isDark ? '#34D399' : '#10B981')
                    : (isDark ? '#F87171' : '#EF4444')
                },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.attendanceInfo, { color: theme.textSecondary }]}>
          {presentStudents} out of {totalStudents} students present
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    margin: 6,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  attendanceCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  percentageBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  attendanceInfo: {
    fontSize: 14,
  },
});

export default TeacherStats;
