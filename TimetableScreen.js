import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal
} from 'react-native';
import { BookIcon, CalendarIcon, CoffeeIcon, LocationIcon } from './Icons';
import { getServerTime } from './ServerTime';

export default function TimetableScreen({ theme, semester, branch, socketUrl, canEdit = false, isTeacher = false }) {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [saving, setSaving] = useState(false);

  // Get days dynamically from timetable
  const getDaysFromTimetable = () => {
    if (!timetable?.timetable) {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    return Object.keys(timetable.timetable).map(day =>
      day.charAt(0).toUpperCase() + day.slice(1)
    );
  };

  const DAYS = getDaysFromTimetable();

  // Get current day index based on available days
  const getCurrentDayIndex = () => {
    try {
      const dayOfWeek = getServerTime().nowDate().getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = dayNames[dayOfWeek];

      // Find index in available days
      const dayKeys = timetable?.timetable ? Object.keys(timetable.timetable) : [];
      const index = dayKeys.indexOf(currentDayName);

      // If current day not in timetable, default to first available day
      return index >= 0 ? index : 0;
    } catch {
      return 0;
    }
  };

  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    fetchTimetable();
  }, [semester, branch]);

  // Update current day when timetable loads
  useEffect(() => {
    if (timetable) {
      setCurrentDay(getCurrentDayIndex());
    }
  }, [timetable]);

  // Force refresh when screen is focused
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if timetable needs refresh every 30 seconds
      if (semester && branch && socketUrl) {
        fetchTimetable();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [semester, branch, socketUrl]);

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
        // Log first subject of each day to verify data structure
        const tt = data.timetable.timetable;
        if (tt) {
          console.log('📅 Timetable first subjects:');
          console.log('  Monday:', tt.monday?.[0]?.subject);
          console.log('  Tuesday:', tt.tuesday?.[0]?.subject);
          console.log('  Wednesday:', tt.wednesday?.[0]?.subject);
          console.log('  Thursday:', tt.thursday?.[0]?.subject);
          console.log('  Friday:', tt.friday?.[0]?.subject);
        }

        setTimetable(data.timetable);
        console.log('Timetable loaded successfully');
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

  const saveTimetable = async () => {
    if (!canEdit || !timetable) return;

    setSaving(true);
    try {
      const response = await fetch(`${socketUrl}/api/timetable/${semester}/${branch}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetable: timetable.timetable })
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Timetable saved successfully');
        alert('Timetable saved successfully!');
      } else {
        console.log('❌ Failed to save timetable');
        alert('Failed to save timetable');
      }
    } catch (error) {
      console.log('Error saving timetable:', error);
      alert('Error saving timetable');
    } finally {
      setSaving(false);
    }
  };

  const handleCellPress = (dayIndex, periodNumber) => {
    if (!canEdit) return;

    const dayKey = DAYS[dayIndex].toLowerCase();
    const period = timetable.timetable[dayKey].find(p => p.period === periodNumber);

    if (period) {
      setEditingCell({ dayIndex, periodNumber });
      setEditSubject(period.subject || '');
      setEditRoom(period.room || '');
    }
  };

  const handleSaveCell = () => {
    if (!editingCell) return;

    const { dayIndex, periodNumber } = editingCell;
    const dayKey = DAYS[dayIndex].toLowerCase();

    const updatedTimetable = { ...timetable };
    const periodIndex = updatedTimetable.timetable[dayKey].findIndex(p => p.period === periodNumber);

    if (periodIndex !== -1) {
      updatedTimetable.timetable[dayKey][periodIndex] = {
        ...updatedTimetable.timetable[dayKey][periodIndex],
        subject: editSubject,
        room: editRoom,
        isBreak: false
      };
      setTimetable(updatedTimetable);
    }

    setEditingCell(null);
    setEditSubject('');
    setEditRoom('');
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
    if (!timetable || !timetable.timetable) {
      console.log('⚠️ No timetable data');
      return null;
    }
    if (day < 0 || day >= DAYS.length) return null;

    const dayName = DAYS[day].toLowerCase();
    const schedule = timetable.timetable[dayName] || [];

    // Debug: Log for period 1 of each day to see what's being fetched
    if (periodNum === 1) {
      const subject = schedule.find(s => s && s.period === periodNum);
      console.log(`📅 ${dayName} Period 1:`, subject?.subject || 'none');
    }

    return schedule.find(s => s && s.period === periodNum);
  };

  const getCurrentPeriod = () => {
    try {
      const now = getServerTime().nowDate();
      const hour = now.getHours();
      if (hour >= 9 && hour < 17) {
        return hour - 8; // Period 1 starts at 9 AM
      }
      return null;
    } catch {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 9 && hour < 17) {
        return hour - 8;
      }
      return null;
    }
  };

  const currentPeriod = getCurrentPeriod();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BookIcon size={28} color={theme.primary} />
          <Text style={[styles.title, { color: theme.primary }]}>Timetable</Text>
          {canEdit && (
            <TouchableOpacity
              onPress={saveTimetable}
              disabled={saving}
              style={{
                backgroundColor: theme.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                marginLeft: 'auto',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {saving ? 'Saving...' : '💾 Save'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {semester && branch ? `Semester ${semester} • ${branch}` : 'Your class schedule'}
          {canEdit && ' • Tap to edit'}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.scheduleTitle, { color: theme.text }]}>
                {DAYS[currentDay] || 'Monday'}'s Schedule
              </Text>
              <TouchableOpacity onPress={fetchTimetable} style={{ padding: 8 }}>
                <Text style={{ color: theme.primary, fontSize: 14 }}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>

            {getPeriods().map((period) => {
              const subject = getSubjectForPeriod(currentDay, period.number);

              // Debug: Log what list view is showing
              if (period.number === 1) {
                console.log(`📋 LIST VIEW - ${DAYS[currentDay]} Period 1:`, subject?.subject);
              }

              const isCurrentPeriod = currentPeriod === period.number;
              const isBreak = subject?.isBreak;

              return (
                <TouchableOpacity
                  key={period.number}
                  onPress={() => canEdit && handleCellPress(currentDay, period.number)}
                  disabled={!canEdit}
                  activeOpacity={canEdit ? 0.7 : 1}
                >
                  <View
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
                </TouchableOpacity>
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

                      // Debug: Log what table view is showing
                      if (period.number === 1 && dayIndex === 0) {
                        console.log(`📊 TABLE VIEW - Monday Period 1:`, subject?.subject);
                      }

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

      {/* Edit Modal */}
      <Modal
        visible={editingCell !== null && canEdit}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingCell(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: theme.cardBackground,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            borderWidth: 2,
            borderColor: theme.primary,
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>
              Edit Period
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 20 }}>
              {editingCell && `${DAYS[editingCell.dayIndex]} - Period ${editingCell.periodNumber}`}
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
              Subject Name
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.background,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: theme.text,
                marginBottom: 16,
              }}
              value={editSubject}
              onChangeText={setEditSubject}
              placeholder="Enter subject name"
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
              Room Number
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.background,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: theme.text,
                marginBottom: 24,
              }}
              value={editRoom}
              onChangeText={setEditRoom}
              placeholder="Enter room number"
              placeholderTextColor={theme.textSecondary}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setEditingCell(null);
                  setEditSubject('');
                  setEditRoom('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: theme.border,
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 16 }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveCell}
                style={{
                  flex: 1,
                  backgroundColor: theme.primary,
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
