import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { BookIcon, CalendarIcon, CoffeeIcon, LocationIcon } from './Icons';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableScreen({ theme, semester, branch, socketUrl }) {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get current day (0 = Monday, 5 = Saturday, Sunday defaults to Monday)
  const getCurrentDayIndex = () => {
    const day = new Date().getDay();
    if (day === 0) return 0; // Sunday -> Monday
    return day - 1; // Monday = 0, Saturday = 5
  };
  
  const [currentDay, setCurrentDay] = useState(getCurrentDayIndex());

  useEffect(() => {
    fetchTimetable();
  }, [semester, branch]);

  const fetchTimetable = async () => {
    if (!semester || !branch) {
      console.log('No semester or branch provided');
      setLoading(false);
      return;
    }

    if (!socketUrl) {
      console.log('No socket URL provided');
      setLoading(false);
      return;
    }

    console.log('Fetching timetable for:', semester, branch);
    setLoading(true);
    try {
      const url = `${socketUrl}/api/timetable/${semester}/${branch}`;
      console.log('Fetching from:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('Timetable data received:', data);

      if (data.success && data.timetable) {
        setTimetable(data.timetable);
        console.log('Timetable loaded successfully');
        console.log('Periods from API:', data.timetable.periods);
      } else {
        console.log('No timetable found');
        setTimetable(null);
      }
    } catch (error) {
      console.log('Error fetching timetable:', error);
      setTimetable(null);
    } finally {
      setLoading(false);
    }
  };

  // Get periods from timetable data or use defaults
  const getPeriods = () => {
    if (timetable && timetable.periods && timetable.periods.length > 0) {
      return timetable.periods.map(p => ({
        number: p.number,
        time: `${p.startTime} - ${p.endTime}`
      }));
    }
    // Fallback periods
    return [
      { number: 1, time: '09:40 - 10:40' },
      { number: 2, time: '10:40 - 11:40' },
      { number: 3, time: '11:40 - 12:10' },
      { number: 4, time: '12:10 - 13:10' },
      { number: 5, time: '13:10 - 14:10' },
      { number: 6, time: '14:10 - 14:20' },
      { number: 7, time: '14:20 - 15:30' },
      { number: 8, time: '15:30 - 16:10' },
    ];
  };

  const getTodaySchedule = () => {
    if (!timetable || !timetable.timetable) return [];
    const dayName = DAYS[currentDay]?.toLowerCase();
    if (!dayName) return [];
    return timetable.timetable[dayName] || [];
  };

  const getSubjectForPeriod = (day, periodNum) => {
    if (!timetable || !timetable.timetable) return null;
    if (day < 0 || day >= DAYS.length) return null;
    const dayName = DAYS[day].toLowerCase();
    const schedule = timetable.timetable[dayName] || [];
    return schedule.find(s => s && s.period === periodNum);
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 9 && hour < 17) {
      return hour - 8; // Period 1 starts at 9 AM
    }
    return null;
  };

  const currentPeriod = getCurrentPeriod();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BookIcon size={28} color={theme.primary} />
          <Text style={[styles.title, { color: theme.primary }]}>Timetable</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {semester && branch ? `Semester ${semester} • ${branch}` : 'Your class schedule'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading timetable...
          </Text>
        </View>
      ) : !timetable ? (
        <View style={styles.emptyContainer}>
          <CalendarIcon size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No timetable available
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Contact your administrator
          </Text>
        </View>
      ) : (
        <>
          {/* Day Selector */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.daySelector}
            contentContainerStyle={styles.daySelectorContent}
          >
            {DAYS.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  { 
                    backgroundColor: currentDay === index ? theme.primary : theme.cardBackground,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => setCurrentDay(index)}
              >
                <Text style={[
                  styles.dayButtonText,
                  { color: currentDay === index ? '#fff' : theme.text }
                ]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Today's Schedule */}
          <View style={[styles.scheduleCard, { 
            backgroundColor: theme.cardBackground, 
            borderColor: theme.border 
          }]}>
            <Text style={[styles.scheduleTitle, { color: theme.text }]}>
              {DAYS[currentDay] || 'Monday'}'s Schedule
            </Text>

            {getPeriods().map((period) => {
              const subject = getSubjectForPeriod(currentDay, period.number);
              const isCurrentPeriod = currentPeriod === period.number;
              const isBreak = subject?.isBreak;

              return (
                <View
                  key={period.number}
                  style={[
                    styles.periodRow,
                    { borderBottomColor: theme.border },
                    isCurrentPeriod && { backgroundColor: theme.primary + '15' },
                    isBreak && { backgroundColor: '#fbbf2420' }
                  ]}
                >
                  <View style={styles.periodInfo}>
                    <Text style={[styles.periodNumber, { color: theme.primary }]}>
                      {period.number}
                    </Text>
                    <Text style={[styles.periodTime, { color: theme.textSecondary }]}>
                      {period.time}
                    </Text>
                  </View>

                  <View style={styles.subjectInfo}>
                    {subject ? (
                      <>
                        <View style={styles.subjectRow}>
                          {isBreak && <CoffeeIcon size={16} color="#fbbf24" />}
                          <Text style={[
                            styles.subjectName,
                            { color: isBreak ? '#fbbf24' : theme.text },
                            isBreak && { marginLeft: 6 }
                          ]}>
                            {isBreak ? 'Break' : subject.subject || 'Free Period'}
                          </Text>
                        </View>
                        {!isBreak && subject.room && (
                          <View style={styles.roomRow}>
                            <LocationIcon size={12} color={theme.textSecondary} />
                            <Text style={[styles.roomName, { color: theme.textSecondary, marginLeft: 4 }]}>
                              {subject.room}
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={[styles.subjectName, { color: theme.textSecondary }]}>
                        Free Period
                      </Text>
                    )}
                  </View>

                  {isCurrentPeriod && (
                    <View style={[styles.currentBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.currentBadgeText}>Now</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Week Overview */}
          <View style={[styles.weekCard, { 
            backgroundColor: theme.cardBackground, 
            borderColor: theme.border 
          }]}>
            <Text style={[styles.weekTitle, { color: theme.text }]}>Week Overview</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.weekGrid}>
                {/* Header Row */}
                <View style={styles.weekRow}>
                  <View style={[styles.weekCell, styles.weekHeaderCell]}>
                    <Text style={[styles.weekHeaderText, { color: theme.textSecondary }]}>
                      Period
                    </Text>
                  </View>
                  {DAYS.map(day => (
                    <View key={day} style={[styles.weekCell, styles.weekHeaderCell]}>
                      <Text style={[styles.weekHeaderText, { color: theme.textSecondary }]}>
                        {day.substring(0, 3)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Period Rows */}
                {getPeriods().map(period => (
                  <View key={period.number} style={styles.weekRow}>
                    <View style={[styles.weekCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.weekCellText, { color: theme.primary }]}>
                        {period.number}
                      </Text>
                    </View>
                    {DAYS.map((day, dayIndex) => {
                      const subject = getSubjectForPeriod(dayIndex, period.number);
                      return (
                        <View 
                          key={day} 
                          style={[
                            styles.weekCell,
                            { backgroundColor: theme.background },
                            subject?.isBreak && { backgroundColor: '#fbbf2420' }
                          ]}
                        >
                          <View style={{ alignItems: 'center' }}>
                            <Text 
                              style={[
                                styles.weekCellText, 
                                { color: subject?.isBreak ? '#fbbf24' : theme.text, fontWeight: '600' }
                              ]}
                              numberOfLines={2}
                            >
                              {subject?.isBreak ? 'Break' : subject?.subject?.substring(0, 10) || '-'}
                            </Text>
                            {subject && !subject.isBreak && subject.room && (
                              <Text 
                                style={[
                                  styles.weekCellRoom,
                                  { color: theme.textSecondary }
                                ]}
                                numberOfLines={1}
                              >
                                {subject.room}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  daySelector: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  daySelectorContent: {
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleCard: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  periodInfo: {
    width: 80,
  },
  periodNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  periodTime: {
    fontSize: 11,
  },
  subjectInfo: {
    flex: 1,
    marginLeft: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 12,
  },
  currentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  weekCard: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 100,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  weekGrid: {
    minWidth: 700,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekCell: {
    width: 90,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    padding: 6,
  },
  weekHeaderCell: {
    backgroundColor: 'transparent',
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  weekCellText: {
    fontSize: 11,
    textAlign: 'center',
  },
  weekCellRoom: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
});
