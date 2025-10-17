import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator,
  Animated, TextInput, ScrollView, FlatList, AppState
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

const API_URL = 'http://192.168.107.31:3000/api/config';
const SOCKET_URL = 'http://192.168.107.31:3000';
const CACHE_KEY = '@timer_config';
const ROLE_KEY = '@user_role';
const STUDENT_ID_KEY = '@student_id';
const STUDENT_NAME_KEY = '@student_name';
const SEMESTER_KEY = '@user_semester';
const BRANCH_KEY = '@user_branch';
const USER_DATA_KEY = '@user_data';
const LOGIN_ID_KEY = '@login_id';

const getDefaultConfig = () => ({
  roleSelection: {
    backgroundColor: '#0a1628',
    title: { text: 'Who are you?', fontSize: 36, color: '#00f5ff', fontWeight: 'bold' },
    subtitle: { text: 'Select your role to continue', fontSize: 16, color: '#00d9ff' },
    roles: [
      { id: 'student', text: 'Student', icon: '🎓', backgroundColor: '#00d9ff', textColor: '#0a1628' },
      { id: 'teacher', text: 'Teacher', icon: '👨‍🏫', backgroundColor: '#00bfff', textColor: '#0a1628' }
    ]
  },
  studentNameInput: {
    backgroundColor: '#0a1628',
    title: { text: 'Enter Your Name', fontSize: 32, color: '#00f5ff', fontWeight: 'bold' },
    subtitle: { text: 'This will be visible to your teacher', fontSize: 14, color: '#00d9ff' },
    placeholder: 'Your Name',
    buttonText: 'START SESSION',
    inputBackgroundColor: '#0d1f3c',
    inputTextColor: '#00f5ff',
    inputBorderColor: '#00d9ff'
  },
  studentScreen: {
    backgroundColor: '#0a1628',
    title: { text: 'Countdown Timer', fontSize: 32, color: '#00f5ff', fontWeight: 'bold' },
    timer: { duration: 120, backgroundColor: '#0d1f3c', textColor: '#00f5ff', fontSize: 72, borderRadius: 20 },
    buttons: [
      { id: 'startPause', text: 'START', pauseText: 'PAUSE', backgroundColor: '#00f5ff', textColor: '#0a1628', fontSize: 18 },
      { id: 'reset', text: 'RESET', backgroundColor: '#00d9ff', textColor: '#0a1628', fontSize: 18 }
    ]
  },
  teacherScreen: {
    backgroundColor: '#0a1628',
    title: { text: 'Live Attendance', fontSize: 32, color: '#00f5ff', fontWeight: 'bold' },
    subtitle: { text: 'Real-time student tracking', fontSize: 16, color: '#00d9ff' },
    statusColors: { attending: '#00ff88', absent: '#ff4444', present: '#00d9ff' },
    cardBackgroundColor: '#0d1f3c',
    cardBorderColor: '#00d9ff'
  }
});

export default function App() {
  const [config, setConfig] = useState(getDefaultConfig());
  const [selectedRole, setSelectedRole] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [students, setStudents] = useState([]);
  const [showTimetable, setShowTimetable] = useState(false);
  const [semester, setSemester] = useState('1');
  const [branch, setBranch] = useState('CSE');
  const [timetable, setTimetable] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editRoom, setEditRoom] = useState('');

  // Student detail modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Login states
  const [showLogin, setShowLogin] = useState(true);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const intervalRef = useRef(null);
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(null);

  // Animations
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    loadConfig();
    setupSocket();

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        if (backgroundTimeRef.current && isRunning && selectedRole === 'student') {
          const timeInBackground = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
          setTimeLeft(prev => {
            const newTime = Math.max(0, prev - timeInBackground);
            updateTimerOnServer(newTime, newTime > 0, newTime === 0 ? 'present' : null);
            return newTime;
          });
        }
        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        if (isRunning && selectedRole === 'student') {
          backgroundTimeRef.current = Date.now();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      subscription.remove();
    };
  }, [isRunning, selectedRole]);

  const setupSocket = () => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('student_update', (data) => {
      setStudents(prev => prev.map(s =>
        s._id === data.studentId ? { ...s, ...data } : s
      ));
    });

    socketRef.current.on('student_registered', () => {
      fetchStudents();
    });
  };

  const loadConfig = async () => {
    try {
      // Check for saved login data
      const cachedUserData = await AsyncStorage.getItem(USER_DATA_KEY);
      const cachedLoginId = await AsyncStorage.getItem(LOGIN_ID_KEY);

      if (cachedUserData && cachedLoginId) {
        const userData = JSON.parse(cachedUserData);
        setUserData(userData);
        setLoginId(cachedLoginId);
        setSelectedRole(userData.role);
        setShowLogin(false);

        if (userData.role === 'student') {
          setStudentName(userData.name);
          setStudentId(userData._id);
          setSemester(userData.semester);
          setBranch(userData.course);
        } else if (userData.role === 'teacher') {
          setSemester(userData.semester || '1');
          setBranch(userData.department);
          fetchStudents();
        }
      }

      const cachedConfig = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedConfig) {
        setConfig(JSON.parse(cachedConfig));
      }

      fetchConfig();
    } catch (error) {
      console.log('Error loading cache:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setConfig(data);
      if (selectedRole === 'student' && data.studentScreen) {
        setTimeLeft(data.studentScreen.timer.duration);
      }
    } catch (error) {
      console.log('Using cached config');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/students`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.log('Error fetching students:', error);
    }
  };

  const fetchStudentDetails = async (student) => {
    setSelectedStudent(student);
    setLoadingDetails(true);
    
    try {
      // Fetch student management details
      const detailsResponse = await fetch(`${SOCKET_URL}/api/student-management?enrollmentNo=${student.enrollmentNumber || student._id}`);
      const detailsData = await detailsResponse.json();
      
      // Fetch attendance records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recordsResponse = await fetch(`${SOCKET_URL}/api/attendance/records?studentId=${student._id}&startDate=${thirtyDaysAgo.toISOString()}`);
      const recordsData = await recordsResponse.json();
      
      // Fetch attendance statistics
      const statsResponse = await fetch(`${SOCKET_URL}/api/attendance/stats?studentId=${student._id}`);
      const statsData = await statsResponse.json();
      
      if (detailsData.success) {
        setStudentDetails(detailsData.student);
      }
      if (recordsData.success) {
        setAttendanceRecords(recordsData.records);
      }
      if (statsData.success) {
        setAttendanceStats(statsData.stats);
      }
    } catch (error) {
      console.log('Error fetching student details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
    setAttendanceRecords([]);
    setAttendanceStats(null);
  };

  const fetchTimetable = async (sem, br) => {
    try {
      console.log('Fetching timetable for:', sem, br);
      const response = await fetch(`${SOCKET_URL}/api/timetable/${sem}/${br}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Timetable data:', data);
      if (data.success) {
        setTimetable(data.timetable);
        console.log('Timetable set successfully');
      }
    } catch (error) {
      console.log('Error fetching timetable:', error);
    }
  };

  const saveTimetable = async (updatedTimetable) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTimetable)
      });
      const data = await response.json();
      if (data.success) {
        setTimetable(data.timetable);
        alert('Timetable saved successfully!');
      }
    } catch (error) {
      console.log('Error saving timetable:', error);
      alert('Failed to save timetable');
    }
  };

  const handleRoleSelect = async (role) => {
    try {
      await AsyncStorage.setItem(ROLE_KEY, role);
      setSelectedRole(role);
      if (role === 'student') {
        setShowNameInput(true);
      } else if (role === 'teacher') {
        fetchStudents();
      }
    } catch (error) {
      console.log('Error saving role:', error);
    }
  };

  const handleNameSubmit = async () => {
    if (!studentName.trim()) return;

    try {
      const response = await fetch(`${SOCKET_URL}/api/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName.trim() })
      });

      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem(STUDENT_ID_KEY, data.studentId);
        await AsyncStorage.setItem(STUDENT_NAME_KEY, studentName.trim());
        setStudentId(data.studentId);
        setShowNameInput(false);
      } else {
        // Fallback: use offline mode
        const offlineId = 'offline_' + Date.now();
        await AsyncStorage.setItem(STUDENT_ID_KEY, offlineId);
        await AsyncStorage.setItem(STUDENT_NAME_KEY, studentName.trim());
        setStudentId(offlineId);
        setShowNameInput(false);
      }
    } catch (error) {
      console.log('Error registering student, using offline mode:', error);
      // Fallback: use offline mode
      const offlineId = 'offline_' + Date.now();
      await AsyncStorage.setItem(STUDENT_ID_KEY, offlineId);
      await AsyncStorage.setItem(STUDENT_NAME_KEY, studentName.trim());
      setStudentId(offlineId);
      setShowNameInput(false);
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          updateTimerOnServer(newTime, true);
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      updateTimerOnServer(0, false, 'present');
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  const updateTimerOnServer = async (timer, running, status = null) => {
    if (!studentId || !socketRef.current) return;

    let finalStatus = status;
    if (!finalStatus) {
      if (running) finalStatus = 'attending';
      else if (timer === 0) finalStatus = 'present';
      else finalStatus = 'absent';
    }

    socketRef.current.emit('timer_update', {
      studentId,
      studentName: studentName,
      timerValue: timer,
      isRunning: running,
      status: finalStatus
    });

    // Save attendance record when timer completes or student marks present/absent
    if (finalStatus === 'present' || finalStatus === 'absent') {
      try {
        await fetch(`${SOCKET_URL}/api/attendance/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            studentName,
            enrollmentNumber: userData?.enrollmentNo || 'N/A',
            status: finalStatus,
            timerValue: timer,
            semester,
            branch
          })
        });
      } catch (error) {
        console.log('Error saving attendance record:', error);
      }
    }
  };

  const handleStartPause = () => {
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    updateTimerOnServer(timeLeft, newRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = config?.studentScreen?.timer?.duration || 120;
    setTimeLeft(duration);
    clearInterval(intervalRef.current);
    updateTimerOnServer(duration, false, 'absent');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Login function
  const handleLogin = async () => {
    if (!loginId.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both ID and password');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch(`${SOCKET_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: loginId.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setUserData(data.user);
        setSelectedRole(data.user.role);
        setShowLogin(false);

        // Save login data for persistence
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
        await AsyncStorage.setItem(LOGIN_ID_KEY, loginId.trim());
        await AsyncStorage.setItem(ROLE_KEY, data.user.role);

        if (data.user.role === 'student') {
          setStudentName(data.user.name);
          setStudentId(data.user._id);
          setSemester(data.user.semester);
          setBranch(data.user.course);
          await AsyncStorage.setItem(STUDENT_NAME_KEY, data.user.name);
          await AsyncStorage.setItem(STUDENT_ID_KEY, data.user._id);
        } else if (data.user.role === 'teacher') {
          setSemester(data.user.semester || '1');
          setBranch(data.user.department);
          fetchStudents();
        }
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setLoginError('Connection error. Please check server.');
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Login Screen
  if (showLogin) {
    return (
      <Animated.View style={[styles.container, { backgroundColor: '#0a1628', opacity: fadeAnim }]}>
        <StatusBar style="light" />
        <View style={styles.loginContainer}>
          <Text style={[styles.glowText, { fontSize: 36, marginBottom: 10 }]}>
            🎓 College App
          </Text>
          <Text style={{ color: '#00d9ff', fontSize: 16, marginBottom: 40 }}>
            Login to continue
          </Text>

          <View style={styles.loginForm}>
            <Text style={styles.loginLabel}>Enrollment / Employee ID</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="Enter your ID"
              placeholderTextColor="#00d9ff80"
              value={loginId}
              onChangeText={(text) => {
                setLoginId(text);
                setLoginError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.loginLabel, { marginTop: 20 }]}>Password</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="Enter your password"
              placeholderTextColor="#00d9ff80"
              value={loginPassword}
              onChangeText={(text) => {
                setLoginPassword(text);
                setLoginError('');
              }}
              secureTextEntry
              autoCapitalize="none"
            />

            {loginError ? (
              <Text style={styles.loginError}>{loginError}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoggingIn}
              style={styles.loginButton}
            >
              <Animated.View style={[styles.loginButtonInner, {
                shadowColor: '#00f5ff',
                shadowOpacity: glowOpacity,
                shadowRadius: 20,
              }]}>
                <Text style={styles.loginButtonText}>
                  {isLoggingIn ? 'LOGGING IN...' : 'LOGIN'}
                </Text>
              </Animated.View>
            </TouchableOpacity>

            <Text style={styles.loginHint}>
              Use your enrollment number (students) or employee ID (teachers)
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Role Selection Screen (kept for fallback)
  if (!selectedRole) {
    const roleConfig = config?.roleSelection || getDefaultConfig().roleSelection;
    return (
      <Animated.View style={[styles.container, { backgroundColor: roleConfig?.backgroundColor || '#0a1628', opacity: fadeAnim }]}>
        <StatusBar style="light" />
        <Text style={[styles.glowText, {
          fontSize: roleConfig?.title?.fontSize || 36,
          color: roleConfig?.title?.color || '#00f5ff',
        }]}>
          {roleConfig?.title?.text || 'Who are you?'}
        </Text>
        <Text style={{
          fontSize: roleConfig?.subtitle?.fontSize || 16,
          color: roleConfig?.subtitle?.color || '#00d9ff',
          marginBottom: 60,
        }}>
          {roleConfig?.subtitle?.text || 'Select your role to continue'}
        </Text>

        <View style={styles.roleContainer}>
          {(roleConfig?.roles || []).map((role) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => handleRoleSelect(role.id)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.roleButton,
                  {
                    backgroundColor: role?.backgroundColor || '#00d9ff',
                    shadowColor: '#00f5ff',
                    shadowOpacity: glowOpacity,
                    shadowRadius: 20,
                    elevation: 15,
                  }
                ]}
              >
                <Text style={styles.roleIcon}>{role?.icon || '👤'}</Text>
                <Text style={[styles.roleText, { color: role?.textColor || '#0a1628' }]}>
                  {role?.text || 'Role'}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  }

  // Student Name Input Screen
  if (selectedRole === 'student' && showNameInput) {
    const nameConfig = config?.studentNameInput || getDefaultConfig().studentNameInput;
    return (
      <Animated.View style={[styles.container, { backgroundColor: nameConfig?.backgroundColor || '#0a1628', opacity: fadeAnim }]}>
        <StatusBar style="light" />
        <Text style={[styles.glowText, {
          fontSize: nameConfig?.title?.fontSize || 32,
          color: nameConfig?.title?.color || '#00f5ff',
        }]}>
          {nameConfig?.title?.text || 'Enter Your Name'}
        </Text>
        <Text style={{
          fontSize: nameConfig?.subtitle?.fontSize || 14,
          color: nameConfig?.subtitle?.color || '#00d9ff',
          marginBottom: 40,
        }}>
          {nameConfig?.subtitle?.text || 'This will be visible to your teacher'}
        </Text>

        <Animated.View style={[styles.inputContainer, {
          backgroundColor: nameConfig?.inputBackgroundColor || '#0d1f3c',
          borderColor: nameConfig?.inputBorderColor || '#00d9ff',
          shadowColor: '#00f5ff',
          shadowOpacity: glowOpacity,
          shadowRadius: 15,
        }]}>
          <TextInput
            style={[styles.input, { color: nameConfig?.inputTextColor || '#00f5ff' }]}
            placeholder={nameConfig?.placeholder || 'Your Name'}
            placeholderTextColor="#00d9ff80"
            value={studentName}
            onChangeText={setStudentName}
            autoFocus
          />
        </Animated.View>

        <TouchableOpacity onPress={handleNameSubmit} activeOpacity={0.8}>
          <Animated.View style={[styles.submitButton, {
            shadowColor: '#00f5ff',
            shadowOpacity: glowOpacity,
            shadowRadius: 20,
          }]}>
            <Text style={styles.submitButtonText}>{nameConfig?.buttonText || 'START SESSION'}</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Timetable Modal (check FIRST before other screens)
  if (showTimetable && timetable) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysFull = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const isTeacher = selectedRole === 'teacher';

    const handleCellPress = (dayIdx, periodIdx) => {
      if (!isTeacher) return;
      const period = timetable.timetable[daysFull[dayIdx]][periodIdx];
      setEditingCell({ dayIdx, periodIdx });
      setEditSubject(period.subject || '');
      setEditRoom(period.room || '');
    };

    const handleSaveCell = () => {
      if (!editingCell) return;
      const { dayIdx, periodIdx } = editingCell;
      const updatedTimetable = { ...timetable };
      updatedTimetable.timetable[daysFull[dayIdx]][periodIdx] = {
        ...updatedTimetable.timetable[daysFull[dayIdx]][periodIdx],
        subject: editSubject,
        room: editRoom,
        isBreak: false
      };
      setTimetable(updatedTimetable);
      setEditingCell(null);
    };

    const handleToggleBreak = (dayIdx, periodIdx) => {
      if (!isTeacher) return;
      const updatedTimetable = { ...timetable };
      const currentBreak = updatedTimetable.timetable[daysFull[dayIdx]][periodIdx].isBreak;
      updatedTimetable.timetable[daysFull[dayIdx]][periodIdx] = {
        ...updatedTimetable.timetable[daysFull[dayIdx]][periodIdx],
        isBreak: !currentBreak,
        subject: !currentBreak ? '' : updatedTimetable.timetable[daysFull[dayIdx]][periodIdx].subject,
        room: !currentBreak ? '' : updatedTimetable.timetable[daysFull[dayIdx]][periodIdx].room
      };
      setTimetable(updatedTimetable);
    };

    const handleSaveTimetable = () => {
      saveTimetable(timetable);
    };

    return (
      <Animated.View style={[styles.container, { backgroundColor: '#0a1628', opacity: fadeAnim }]}>
        <StatusBar style="light" />
        <View style={styles.timetableHeader}>
          <Text style={[styles.glowText, { fontSize: 24, color: '#00f5ff' }]}>
            📅 Timetable {isTeacher && '(Edit Mode)'}
          </Text>
          <Text style={{ color: '#00d9ff', fontSize: 14, marginTop: 5 }}>
            Sem {timetable.semester} - {timetable.branch}
          </Text>
          <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
            {isTeacher && (
              <TouchableOpacity onPress={handleSaveTimetable}>
                <Text style={{ color: '#00ff88', fontSize: 14, fontWeight: 'bold' }}>💾 Save</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { setShowTimetable(false); setEditingCell(null); }}>
              <Text style={{ color: '#00f5ff', fontSize: 14 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal style={styles.timetableScrollHorizontal}>
          <View style={styles.timetableGrid}>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, styles.cornerCell]}>
                <Text style={styles.cornerText}>Day/Period</Text>
              </View>
              {timetable.periods.map((period, idx) => (
                <View key={idx} style={[styles.gridCell, styles.headerCell]}>
                  <Text style={styles.periodHeaderText}>P{period.number}</Text>
                  <Text style={styles.timeText}>
                    {period.startTime}-{period.endTime}
                  </Text>
                </View>
              ))}
            </View>

            {days.map((day, dayIdx) => (
              <View key={day} style={styles.gridRow}>
                <View style={[styles.gridCell, styles.dayCell]}>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
                {timetable.timetable[daysFull[dayIdx]].map((period, periodIdx) => (
                  <TouchableOpacity
                    key={periodIdx}
                    onPress={() => handleCellPress(dayIdx, periodIdx)}
                    onLongPress={() => isTeacher && handleToggleBreak(dayIdx, periodIdx)}
                    disabled={!isTeacher}
                    activeOpacity={isTeacher ? 0.7 : 1}
                  >
                    <View style={[styles.gridCell, styles.dataCell, period.isBreak && styles.breakCell]}>
                      {period.isBreak ? (
                        <Text style={styles.breakTextSmall}>☕</Text>
                      ) : (
                        <>
                          <Text style={styles.subjectTextSmall} numberOfLines={2}>
                            {period.subject || '-'}
                          </Text>
                          {period.room && (
                            <Text style={styles.roomTextSmall} numberOfLines={1}>
                              {period.room}
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        {editingCell && isTeacher && (
          <View style={styles.editModal}>
            <View style={styles.editModalContent}>
              <Text style={styles.editModalTitle}>Edit Period</Text>
              <Text style={styles.editModalSubtitle}>
                {days[editingCell.dayIdx]} - Period {editingCell.periodIdx + 1}
              </Text>

              <TextInput
                style={styles.editInput}
                placeholder="Subject Name"
                placeholderTextColor="#00d9ff80"
                value={editSubject}
                onChangeText={setEditSubject}
                autoFocus
              />

              <TextInput
                style={styles.editInput}
                placeholder="Room Number"
                placeholderTextColor="#00d9ff80"
                value={editRoom}
                onChangeText={setEditRoom}
              />

              <View style={styles.editModalButtons}>
                <TouchableOpacity onPress={handleSaveCell} style={styles.editModalButton}>
                  <Text style={styles.editModalButtonText}>✓ Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingCell(null)} style={[styles.editModalButton, styles.editModalCancelButton]}>
                  <Text style={styles.editModalButtonText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.editModalHint}>💡 Long press to toggle break</Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  }

  // Logout function
  const handleLogout = async () => {
    setShowLogin(true);
    setSelectedRole(null);
    setUserData(null);
    setLoginId('');
    setLoginPassword('');
    setStudentName('');
    setStudentId(null);
    setIsRunning(false);
    clearInterval(intervalRef.current);

    // Clear all stored data
    await AsyncStorage.removeItem(ROLE_KEY);
    await AsyncStorage.removeItem(STUDENT_NAME_KEY);
    await AsyncStorage.removeItem(STUDENT_ID_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await AsyncStorage.removeItem(LOGIN_ID_KEY);
  };

  // Teacher Dashboard
  if (selectedRole === 'teacher') {
    const teacherConfig = config?.teacherScreen || getDefaultConfig().teacherScreen;
    const canEditTimetable = userData?.canEditTimetable || false;

    // Calculate statistics with safety checks
    const totalStudents = students.length;
    const presentStudents = students.filter(s => s && s.status === 'present').length;
    const attendingStudents = students.filter(s => s && s.status === 'attending').length;
    const absentStudents = students.filter(s => s && s.status === 'absent').length;
    const attendancePercentage = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

    return (
      <Animated.View style={[styles.container, { backgroundColor: teacherConfig?.backgroundColor || '#0a1628', opacity: fadeAnim, paddingTop: 50 }]}>
        <StatusBar style="light" />

        {/* Teacher Info Header */}
        <View style={styles.teacherHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.glowText, {
              fontSize: 28,
              color: teacherConfig?.title?.color || '#00f5ff',
            }]}>
              {teacherConfig?.title?.text || 'Teacher Dashboard'}
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#00d9ff',
              marginTop: 5,
            }}>
              👨‍🏫 {userData?.name || 'Teacher'}
            </Text>
            <Text style={{
              fontSize: 13,
              color: '#00d9ff80',
              marginTop: 2,
            }}>
              {userData?.department || ''} Department
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderColor: '#00f5ff' }]}>
            <Text style={styles.statNumber}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#00ff88' }]}>
            <Text style={[styles.statNumber, { color: '#00ff88' }]}>{presentStudents}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#ffaa00' }]}>
            <Text style={[styles.statNumber, { color: '#ffaa00' }]}>{attendingStudents}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#ff4444' }]}>
            <Text style={[styles.statNumber, { color: '#ff4444' }]}>{absentStudents}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        {/* Attendance Percentage */}
        {totalStudents > 0 && (
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>
              📊 Attendance: {attendancePercentage}%
            </Text>
          </View>
        )}

        {/* Timetable Button */}
        <TouchableOpacity
          onPress={() => {
            console.log('Timetable button pressed');
            fetchTimetable(semester, branch);
            setShowTimetable(true);
          }}
          activeOpacity={0.8}
          style={{ marginBottom: 15, paddingHorizontal: 20 }}
        >
          <Animated.View style={{
            backgroundColor: canEditTimetable ? '#00bfff' : '#00d9ff80',
            paddingVertical: 15,
            paddingHorizontal: 30,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: '#00bfff',
            shadowOpacity: glowOpacity,
            shadowRadius: 15,
            elevation: 10,
          }}>
            <Text style={{ color: '#0a1628', fontSize: 16, fontWeight: 'bold' }}>
              📅 {canEditTimetable ? 'MANAGE TIMETABLE' : 'VIEW TIMETABLE'}
            </Text>
            {!canEditTimetable && (
              <Text style={{ color: '#0a1628', fontSize: 11, marginTop: 3 }}>
                (View Only - No Edit Permission)
              </Text>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Student List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            📋 Live Student Attendance
          </Text>
          <Text style={styles.listHeaderSubtext}>
            Real-time tracking • Auto-refresh
          </Text>
        </View>

        {/* Student List */}
        <ScrollView style={styles.studentList} contentContainerStyle={styles.studentListContent}>
          {students.map((student) => {
            if (!student || !student._id) return null;

            const studentStatus = student.status || 'absent';
            const statusIcon = studentStatus === 'present' ? '✅' :
              studentStatus === 'attending' ? '⏱️' : '❌';
            const statusColor = teacherConfig?.statusColors?.[studentStatus] || '#00d9ff';

            return (
              <TouchableOpacity
                key={student._id}
                onPress={() => fetchStudentDetails(student)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[styles.studentCard, {
                    backgroundColor: teacherConfig?.cardBackgroundColor || '#0d1f3c',
                    borderColor: statusColor,
                    borderWidth: 2,
                    shadowColor: statusColor,
                    shadowOpacity: glowOpacity,
                    shadowRadius: 15,
                  }]}
                >
                  <View style={styles.studentHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{statusIcon} {student.name || 'Unknown'}</Text>
                      <Text style={styles.studentId}>ID: {student.enrollmentNumber || 'N/A'}</Text>
                    </View>
                    <View style={[styles.statusBadge, {
                      backgroundColor: statusColor
                    }]}>
                      <Text style={styles.statusText}>{studentStatus.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.studentFooter}>
                    <Text style={styles.timerText}>{formatTime(student.timerValue || 0)}</Text>
                    {student.isRunning && (
                      <Text style={styles.runningIndicator}>● LIVE</Text>
                    )}
                  </View>
                  <Text style={styles.tapHint}>Tap for details →</Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
          {students.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No students attending yet</Text>
              <Text style={styles.emptySubtext}>Students will appear here when they start their session</Text>
            </View>
          )}
        </ScrollView>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContent, {
              transform: [{ scale: scaleAnim }]
            }]}>
              <ScrollView>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>📊 Student Details</Text>
                  <TouchableOpacity onPress={closeStudentDetails}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {loadingDetails ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <>
                    {/* Student Info */}
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>👤 Personal Information</Text>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name:</Text>
                        <Text style={styles.infoValue}>{selectedStudent?.name || 'Unknown'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Enrollment:</Text>
                        <Text style={styles.infoValue}>{studentDetails?.enrollmentNo || selectedStudent?.enrollmentNumber || 'N/A'}</Text>
                      </View>
                      {studentDetails && (
                        <>
                          {studentDetails.email && (
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Email:</Text>
                              <Text style={styles.infoValue}>{studentDetails.email}</Text>
                            </View>
                          )}
                          {studentDetails.course && (
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Course:</Text>
                              <Text style={styles.infoValue}>{studentDetails.course}</Text>
                            </View>
                          )}
                          {studentDetails.semester && (
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Semester:</Text>
                              <Text style={styles.infoValue}>{studentDetails.semester}</Text>
                            </View>
                          )}
                          {studentDetails.phone && (
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Phone:</Text>
                              <Text style={styles.infoValue}>{studentDetails.phone}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>

                    {/* Current Status */}
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>⏱️ Current Session</Text>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status:</Text>
                        <Text style={[styles.infoValue, { 
                          color: (selectedStudent?.status === 'present') ? '#00ff88' : 
                                 (selectedStudent?.status === 'attending') ? '#ffaa00' : '#ff4444'
                        }]}>
                          {(selectedStudent?.status || 'absent').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Timer:</Text>
                        <Text style={styles.infoValue}>{formatTime(selectedStudent?.timerValue || 0)}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Active:</Text>
                        <Text style={styles.infoValue}>{selectedStudent?.isRunning ? 'Yes ●' : 'No'}</Text>
                      </View>
                    </View>

                    {/* Attendance Statistics */}
                    {attendanceStats && attendanceStats.total !== undefined && (
                      <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>📈 Attendance Statistics</Text>
                        <View style={styles.statsGrid}>
                          <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{attendanceStats.total || 0}</Text>
                            <Text style={styles.statLabel}>Total Days</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Text style={[styles.statNumber, { color: '#00ff88' }]}>{attendanceStats.present || 0}</Text>
                            <Text style={styles.statLabel}>Present</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Text style={[styles.statNumber, { color: '#ff4444' }]}>{attendanceStats.absent || 0}</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Text style={[styles.statNumber, { color: '#00d9ff' }]}>{attendanceStats.percentage || 0}%</Text>
                            <Text style={styles.statLabel}>Percentage</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Attendance History */}
                    {attendanceRecords && attendanceRecords.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>📅 Recent Attendance (Last 30 Days)</Text>
                        {attendanceRecords.slice(0, 10).map((record, index) => {
                          if (!record || !record.date) return null;
                          return (
                            <View key={index} style={styles.recordRow}>
                              <Text style={styles.recordDate}>
                                {new Date(record.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </Text>
                              <Text style={[styles.recordStatus, {
                                color: record.status === 'present' ? '#00ff88' : '#ff4444'
                              }]}>
                                {record.status === 'present' ? '✅ Present' : '❌ Absent'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        )}
      </Animated.View>
    );
  }

  // Student Timer Screen
  const screen = config?.studentScreen || getDefaultConfig().studentScreen;
  const startPauseBtn = screen?.buttons?.[0] || getDefaultConfig().studentScreen.buttons[0];
  const resetBtn = screen?.buttons?.[1] || getDefaultConfig().studentScreen.buttons[1];

  return (
    <Animated.View style={[styles.container, { backgroundColor: screen?.backgroundColor || '#0a1628', opacity: fadeAnim, paddingTop: 50 }]}>
      <StatusBar style="light" />

      {/* Logout Button for Student */}
      <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, { position: 'absolute', top: 50, right: 20, zIndex: 10 }]}>
        <Text style={styles.logoutButtonText}>🚪</Text>
      </TouchableOpacity>

      <Text style={[styles.glowText, {
        fontSize: screen?.title?.fontSize || 32,
        color: screen?.title?.color || '#00f5ff',
        marginBottom: 20,
      }]}>
        {screen?.title?.text || 'Countdown Timer'}
      </Text>
      <Text style={styles.studentNameDisplay}>👋 {studentName}</Text>

      <Animated.View style={{
        backgroundColor: screen?.timer?.backgroundColor || '#0d1f3c',
        borderRadius: screen?.timer?.borderRadius || 20,
        padding: 40,
        marginBottom: 50,
        shadowColor: '#00f5ff',
        shadowOpacity: glowOpacity,
        shadowRadius: 30,
        elevation: 20,
        borderWidth: 2,
        borderColor: '#00d9ff',
        transform: [{ scale: pulseAnim }],
      }}>
        <Text style={{
          fontSize: screen?.timer?.fontSize || 72,
          fontWeight: 'bold',
          color: screen?.timer?.textColor || '#00f5ff',
        }}>
          {formatTime(timeLeft)}
        </Text>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleStartPause} activeOpacity={0.8}>
          <Animated.View style={[styles.button, {
            backgroundColor: startPauseBtn?.backgroundColor || '#00f5ff',
            shadowColor: '#00f5ff',
            shadowOpacity: glowOpacity,
            shadowRadius: 15,
          }]}>
            <Text style={[styles.buttonText, {
              color: startPauseBtn?.textColor || '#0a1628',
              fontSize: startPauseBtn?.fontSize || 18
            }]}>
              {isRunning ? (startPauseBtn?.pauseText || 'PAUSE') : (startPauseBtn?.text || 'START')}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReset} activeOpacity={0.8}>
          <Animated.View style={[styles.button, {
            backgroundColor: resetBtn?.backgroundColor || '#00d9ff',
            shadowColor: '#00d9ff',
            shadowOpacity: glowOpacity,
            shadowRadius: 15,
          }]}>
            <Text style={[styles.buttonText, {
              color: resetBtn?.textColor || '#0a1628',
              fontSize: resetBtn?.fontSize || 18
            }]}>
              {resetBtn?.text || 'RESET'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => {
        fetchTimetable(semester, branch);
        setShowTimetable(true);
      }} activeOpacity={0.8} style={{ marginTop: 20 }}>
        <Animated.View style={[styles.button, {
          backgroundColor: '#00bfff',
          shadowColor: '#00bfff',
          shadowOpacity: glowOpacity,
          shadowRadius: 15,
        }]}>
          <Text style={[styles.buttonText, { color: '#0a1628', fontSize: 16 }]}>
            📅 VIEW TIMETABLE
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  loginForm: {
    width: '100%',
    backgroundColor: '#0d1f3c',
    borderRadius: 20,
    padding: 30,
    borderWidth: 2,
    borderColor: '#00d9ff',
  },
  loginLabel: {
    color: '#00d9ff',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  loginInput: {
    backgroundColor: '#0a1628',
    borderWidth: 2,
    borderColor: '#00d9ff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#00f5ff',
  },
  loginError: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 15,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 30,
    width: '100%',
  },
  loginButtonInner: {
    backgroundColor: '#00f5ff',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 10,
  },
  loginButtonText: {
    color: '#0a1628',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginHint: {
    color: '#00d9ff80',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  teacherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 5,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#0d1f3c',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00f5ff',
  },
  statLabel: {
    fontSize: 11,
    color: '#00d9ff',
    marginTop: 4,
  },
  percentageContainer: {
    backgroundColor: '#0d1f3c',
    borderWidth: 2,
    borderColor: '#00d9ff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f5ff',
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#00d9ff',
    marginBottom: 10,
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00f5ff',
  },
  listHeaderSubtext: {
    fontSize: 12,
    color: '#00d9ff80',
    marginTop: 3,
  },
  studentId: {
    fontSize: 12,
    color: '#00d9ff80',
    marginTop: 3,
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  runningIndicator: {
    fontSize: 12,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptySubtext: {
    color: '#00d9ff80',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  tapHint: {
    color: '#00d9ff80',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0d1f3c',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: '#00d9ff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#00d9ff',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00f5ff',
  },
  modalClose: {
    fontSize: 28,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#00d9ff',
    fontSize: 16,
  },
  detailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#00d9ff40',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00f5ff',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#00d9ff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: '#0a1628',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d9ff',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00f5ff',
  },
  statLabel: {
    fontSize: 12,
    color: '#00d9ff',
    marginTop: 5,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#00d9ff20',
  },
  recordDate: {
    color: '#00d9ff',
    fontSize: 14,
  },
  recordStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  glowText: {
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: '#00f5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 30,
  },
  roleButton: {
    width: 140,
    height: 160,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  roleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
    elevation: 10,
  },
  input: {
    fontSize: 20,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#00f5ff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    elevation: 10,
  },
  submitButtonText: {
    color: '#0a1628',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentNameDisplay: {
    fontSize: 18,
    color: '#00d9ff',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    minWidth: 120,
    alignItems: 'center',
    elevation: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  studentList: {
    width: '100%',
    flex: 1,
  },
  studentListContent: {
    paddingBottom: 20,
  },
  studentCard: {
    borderWidth: 2,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 10,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00f5ff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0a1628',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d9ff',
    textAlign: 'center',
  },
  emptyText: {
    color: '#00d9ff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  timetableHeader: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#00d9ff',
  },
  timetableScrollHorizontal: {
    flex: 1,
    width: '100%',
  },
  timetableGrid: {
    padding: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    borderWidth: 1,
    borderColor: '#00d9ff',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 60,
  },
  cornerCell: {
    width: 70,
    backgroundColor: '#0d1f3c',
  },
  cornerText: {
    color: '#00d9ff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerCell: {
    width: 90,
    backgroundColor: '#0d1f3c',
  },
  periodHeaderText: {
    color: '#00f5ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeText: {
    color: '#00bfff',
    fontSize: 9,
    marginTop: 2,
  },
  dayCell: {
    width: 70,
    backgroundColor: '#0d1f3c',
  },
  dayText: {
    color: '#00f5ff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dataCell: {
    width: 90,
    backgroundColor: '#0a1628',
  },
  breakCell: {
    backgroundColor: '#1a2a3a',
  },
  subjectTextSmall: {
    color: '#00f5ff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roomTextSmall: {
    color: '#00d9ff',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  breakTextSmall: {
    color: '#00bfff',
    fontSize: 20,
  },
  editModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: '#0d1f3c',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#00d9ff',
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00f5ff',
    textAlign: 'center',
    marginBottom: 5,
  },
  editModalSubtitle: {
    fontSize: 14,
    color: '#00d9ff',
    textAlign: 'center',
    marginBottom: 20,
  },
  editInput: {
    backgroundColor: '#0a1628',
    borderWidth: 1,
    borderColor: '#00d9ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    color: '#00f5ff',
    fontSize: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  editModalButton: {
    flex: 1,
    backgroundColor: '#00f5ff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editModalCancelButton: {
    backgroundColor: '#ff4444',
  },
  editModalButtonText: {
    color: '#0a1628',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editModalHint: {
    fontSize: 11,
    color: '#00d9ff',
    textAlign: 'center',
    marginTop: 15,
  },
});
