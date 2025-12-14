import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import Colors from './Colors';
import { getServerTime } from './ServerTime';

export default function TeacherDashboard({ 
  theme, 
  userData, 
  onNavigate,
  socketUrl 
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [todayClasses, setTodayClasses] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    completedClasses: 0,
    upcomingClasses: 0,
    attendanceRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadDashboardData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch today's classes using server time
      let today;
      try {
        const serverTime = getServerTime();
        today = serverTime.nowDate().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      } catch {
        today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      }
      
      const classesResponse = await fetch(
        `${socketUrl}/api/teacher-schedule/${userData.employeeId}/${today}`
      );
      const classesData = await classesResponse.json();
      
      if (classesData.success) {
        setTodayClasses(classesData.schedule || []);
        
        // Find current class using server time
        let now, currentHour, currentMinute;
        try {
          const serverTime = getServerTime();
          now = serverTime.nowDate();
          currentHour = now.getHours();
          currentMinute = now.getMinutes();
        } catch {
          now = new Date();
          currentHour = now.getHours();
          currentMinute = now.getMinutes();
        }
        const currentTime = currentHour * 60 + currentMinute;
        
        const ongoing = classesData.schedule.find(cls => {
          const [startH, startM] = cls.startTime.split(':').map(Number);
          const [endH, endM] = cls.endTime.split(':').map(Number);
          const startTime = startH * 60 + startM;
          const endTime = endH * 60 + endM;
          return currentTime >= startTime && currentTime <= endTime;
        });
        
        setCurrentClass(ongoing);
        
        // Calculate stats
        const completed = classesData.schedule.filter(cls => {
          const [endH, endM] = cls.endTime.split(':').map(Number);
          const endTime = endH * 60 + endM;
          return currentTime > endTime;
        }).length;
        
        const upcoming = classesData.schedule.length - completed - (ongoing ? 1 : 0);
        
        setStats({
          totalClasses: classesData.schedule.length,
          completedClasses: completed,
          upcomingClasses: upcoming,
          attendanceRate: 85, // TODO: Calculate from actual data
        });
      }
    } catch (error) {
      console.log('Error loading dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getCurrentTime = () => {
    try {
      const serverTime = getServerTime();
      return serverTime.nowDate().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  const getGreeting = () => {
    try {
      const serverTime = getServerTime();
      const hour = serverTime.nowDate().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 17) return 'Good Afternoon';
      return 'Good Evening';
    } catch {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 17) return 'Good Afternoon';
      return 'Good Evening';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: Colors.primary.main }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.teacherName}>{userData?.name || 'Teacher'}</Text>
              <Text style={styles.department}>{userData?.department} Department</Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{getCurrentTime()}</Text>
              <Text style={styles.date}>
                {(() => {
                  try {
                    const serverTime = getServerTime();
                    return serverTime.nowDate().toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    });
                  } catch {
                    return new Date().toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    });
                  }
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: Colors.primary.main }]}>
              {stats.totalClasses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Classes
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: Colors.status.success }]}>
              {stats.completedClasses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Completed
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: Colors.status.info }]}>
              {stats.upcomingClasses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Upcoming
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: Colors.secondary.main }]}>
              {stats.attendanceRate}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Attendance
            </Text>
          </View>
        </View>

        {/* Current Class Card */}
        {currentClass && (
          <View style={[styles.currentClassCard, { 
            backgroundColor: theme.cardBackground,
            borderColor: Colors.status.success 
          }]}>
            <View style={styles.currentClassHeader}>
              <View style={[styles.liveIndicator, { backgroundColor: Colors.status.success }]}>
                <Text style={styles.liveText}>● LIVE</Text>
              </View>
              <Text style={[styles.currentClassLabel, { color: theme.textSecondary }]}>
                Current Class
              </Text>
            </View>
            
            <Text style={[styles.currentClassSubject, { color: theme.text }]}>
              {currentClass.subject}
            </Text>
            
            <View style={styles.currentClassDetails}>
              <Text style={[styles.currentClassInfo, { color: theme.textSecondary }]}>
                🕐 {currentClass.startTime} - {currentClass.endTime}
              </Text>
              <Text style={[styles.currentClassInfo, { color: theme.textSecondary }]}>
                🏢 Room {currentClass.room}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.primary.main }]}
              onPress={() => onNavigate('attendance')}
            >
              <Text style={styles.actionButtonText}>View Live Attendance</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.cardBackground }]}
              onPress={() => onNavigate('classes')}
            >
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                Today's Classes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.cardBackground }]}
              onPress={() => onNavigate('students')}
            >
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                Students
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.cardBackground }]}
              onPress={() => onNavigate('analytics')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                Analytics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.cardBackground }]}
              onPress={() => onNavigate('timetable')}
            >
              <Text style={styles.quickActionIcon}>🗓️</Text>
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                Timetable
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Classes */}
        {todayClasses.length > 0 && (
          <View style={styles.upcomingContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Today's Schedule
            </Text>
            
            {todayClasses.slice(0, 3).map((cls, index) => (
              <View
                key={index}
                style={[styles.classCard, { backgroundColor: theme.cardBackground }]}
              >
                <View style={styles.classCardLeft}>
                  <Text style={[styles.classTime, { color: theme.primary }]}>
                    {cls.startTime}
                  </Text>
                  <Text style={[styles.classTimeTo, { color: theme.textSecondary }]}>
                    {cls.endTime}
                  </Text>
                </View>
                
                <View style={styles.classCardRight}>
                  <Text style={[styles.classSubject, { color: theme.text }]}>
                    {cls.subject}
                  </Text>
                  <Text style={[styles.classDetails, { color: theme.textSecondary }]}>
                    🏢 Room {cls.room} • {cls.course} Sem {cls.semester}
                  </Text>
                </View>
              </View>
            ))}

            {todayClasses.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => onNavigate('classes')}
              >
                <Text style={[styles.viewAllText, { color: Colors.primary.main }]}>
                  View All Classes →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  teacherName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  department: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  currentClassCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  currentClassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentClassLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  currentClassSubject: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  currentClassDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  currentClassInfo: {
    fontSize: 14,
  },
  actionButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  upcomingContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  classCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classCardLeft: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  classTimeTo: {
    fontSize: 12,
    marginTop: 2,
  },
  classCardRight: {
    flex: 1,
    justifyContent: 'center',
  },
  classSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 13,
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
