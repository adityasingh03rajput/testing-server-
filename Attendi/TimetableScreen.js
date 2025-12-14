import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, RefreshControl
} from 'react-native';
import { BookIcon, CalendarIcon, CoffeeIcon, LocationIcon } from './Icons';
import { getServerTime } from './ServerTime';

export default function TimetableScreen({ 
  theme, 
  semester, 
  branch, 
  socketUrl, 
  canEdit = false, 
  isTeacher = false,
  onRefreshPermissions,
  userData,
  loginId,  // Add loginId prop
  onLogout  // Add logout handler prop
}) {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedPeriod, setCopiedPeriod] = useState(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Track edit mode toggle (teacher controls this)
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);
  
  // Three-dot menu state
  const [showMenu, setShowMenu] = useState(false);

  // Teacher timetable selection states
  const [selectedSemester, setSelectedSemester] = useState(semester || '3');
  const [selectedBranch, setSelectedBranch] = useState(branch || 'B.Tech Computer Science');
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  
  // Available options for teachers
  const semesterOptions = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const branchOptions = [
    'B.Tech Computer Science',
    'B.Tech Data Science',
    'B.Tech Information Technology',
    'B.Tech Electronics',
    'B.Tech Mechanical',
    'B.Tech Civil',
    'BCA',
    'MCA',
    'MBA'
  ];

  // Handle edit mode toggle with server permission check
  const handleToggleEditMode = async () => {
    if (!isTeacher) return;

    // If turning off, just disable
    if (editModeEnabled) {
      setEditModeEnabled(false);
      Alert.alert('Edit Mode', 'Edit mode disabled', [{ text: 'OK' }]);
      return;
    }

    // If turning on, check server permission first by fetching teacher data
    setCheckingPermission(true);
    try {
      console.log('=== Permission Check Debug ===');
      console.log('loginId prop:', loginId);
      console.log('userData:', JSON.stringify(userData));
      console.log('userData.employeeId:', userData?.employeeId);
      console.log('userData._id:', userData?._id);
      console.log('userData.email:', userData?.email);
      console.log('userData.name:', userData?.name);
      
      // Use loginId prop if available, otherwise try userData
      const teacherIdentifier = loginId || userData?.employeeId || userData?._id || userData?.email || userData?.name;
      
      console.log('Final teacher identifier:', teacherIdentifier);
      
      if (!teacherIdentifier) {
        Alert.alert(
          'Debug Info',
          `loginId: ${loginId}\nuserData: ${JSON.stringify(userData)}\n\nNo identification found!`,
          [{ text: 'OK' }]
        );
        throw new Error('No teacher identification available');
      }
      
      // Fetch latest teacher data from server
      const response = await fetch(`${socketUrl}/api/teachers`);
      const data = await response.json();
      
      console.log('Fetched', data.teachers?.length, 'teachers from server');
      
      if (data.success && data.teachers) {
        // Find this teacher in the list
        const teacher = data.teachers.find(t => 
          t.employeeId === teacherIdentifier ||
          t._id === teacherIdentifier ||
          t._id?.toString() === teacherIdentifier?.toString() ||
          t.email === teacherIdentifier ||
          t.name === teacherIdentifier
        );
        
        console.log('Found teacher:', teacher?.name, '| canEditTimetable:', teacher?.canEditTimetable);
        
        if (teacher && teacher.canEditTimetable === true) {
          setEditModeEnabled(true);
          Alert.alert('Edit Mode', 'Edit mode enabled ✅\nYou can now edit the timetable', [{ text: 'OK' }]);
        } else if (teacher) {
          setEditModeEnabled(false);
          Alert.alert(
            'Permission Denied',
            'You do not have permission to edit the timetable.\n\nPlease contact your administrator.',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('Teacher not found: ' + teacherIdentifier);
        }
      } else {
        throw new Error('Failed to fetch teacher data from server');
      }
    } catch (error) {
      console.error('Error checking permission:', error.message);
      setEditModeEnabled(false);
      Alert.alert('Error', 'Failed to check permissions: ' + error.message, [{ text: 'OK' }]);
    } finally {
      setCheckingPermission(false);
    }
  };

  // Server data states - no hardcoded fallbacks
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Loading states for dropdowns
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Fetch subjects from server
  const fetchSubjects = async () => {
    if (!selectedSemester || !selectedBranch) return;
    
    setLoadingSubjects(true);
    try {
      const response = await fetch(`${socketUrl}/api/subjects?semester=${selectedSemester}&branch=${encodeURIComponent(selectedBranch)}`);
      const data = await response.json();
      
      if (data.success && data.subjects) {
        // Extract subject names from server data
        const subjectNames = data.subjects.map(subject => subject.subjectName || subject.name);
        setSubjects(subjectNames);
        console.log('✅ Loaded subjects from server:', subjectNames.length);
      } else {
        console.warn('⚠️ No subjects found for', selectedSemester, selectedBranch);
        setSubjects([]);
      }
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
      setSubjects([]);
    }
    setLoadingSubjects(false);
  };

  // Fetch rooms from server
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch(`${socketUrl}/api/classrooms`);
      const data = await response.json();
      
      if (data.success && data.classrooms) {
        // Extract room numbers/names from server data
        const roomNames = data.classrooms.map(room => room.roomNumber || room.name || room.room);
        setRooms(roomNames);
        console.log('✅ Loaded rooms from server:', roomNames.length);
      } else {
        console.warn('⚠️ No rooms found on server');
        setRooms([]);
      }
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      setRooms([]);
    }
    setLoadingRooms(false);
  };

  // Fetch teachers from server
  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const response = await fetch(`${socketUrl}/api/teachers`);
      const data = await response.json();
      
      if (data.success && data.teachers) {
        // Extract teacher names from server data
        const teacherNames = data.teachers.map(teacher => teacher.name);
        setTeachers(teacherNames);
        console.log('✅ Loaded teachers from server:', teacherNames.length);
      } else {
        console.warn('⚠️ No teachers found on server');
        setTeachers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching teachers:', error);
      setTeachers([]);
    }
    setLoadingTeachers(false);
  };

  // Get days dynamically from timetable in proper week order (recalculates when timetable changes)
  const DAYS = useMemo(() => {
    if (!timetable?.timetable) {
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const days = Object.keys(timetable.timetable)
      .sort((a, b) => dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase()))
      .map(day => day.charAt(0).toUpperCase() + day.slice(1));
    console.log('📅 DAYS recalculated:', days);
    return days;
  }, [timetable]);

  // Fetch dropdown data when component mounts or dependencies change
  useEffect(() => {
    fetchSubjects();
  }, [selectedSemester, selectedBranch, socketUrl]);

  useEffect(() => {
    fetchRooms();
    fetchTeachers();
  }, [socketUrl]);

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
  }, [selectedSemester, selectedBranch]);

  // Update current day when timetable loads
  useEffect(() => {
    if (timetable) {
      setCurrentDay(getCurrentDayIndex());
    }
  }, [timetable]);

  const fetchTimetable = async (isRefreshing = false) => {
    if (!selectedSemester || !selectedBranch) {
      console.log('No semester or branch selected');
      if (!isRefreshing) setLoading(false);
      return;
    }

    if (!socketUrl) {
      console.log('No socket URL provided');
      if (!isRefreshing) setLoading(false);
      return;
    }

    console.log('Fetching timetable for:', selectedSemester, selectedBranch);
    if (!isRefreshing) setLoading(true);
    try {
      const url = `${socketUrl}/api/timetable/${selectedSemester}/${selectedBranch}?t=${Date.now()}`;
      console.log('Fetching from:', url);

      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();

      console.log('Timetable data received:', data);
      console.log('Raw timetable object keys:', data.timetable ? Object.keys(data.timetable) : 'null');
      console.log('Raw timetable.timetable keys:', data.timetable?.timetable ? Object.keys(data.timetable.timetable) : 'null');

      if (data.success && data.timetable) {
        // Log all days to verify data structure
        const tt = data.timetable.timetable;
        if (tt) {
          const allDays = Object.keys(tt);
          console.log('📅 Days in timetable:', allDays);
          console.log('📅 Has Sunday:', allDays.includes('sunday') ? 'YES ✅' : 'NO ❌');
          allDays.forEach(day => {
            console.log(`  ${day}:`, tt[day]?.[0]?.subject || 'empty');
          });
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
      if (!isRefreshing) setLoading(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimetable(true);
    setRefreshing(false);
  };

  const saveTimetable = async () => {
    if (!editModeEnabled || !timetable) return;

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
    if (!editModeEnabled) return;

    const dayKey = DAYS[dayIndex].toLowerCase();
    const period = timetable.timetable[dayKey].find(p => p.period === periodNumber);

    if (period) {
      setEditingCell({ dayIndex, periodNumber });
      setEditSubject(period.subject || '');
      setEditRoom(period.room || '');
      setEditTeacher(period.teacher || '');
    }
  };

  const handleMarkAsBreak = () => {
    if (!editingCell) return;

    const { dayIndex, periodNumber } = editingCell;
    const dayKey = DAYS[dayIndex].toLowerCase();

    const updatedTimetable = { ...timetable };
    const periodIndex = updatedTimetable.timetable[dayKey].findIndex(p => p.period === periodNumber);

    if (periodIndex !== -1) {
      updatedTimetable.timetable[dayKey][periodIndex] = {
        ...updatedTimetable.timetable[dayKey][periodIndex],
        subject: 'Break',
        room: '',
        teacher: '',
        isBreak: true
      };
      setTimetable(updatedTimetable);
    }

    setEditingCell(null);
    setEditSubject('');
    setEditRoom('');
    setEditTeacher('');
  };

  const handleClearPeriod = () => {
    if (!editingCell) return;

    const { dayIndex, periodNumber } = editingCell;
    const dayKey = DAYS[dayIndex].toLowerCase();

    const updatedTimetable = { ...timetable };
    const periodIndex = updatedTimetable.timetable[dayKey].findIndex(p => p.period === periodNumber);

    if (periodIndex !== -1) {
      updatedTimetable.timetable[dayKey][periodIndex] = {
        ...updatedTimetable.timetable[dayKey][periodIndex],
        subject: '',
        room: '',
        teacher: '',
        isBreak: false
      };
      setTimetable(updatedTimetable);
    }

    setEditingCell(null);
    setEditSubject('');
    setEditRoom('');
    setEditTeacher('');
  };

  const handleCopyPeriod = () => {
    if (!editingCell) return;

    const { dayIndex, periodNumber } = editingCell;
    const dayKey = DAYS[dayIndex].toLowerCase();
    const period = timetable.timetable[dayKey].find(p => p.period === periodNumber);

    if (period) {
      setCopiedPeriod({
        subject: period.subject || '',
        room: period.room || '',
        teacher: period.teacher || '',
        isBreak: period.isBreak || false
      });
      alert('Period copied! Tap another period and use "Paste" to apply.');
    }
  };

  const handlePastePeriod = () => {
    if (!editingCell || !copiedPeriod) return;

    const { dayIndex, periodNumber } = editingCell;
    const dayKey = DAYS[dayIndex].toLowerCase();

    const updatedTimetable = { ...timetable };
    const periodIndex = updatedTimetable.timetable[dayKey].findIndex(p => p.period === periodNumber);

    if (periodIndex !== -1) {
      updatedTimetable.timetable[dayKey][periodIndex] = {
        ...updatedTimetable.timetable[dayKey][periodIndex],
        ...copiedPeriod
      };
      setTimetable(updatedTimetable);
      alert('Period pasted successfully!');
    }

    setEditingCell(null);
    setEditSubject('');
    setEditRoom('');
    setEditTeacher('');
  };

  const handleSaveCell = () => {
    if (!editingCell) return;

    const { dayIndex, periodNumber } = editingCell;
    const dayKey = DAYS[dayIndex].toLowerCase();

    const updatedTimetable = { ...timetable };
    const periodIndex = updatedTimetable.timetable[dayKey].findIndex(p => p.period === periodNumber);

    if (periodIndex !== -1) {
      // If subject is "Break", mark as break, otherwise it's a regular period
      const isBreakPeriod = editSubject.toLowerCase() === 'break';
      
      updatedTimetable.timetable[dayKey][periodIndex] = {
        ...updatedTimetable.timetable[dayKey][periodIndex],
        subject: editSubject,
        room: isBreakPeriod ? '' : editRoom,
        teacher: isBreakPeriod ? '' : editTeacher,
        isBreak: isBreakPeriod
      };
      setTimetable(updatedTimetable);
    }

    setEditingCell(null);
    setEditSubject('');
    setEditRoom('');
    setEditTeacher('');
    setShowSubjectDropdown(false);
    setShowRoomDropdown(false);
    setShowTeacherDropdown(false);
  };

  // Get periods from timetable data or use defaults
  const getPeriods = () => {
    if (timetable && timetable.periods && timetable.periods.length > 0) {
      console.log('✅ Using timetable periods:', timetable.periods.length);
      return timetable.periods.map(p => ({
        number: p.number,
        time: `${p.startTime} - ${p.endTime}`
      }));
    }
    // Fallback periods
    console.log('⚠️ Using fallback periods (timetable not loaded yet)');
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
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
          title="Pull to refresh timetable..."
          titleColor={theme.textSecondary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BookIcon size={28} color={theme.primary} />
          <Text style={[styles.title, { color: theme.primary }]}>Timetable</Text>
          
          {/* Save Button (only when edit mode enabled) */}
          {editModeEnabled && (
            <TouchableOpacity
              onPress={saveTimetable}
              disabled={saving}
              style={{
                backgroundColor: '#10b981',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                marginLeft: 'auto',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {saving ? 'Saving...' : '💾 Save'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Three-dot Menu Button */}
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={{
              backgroundColor: theme.cardBackground,
              borderWidth: 1,
              borderColor: theme.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              marginLeft: editModeEnabled ? 0 : 'auto',
            }}
          >
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>⋮</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {selectedSemester && selectedBranch ? `Semester ${selectedSemester} • ${selectedBranch}` : 'Your class schedule'}
          </Text>
          {editModeEnabled && (
            <View style={{
              backgroundColor: theme.primary + '20',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: theme.primary,
            }}>
              <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '600' }}>
                ✏️ EDITING
              </Text>
            </View>
          )}
        </View>
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

          {/* Semester and Branch Selectors (Teachers Only) */}
          {isTeacher && (
            <View style={[styles.selectorCard, {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              marginBottom: 16
            }]}>
              <Text style={[styles.selectorTitle, { color: theme.text }]}>
                📚 Select Class Timetable
              </Text>
              
              <View style={styles.selectorRow}>
                {/* Semester Selector */}
                <View style={styles.selectorContainer}>
                  <Text style={[styles.selectorLabel, { color: theme.textSecondary }]}>Semester</Text>
                  <TouchableOpacity
                    onPress={() => setShowSemesterDropdown(!showSemesterDropdown)}
                    style={[styles.selectorButton, {
                      backgroundColor: theme.background,
                      borderColor: theme.border
                    }]}
                  >
                    <Text style={[styles.selectorText, { color: theme.text }]}>
                      Sem {selectedSemester}
                    </Text>
                    <Text style={[styles.selectorArrow, { color: theme.textSecondary }]}>▼</Text>
                  </TouchableOpacity>
                  

                </View>

                {/* Branch Selector */}
                <View style={styles.selectorContainer}>
                  <Text style={[styles.selectorLabel, { color: theme.textSecondary }]}>Branch</Text>
                  <TouchableOpacity
                    onPress={() => setShowBranchDropdown(!showBranchDropdown)}
                    style={[styles.selectorButton, {
                      backgroundColor: theme.background,
                      borderColor: theme.border
                    }]}
                  >
                    <Text style={[styles.selectorText, { color: theme.text }]} numberOfLines={1}>
                      {selectedBranch.replace('B.Tech ', '').replace('B.Tech', 'BTech')}
                    </Text>
                    <Text style={[styles.selectorArrow, { color: theme.textSecondary }]}>▼</Text>
                  </TouchableOpacity>
                  

                </View>
              </View>
            </View>
          )}

          {/* Today's Schedule */}
          <View style={[styles.scheduleCard, {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border
          }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.scheduleTitle, { color: theme.text }]}>
                {DAYS[currentDay] || 'Monday'}'s Schedule
              </Text>
              <View style={{ padding: 8 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Pull down to refresh</Text>
              </View>
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
                  onPress={() => editModeEnabled && handleCellPress(currentDay, period.number)}
                  disabled={!editModeEnabled}
                  activeOpacity={editModeEnabled ? 0.7 : 1}
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

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.primary]}
                  tintColor={theme.primary}
                />
              }
            >
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
                        <TouchableOpacity
                          key={day}
                          onPress={() => editModeEnabled && handleCellPress(dayIndex, period.number)}
                          disabled={!editModeEnabled}
                          activeOpacity={editModeEnabled ? 0.7 : 1}
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
                        </TouchableOpacity>
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

      {/* Semester Dropdown Modal */}
      <Modal
        visible={showSemesterDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSemesterDropdown(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setShowSemesterDropdown(false)}
        >
          <View style={{
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            minWidth: 200,
            maxHeight: 300,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.text,
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              Select Semester
            </Text>
            <ScrollView>
              {semesterOptions.map((sem) => (
                <TouchableOpacity
                  key={sem}
                  onPress={() => {
                    setSelectedSemester(sem);
                    setShowSemesterDropdown(false);
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border + '30',
                    backgroundColor: selectedSemester === sem ? theme.primary + '20' : 'transparent'
                  }}
                >
                  <Text style={{ 
                    fontSize: 14,
                    color: selectedSemester === sem ? theme.primary : theme.text,
                    fontWeight: selectedSemester === sem ? '600' : '400'
                  }}>
                    Semester {sem}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Branch Dropdown Modal */}
      <Modal
        visible={showBranchDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBranchDropdown(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setShowBranchDropdown(false)}
        >
          <View style={{
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            minWidth: 280,
            maxHeight: 400,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.text,
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              Select Branch
            </Text>
            <ScrollView>
              {branchOptions.map((branch) => (
                <TouchableOpacity
                  key={branch}
                  onPress={() => {
                    setSelectedBranch(branch);
                    setShowBranchDropdown(false);
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border + '30',
                    backgroundColor: selectedBranch === branch ? theme.primary + '20' : 'transparent'
                  }}
                >
                  <Text style={{ 
                    fontSize: 14,
                    color: selectedBranch === branch ? theme.primary : theme.text,
                    fontWeight: selectedBranch === branch ? '600' : '400'
                  }}>
                    {branch}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editingCell !== null && editModeEnabled}
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

            {/* Subject Dropdown */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
              Subject Name
            </Text>
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
                style={{
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, color: editSubject ? theme.text : theme.textSecondary }}>
                  {editSubject || 'Select or type subject'}
                </Text>
                <Text style={{ fontSize: 16, color: theme.textSecondary }}>▼</Text>
              </TouchableOpacity>
              
              {showSubjectDropdown && (
                <ScrollView style={{
                  maxHeight: 150,
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  marginTop: 4,
                }}>
                  {loadingSubjects ? (
                    <View style={{ padding: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: theme.textSecondary }}>Loading subjects...</Text>
                    </View>
                  ) : subjects.length === 0 ? (
                    <View style={{ padding: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: theme.textSecondary }}>No subjects found</Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                        {semester && branch ? `for ${branch} Sem ${semester}` : 'Select semester & branch first'}
                      </Text>
                    </View>
                  ) : (
                    subjects.map((subject, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setEditSubject(subject);
                          setShowSubjectDropdown(false);
                        }}
                        style={{
                          padding: 12,
                          borderBottomWidth: index < subjects.length - 1 ? 1 : 0,
                          borderBottomColor: theme.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, color: theme.text }}>{subject}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}
              
              <TextInput
                style={{
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: theme.text,
                  marginTop: 8,
                }}
                value={editSubject}
                onChangeText={setEditSubject}
                placeholder="Or type custom subject"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Room Dropdown */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
              Room Number
            </Text>
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setShowRoomDropdown(!showRoomDropdown)}
                style={{
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, color: editRoom ? theme.text : theme.textSecondary }}>
                  {editRoom || 'Select or type room'}
                </Text>
                <Text style={{ fontSize: 16, color: theme.textSecondary }}>▼</Text>
              </TouchableOpacity>
              
              {showRoomDropdown && (
                <ScrollView style={{
                  maxHeight: 150,
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  marginTop: 4,
                }}>
                  {loadingRooms ? (
                    <View style={{ padding: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: theme.textSecondary }}>Loading rooms...</Text>
                    </View>
                  ) : rooms.length === 0 ? (
                    <View style={{ padding: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: theme.textSecondary }}>No rooms found</Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                        Check server configuration
                      </Text>
                    </View>
                  ) : (
                    rooms.map((room, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setEditRoom(room);
                          setShowRoomDropdown(false);
                        }}
                        style={{
                          padding: 12,
                          borderBottomWidth: index < rooms.length - 1 ? 1 : 0,
                          borderBottomColor: theme.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, color: theme.text }}>{room}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}
              
              <TextInput
                style={{
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: theme.text,
                  marginTop: 8,
                }}
                value={editRoom}
                onChangeText={setEditRoom}
                placeholder="Or type custom room"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Teacher Dropdown */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
              Teacher (Optional)
            </Text>
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setShowTeacherDropdown(!showTeacherDropdown)}
                style={{
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, color: editTeacher ? theme.text : theme.textSecondary }}>
                  {editTeacher || 'Select teacher'}
                </Text>
                <Text style={{ fontSize: 16, color: theme.textSecondary }}>▼</Text>
              </TouchableOpacity>
              
              {showTeacherDropdown && (
                <ScrollView style={{
                  maxHeight: 150,
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  marginTop: 4,
                }}>
                  {loadingTeachers ? (
                    <View style={{ padding: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: theme.textSecondary }}>Loading teachers...</Text>
                    </View>
                  ) : teachers.length === 0 ? (
                    <View style={{ padding: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: theme.textSecondary }}>No teachers found</Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                        Check server configuration
                      </Text>
                    </View>
                  ) : (
                    teachers.map((teacher, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setEditTeacher(teacher);
                          setShowTeacherDropdown(false);
                        }}
                        style={{
                          padding: 12,
                          borderBottomWidth: index < teachers.length - 1 ? 1 : 0,
                          borderBottomColor: theme.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, color: theme.text }}>{teacher}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}
            </View>

            {/* Refresh Data Button */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  fetchSubjects();
                  fetchRooms();
                  fetchTeachers();
                }}
                style={{
                  flex: 1,
                  backgroundColor: theme.primary + '20',
                  borderWidth: 1,
                  borderColor: theme.primary,
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>
                  🔄 Refresh Data
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions Row 1 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={handleMarkAsBreak}
                style={{
                  flex: 1,
                  backgroundColor: '#fbbf2420',
                  borderWidth: 1,
                  borderColor: '#fbbf24',
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fbbf24', fontWeight: '600', fontSize: 13 }}>
                  ☕ Break
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClearPeriod}
                style={{
                  flex: 1,
                  backgroundColor: '#ef444420',
                  borderWidth: 1,
                  borderColor: '#ef4444',
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 13 }}>
                  🗑️ Clear
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCopyPeriod}
                style={{
                  flex: 1,
                  backgroundColor: theme.primary + '20',
                  borderWidth: 1,
                  borderColor: theme.primary,
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>
                  📋 Copy
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions Row 2 */}
            {copiedPeriod && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={handlePastePeriod}
                  style={{
                    flex: 1,
                    backgroundColor: '#10b98120',
                    borderWidth: 1,
                    borderColor: '#10b981',
                    padding: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#10b981', fontWeight: '600', fontSize: 13 }}>
                    📌 Paste: {copiedPeriod.subject || 'Empty'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!copiedPeriod && <View style={{ marginBottom: 16 }} />}

            {/* Main Actions */}
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
                  💾 Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Three-dot Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 16,
              padding: 8,
              width: 280,
              borderWidth: 2,
              borderColor: theme.border,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.text,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              Settings & Tools
            </Text>

            {/* Edit Mode Toggle (for teachers) */}
            {isTeacher && (
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  handleToggleEditMode();
                }}
                disabled={checkingPermission}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>
                  {checkingPermission ? '⏳' : editModeEnabled ? '✏️' : '🔒'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                    {checkingPermission ? 'Checking Permission...' : editModeEnabled ? 'Disable Edit Mode' : 'Enable Edit Mode'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                    {editModeEnabled ? 'Turn off timetable editing' : 'Edit timetable periods'}
                  </Text>
                </View>
                {editModeEnabled && (
                  <View style={{
                    backgroundColor: theme.primary + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}>
                    <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '600' }}>ON</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Refresh Timetable */}
            <TouchableOpacity
              onPress={() => {
                setShowMenu(false);
                fetchTimetable();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 12 }}>🔄</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                  Refresh Timetable
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  Reload latest schedule
                </Text>
              </View>
            </TouchableOpacity>

            {/* Logout */}
            {onLogout && (
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert(
                    'Logout',
                    'Are you sure you want to logout?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Logout', style: 'destructive', onPress: onLogout }
                    ]
                  );
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>🚪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#ef4444' }}>
                    Logout
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                    Sign out of your account
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowMenu(false)}
              style={{
                marginTop: 8,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '600' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  // Selector styles
  selectorCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorContainer: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  selectorArrow: {
    fontSize: 12,
    marginLeft: 8,
  },

});
