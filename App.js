import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator,
  Animated, TextInput, ScrollView, FlatList, AppState, useColorScheme
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
const THEME_KEY = '@app_theme';

// Theme colors
const THEMES = {
  dark: {
    background: '#0a1628',
    cardBackground: '#0d1f3c',
    text: '#ffffff',
    textSecondary: '#00d9ff',
    primary: '#00f5ff',
    border: '#00d9ff',
    statusBar: 'light',
  },
  light: {
    background: '#fef3e2',      // Warm cream background
    cardBackground: '#ffffff',   // Pure white cards
    text: '#2c1810',            // Rich brown text
    textSecondary: '#8b6f47',   // Warm brown secondary
    primary: '#d97706',         // Vibrant amber/orange
    border: '#f3d5a0',          // Light golden border
    statusBar: 'dark',
  }
};

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

  // Theme state - sync with system theme
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'system', 'dark', 'light'
  const isDarkTheme = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const theme = isDarkTheme ? THEMES.dark : THEMES.light;

  // Loading state for better UX
  const [isInitializing, setIsInitializing] = useState(true);

  const intervalRef = useRef(null);
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(null);

  // Animations
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Only animate glow in dark theme
    if (isDarkTheme) {
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
    }
  }, [isDarkTheme]);

  useEffect(() => {
    // Animate modal when it opens
    if (selectedStudent) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedStudent]);

  useEffect(() => {
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
      // Load all data in parallel for better performance
      const [savedTheme, cachedUserData, cachedLoginId, cachedConfig] = await Promise.all([
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
        AsyncStorage.getItem(LOGIN_ID_KEY),
        AsyncStorage.getItem(CACHE_KEY)
      ]);

      // Load theme preference
      if (savedTheme !== null) {
        setThemeMode(savedTheme); // 'system', 'dark', or 'light'
      }

      // Check for saved login data
      if (cachedUserData && cachedLoginId) {
        try {
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
        } catch (parseError) {
          console.log('Error parsing cached user data:', parseError);
          // Clear corrupted data
          await AsyncStorage.multiRemove([USER_DATA_KEY, LOGIN_ID_KEY]);
        }
      }

      // Load cached config
      if (cachedConfig) {
        try {
          setConfig(JSON.parse(cachedConfig));
        } catch (parseError) {
          console.log('Error parsing cached config:', parseError);
        }
      }

      // Fetch fresh config from server
      fetchConfig();
    } catch (error) {
      console.log('Error loading cache:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const toggleTheme = async () => {
    // Cycle through: system -> light -> dark -> system
    let newMode = 'system';
    if (themeMode === 'system') {
      newMode = 'light';
    } else if (themeMode === 'light') {
      newMode = 'dark';
    } else {
      newMode = 'system';
    }

    // Update state immediately for instant UI feedback
    setThemeMode(newMode);

    // Save to storage in background
    AsyncStorage.setItem(THEME_KEY, newMode).catch(error => {
      console.log('Error saving theme:', error);
    });
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

  // Glow effect only in dark theme
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDarkTheme ? [0.3, 0.8] : [0, 0],
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
        // Update state first for instant UI feedback
        setUserData(data.user);
        setSelectedRole(data.user.role);
        setShowLogin(false);

        // Prepare storage data
        const storageData = [
          [USER_DATA_KEY, JSON.stringify(data.user)],
          [LOGIN_ID_KEY, loginId.trim()],
          [ROLE_KEY, data.user.role]
        ];

        if (data.user.role === 'student') {
          setStudentName(data.user.name);
          setStudentId(data.user._id);
          setSemester(data.user.semester);
          setBranch(data.user.course);

          storageData.push(
            [STUDENT_NAME_KEY, data.user.name],
            [STUDENT_ID_KEY, data.user._id]
          );
        } else if (data.user.role === 'teacher') {
          setSemester(data.user.semester || '1');
          setBranch(data.user.department);
          fetchStudents();
        }

        // Save all data in parallel (non-blocking)
        AsyncStorage.multiSet(storageData).catch(error => {
          console.log('Error saving login data:', error);
        });
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

  // Loading Screen
  if (isInitializing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style={theme.statusBar} />
        <Text style={{ fontSize: 48, marginBottom: 20 }}>🎓</Text>
        <Text style={{ fontSize: 24, color: theme.primary, fontWeight: 'bold' }}>College App</Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // Login Screen
  if (showLogin) {
    return (
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: fadeAnim }]}>
        <StatusBar style={theme.statusBar} />
        <View style={styles.loginContainer}>
          <Text style={[styles.glowText, { fontSize: 36, marginBottom: 10, color: theme.primary }]}>
            🎓 College App
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 16, marginBottom: 40 }}>
            Login to continue
          </Text>

          <View style={styles.loginForm}>
            <Text style={[styles.loginLabel, { color: theme.textSecondary }]}>Enrollment / Employee ID</Text>
            <TextInput
              style={[styles.loginInput, {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder="Enter your ID"
              placeholderTextColor={theme.textSecondary + '80'}
              value={loginId}
              onChangeText={(text) => {
                setLoginId(text);
                setLoginError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.loginLabel, { marginTop: 20, color: theme.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.loginInput, {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.textSecondary + '80'}
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
                shadowColor: theme.primary,
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
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: fadeAnim }]}>
        <StatusBar style={theme.statusBar} />
        <Text style={[styles.glowText, {
          fontSize: roleConfig?.title?.fontSize || 36,
          color: theme.primary,
        }]}>
          {roleConfig?.title?.text || 'Who are you?'}
        </Text>
        <Text style={{
          fontSize: roleConfig?.subtitle?.fontSize || 16,
          color: theme.textSecondary,
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
                    backgroundColor: role?.backgroundColor || theme.primary,
                    shadowColor: theme.primary,
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
          backgroundColor: nameConfig?.inputBackgroundColor || theme.cardBackground,
          borderColor: nameConfig?.inputBorderColor || theme.border,
          shadowColor: theme.primary,
          shadowOpacity: glowOpacity,
          shadowRadius: 15,
        }]}>
          <TextInput
            style={[styles.input, { color: nameConfig?.inputTextColor || theme.primary }]}
            placeholder={nameConfig?.placeholder || 'Your Name'}
            placeholderTextColor={theme.textSecondary + '80'}
            value={studentName}
            onChangeText={setStudentName}
            autoFocus
          />
        </Animated.View>

        <TouchableOpacity onPress={handleNameSubmit} activeOpacity={0.8}>
          <Animated.View style={[styles.submitButton, {
            shadowColor: theme.primary,
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
    const canEdit = isTeacher && (userData?.canEditTimetable || false);

    const handleCellPress = (dayIdx, periodIdx) => {
      if (!canEdit) return;
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
      if (!canEdit) return;
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
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: fadeAnim }]}>
        <StatusBar style={theme.statusBar} />
        <View style={styles.timetableHeader}>
          <Text style={[styles.glowText, { fontSize: 24, color: theme.primary }]}>
            📅 Timetable {canEdit ? '(Edit Mode)' : '(View Only)'}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 5 }}>
            Sem {timetable.semester} - {timetable.branch}
          </Text>
          <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
            {canEdit && (
              <TouchableOpacity onPress={handleSaveTimetable}>
                <Text style={{ color: isDarkTheme ? '#00ff88' : '#10b981', fontSize: 14, fontWeight: 'bold' }}>💾 Save</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { setShowTimetable(false); setEditingCell(null); }}>
              <Text style={{ color: theme.primary, fontSize: 14 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal style={styles.timetableScrollHorizontal}>
          <View style={styles.timetableGrid}>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, styles.cornerCell, {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border
              }]}>
                <Text style={[styles.cornerText, { color: theme.textSecondary }]}>Day/Period</Text>
              </View>
              {timetable.periods.map((period, idx) => (
                <View key={idx} style={[styles.gridCell, styles.headerCell, {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border
                }]}>
                  <Text style={[styles.periodHeaderText, { color: theme.primary }]}>P{period.number}</Text>
                  <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                    {period.startTime}-{period.endTime}
                  </Text>
                </View>
              ))}
            </View>

            {days.map((day, dayIdx) => (
              <View key={day} style={styles.gridRow}>
                <View style={[styles.gridCell, styles.dayCell, {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border
                }]}>
                  <Text style={[styles.dayText, { color: theme.primary }]}>{day}</Text>
                </View>
                {timetable.timetable[daysFull[dayIdx]].map((period, periodIdx) => (
                  <TouchableOpacity
                    key={periodIdx}
                    onPress={() => handleCellPress(dayIdx, periodIdx)}
                    onLongPress={() => canEdit && handleToggleBreak(dayIdx, periodIdx)}
                    disabled={!canEdit}
                    activeOpacity={canEdit ? 0.7 : 1}
                  >
                    <View style={[
                      styles.gridCell,
                      styles.dataCell,
                      {
                        backgroundColor: period.isBreak
                          ? (isDarkTheme ? '#1a2a3a' : '#fef3c7')
                          : theme.background,
                        borderColor: theme.border
                      }
                    ]}>
                      {period.isBreak ? (
                        <Text style={[styles.breakTextSmall, { color: theme.textSecondary }]}>☕</Text>
                      ) : (
                        <>
                          <Text style={[styles.subjectTextSmall, { color: theme.text }]} numberOfLines={2}>
                            {period.subject || '-'}
                          </Text>
                          {period.room && (
                            <Text style={[styles.roomTextSmall, { color: theme.textSecondary }]} numberOfLines={1}>
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

        {editingCell && canEdit && (
          <View style={styles.editModal}>
            <View style={[styles.editModalContent, {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border
            }]}>
              <Text style={[styles.editModalTitle, { color: theme.primary }]}>Edit Period</Text>
              <Text style={[styles.editModalSubtitle, { color: theme.textSecondary }]}>
                {days[editingCell.dayIdx]} - Period {editingCell.periodIdx + 1}
              </Text>

              <TextInput
                style={[styles.editInput, {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text
                }]}
                placeholder="Subject Name"
                placeholderTextColor={theme.textSecondary + '80'}
                value={editSubject}
                onChangeText={setEditSubject}
                autoFocus
              />

              <TextInput
                style={[styles.editInput, {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text
                }]}
                placeholder="Room Number"
                placeholderTextColor={theme.textSecondary + '80'}
                value={editRoom}
                onChangeText={setEditRoom}
              />

              <View style={styles.editModalButtons}>
                <TouchableOpacity onPress={handleSaveCell} style={[styles.editModalButton, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.editModalButtonText, { color: isDarkTheme ? '#0a1628' : '#ffffff' }]}>✓ Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingCell(null)} style={[styles.editModalButton, styles.editModalCancelButton, { backgroundColor: theme.border }]}>
                  <Text style={[styles.editModalButtonText, { color: theme.text }]}>✕ Cancel</Text>
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
    // Clear all stored data FIRST
    try {
      await AsyncStorage.multiRemove([
        ROLE_KEY,
        STUDENT_NAME_KEY,
        STUDENT_ID_KEY,
        USER_DATA_KEY,
        LOGIN_ID_KEY
      ]);
    } catch (error) {
      console.log('Error clearing storage:', error);
    }

    // Then clear state
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setUserData(null);
    setLoginId('');
    setLoginPassword('');
    setStudentName('');
    setStudentId(null);
    setSelectedRole(null);
    setShowLogin(true);
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
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: fadeAnim, paddingTop: 50 }]}>
        <StatusBar style={theme.statusBar} />

        {/* Teacher Info Header */}
        <View style={styles.teacherHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.glowText, {
              fontSize: 28,
              color: theme.primary,
            }]}>
              {teacherConfig?.title?.text || 'Teacher Dashboard'}
            </Text>
            <Text style={{
              fontSize: 16,
              color: theme.textSecondary,
              marginTop: 5,
            }}>
              👨‍🏫 {userData?.name || 'Teacher'}
            </Text>
            <Text style={{
              fontSize: 13,
              color: theme.textSecondary + '80',
              marginTop: 2,
            }}>
              {userData?.department || ''} Department
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
              <Text style={styles.themeButtonText}>
                {themeMode === 'system' ? '🔄' : isDarkTheme ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderColor: theme.primary, backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{totalStudents}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: isDarkTheme ? '#00ff88' : '#10b981', backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statNumber, { color: isDarkTheme ? '#00ff88' : '#10b981' }]}>{presentStudents}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Present</Text>
          </View>
          <View style={[styles.statCard, { borderColor: isDarkTheme ? '#ffaa00' : '#f59e0b', backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statNumber, { color: isDarkTheme ? '#ffaa00' : '#f59e0b' }]}>{attendingStudents}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#ff4444', backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statNumber, { color: '#ff4444' }]}>{absentStudents}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Absent</Text>
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
            backgroundColor: canEditTimetable ? theme.primary : theme.primary + '80',
            paddingVertical: 15,
            paddingHorizontal: 30,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: theme.primary,
            shadowOpacity: glowOpacity,
            shadowRadius: 15,
            elevation: 10,
          }}>
            <Text style={{ color: isDarkTheme ? '#0a1628' : '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
              📅 {canEditTimetable ? 'MANAGE TIMETABLE' : 'VIEW TIMETABLE'}
            </Text>
            {!canEditTimetable && (
              <Text style={{ color: isDarkTheme ? '#0a1628' : '#ffffff', fontSize: 11, marginTop: 3 }}>
                (View Only)
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
                    backgroundColor: theme.cardBackground,
                    borderColor: statusColor,
                    borderWidth: 2,
                    shadowColor: isDarkTheme ? statusColor : 'transparent',
                    shadowOpacity: glowOpacity,
                    shadowRadius: 15,
                  }]}
                >
                  <View style={styles.studentHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.studentName, { color: theme.text }]}>{statusIcon} {student.name || 'Unknown'}</Text>
                      <Text style={[styles.studentId, { color: theme.textSecondary }]}>ID: {student.enrollmentNumber || 'N/A'}</Text>
                    </View>
                    <View style={[styles.statusBadge, {
                      backgroundColor: statusColor
                    }]}>
                      <Text style={styles.statusText}>{studentStatus.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.studentFooter}>
                    <Text style={[styles.timerText, { color: theme.text }]}>{formatTime(student.timerValue || 0)}</Text>
                    {student.isRunning && (
                      <Text style={styles.runningIndicator}>● LIVE</Text>
                    )}
                  </View>
                  <Text style={[styles.tapHint, { color: theme.textSecondary + '80' }]}>Tap for details →</Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
          {students.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No students attending yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary + '80' }]}>Students will appear here when they start their session</Text>
            </View>
          )}
        </ScrollView>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContent, {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              transform: [{ scale: scaleAnim }]
            }]}>
              <ScrollView>
                {/* Header */}
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.primary }]}>📊 Student Details</Text>
                  <TouchableOpacity onPress={closeStudentDetails}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {loadingDetails ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
                  </View>
                ) : (
                  <>
                    {/* Student Info */}
                    <View style={[styles.detailSection, { borderBottomColor: theme.border + '40' }]}>
                      <Text style={[styles.sectionTitle, { color: theme.primary }]}>👤 Personal Information</Text>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name:</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudent?.name || 'Unknown'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Enrollment:</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{studentDetails?.enrollmentNo || selectedStudent?.enrollmentNumber || 'N/A'}</Text>
                      </View>
                      {studentDetails && (
                        <>
                          {studentDetails.email && (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{studentDetails.email}</Text>
                            </View>
                          )}
                          {studentDetails.course && (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Course:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{studentDetails.course}</Text>
                            </View>
                          )}
                          {studentDetails.semester && (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Semester:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{studentDetails.semester}</Text>
                            </View>
                          )}
                          {studentDetails.phone && (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{studentDetails.phone}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>

                    {/* Current Status */}
                    <View style={[styles.detailSection, { borderBottomColor: theme.border + '40' }]}>
                      <Text style={[styles.sectionTitle, { color: theme.primary }]}>⏱️ Current Session</Text>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Status:</Text>
                        <Text style={[styles.infoValue, {
                          color: (selectedStudent?.status === 'present') ? (isDarkTheme ? '#00ff88' : '#059669') :
                            (selectedStudent?.status === 'attending') ? (isDarkTheme ? '#ffaa00' : '#d97706') : (isDarkTheme ? '#ff4444' : '#dc2626')
                        }]}>
                          {(selectedStudent?.status || 'absent').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Timer:</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{formatTime(selectedStudent?.timerValue || 0)}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Active:</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudent?.isRunning ? 'Yes ●' : 'No'}</Text>
                      </View>
                    </View>

                    {/* Attendance Statistics */}
                    {attendanceStats && attendanceStats.total !== undefined && (
                      <View style={[styles.detailSection, { borderBottomColor: theme.border + '40' }]}>
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>📈 Attendance Statistics</Text>
                        <View style={styles.statsGrid}>
                          <View style={[styles.statBox, { 
                            backgroundColor: isDarkTheme ? '#0a1628' : '#f9fafb',
                            borderColor: theme.border 
                          }]}>
                            <Text style={[styles.statNumber, { color: theme.primary }]}>{attendanceStats.total || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Days</Text>
                          </View>
                          <View style={[styles.statBox, { 
                            backgroundColor: isDarkTheme ? '#0a1628' : '#f9fafb',
                            borderColor: theme.border 
                          }]}>
                            <Text style={[styles.statNumber, { color: isDarkTheme ? '#00ff88' : '#059669' }]}>{attendanceStats.present || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Present</Text>
                          </View>
                          <View style={[styles.statBox, { 
                            backgroundColor: isDarkTheme ? '#0a1628' : '#f9fafb',
                            borderColor: theme.border 
                          }]}>
                            <Text style={[styles.statNumber, { color: isDarkTheme ? '#ff4444' : '#dc2626' }]}>{attendanceStats.absent || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Absent</Text>
                          </View>
                          <View style={[styles.statBox, { 
                            backgroundColor: isDarkTheme ? '#0a1628' : '#f9fafb',
                            borderColor: theme.border 
                          }]}>
                            <Text style={[styles.statNumber, { color: theme.primary }]}>{attendanceStats.percentage || 0}%</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Percentage</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Attendance History */}
                    {attendanceRecords && attendanceRecords.length > 0 && (
                      <View style={[styles.detailSection, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>📅 Recent Attendance (Last 30 Days)</Text>
                        {attendanceRecords.slice(0, 10).map((record, index) => {
                          if (!record || !record.date) return null;
                          return (
                            <View key={index} style={[styles.recordRow, { borderBottomColor: theme.border + '20' }]}>
                              <Text style={[styles.recordDate, { color: theme.text }]}>
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </Text>
                              <Text style={[styles.recordStatus, {
                                color: record.status === 'present'
                                  ? (isDarkTheme ? '#00ff88' : '#059669')
                                  : (isDarkTheme ? '#ff4444' : '#dc2626')
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

  // Calculate current status
  const currentStatus = timeLeft === 0 ? 'present' : isRunning ? 'attending' : 'absent';
  const statusColor = currentStatus === 'present' ? (isDarkTheme ? '#00ff88' : '#059669') :
    currentStatus === 'attending' ? (isDarkTheme ? '#ffaa00' : '#d97706') :
    (isDarkTheme ? '#ff4444' : '#dc2626');
  const statusText = currentStatus === 'present' ? '✅ Completed' :
    currentStatus === 'attending' ? '⏱️ In Progress' : '❌ Not Started';

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: fadeAnim, paddingTop: 50 }]}>
      <StatusBar style={theme.statusBar} />

      {/* Theme Toggle and Logout Buttons for Student */}
      <View style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
          <Text style={styles.themeButtonText}>
            {themeMode === 'system' ? '🔄' : isDarkTheme ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>🚪</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.glowText, {
        fontSize: screen?.title?.fontSize || 32,
        color: theme.primary,
        marginBottom: 10,
      }]}>
        {screen?.title?.text || 'Countdown Timer'}
      </Text>
      
      {/* Student Info Card */}
      <View style={{
        backgroundColor: theme.cardBackground,
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: theme.border,
        width: '100%',
        maxWidth: 400,
      }}>
        <Text style={[styles.studentNameDisplay, { color: theme.text, fontSize: 18, marginBottom: 8 }]}>
          👋 {studentName}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {userData?.enrollmentNo || 'Student'}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {semester && branch ? `Sem ${semester} • ${branch}` : ''}
            </Text>
          </View>
          <View style={{
            backgroundColor: statusColor + '20',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: statusColor,
          }}>
            <Text style={{ color: statusColor, fontSize: 12, fontWeight: 'bold' }}>
              {statusText}
            </Text>
          </View>
        </View>
      </View>

      {/* Timer Display */}
      <Animated.View style={{
        backgroundColor: theme.cardBackground,
        borderRadius: screen?.timer?.borderRadius || 20,
        padding: 40,
        marginBottom: 30,
        shadowColor: theme.primary,
        shadowOpacity: glowOpacity,
        shadowRadius: 30,
        elevation: 20,
        borderWidth: 3,
        borderColor: isRunning ? statusColor : theme.border,
        transform: [{ scale: pulseAnim }],
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
      }}>
        <Text style={{
          fontSize: screen?.timer?.fontSize || 72,
          fontWeight: 'bold',
          color: theme.primary,
          letterSpacing: 4,
        }}>
          {formatTime(timeLeft)}
        </Text>
        {isRunning && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusColor,
              marginRight: 6,
            }} />
            <Text style={{ color: statusColor, fontSize: 14, fontWeight: 'bold' }}>
              LIVE
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleStartPause} activeOpacity={0.8} style={{ flex: 1 }}>
          <Animated.View style={[styles.button, {
            backgroundColor: isRunning ? (isDarkTheme ? '#ff4444' : '#dc2626') : theme.primary,
            shadowColor: theme.primary,
            shadowOpacity: glowOpacity,
            shadowRadius: 15,
          }]}>
            <Text style={[styles.buttonText, {
              color: '#ffffff',
              fontSize: startPauseBtn?.fontSize || 18
            }]}>
              {isRunning ? '⏸️ PAUSE' : '▶️ START'}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReset} activeOpacity={0.8} style={{ flex: 1 }}>
          <Animated.View style={[styles.button, {
            backgroundColor: isDarkTheme ? '#0d1f3c' : '#f3f4f6',
            borderWidth: 2,
            borderColor: theme.border,
            shadowColor: theme.primary,
            shadowOpacity: glowOpacity * 0.5,
            shadowRadius: 10,
          }]}>
            <Text style={[styles.buttonText, {
              color: theme.text,
              fontSize: resetBtn?.fontSize || 18
            }]}>
              🔄 RESET
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Timetable Button */}
      <TouchableOpacity onPress={() => {
        fetchTimetable(semester, branch);
        setShowTimetable(true);
      }} activeOpacity={0.8} style={{ marginTop: 20, width: '100%', maxWidth: 400 }}>
        <Animated.View style={{
          backgroundColor: isDarkTheme ? '#0d1f3c' : '#ffffff',
          borderWidth: 2,
          borderColor: theme.border,
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 15,
          alignItems: 'center',
          shadowColor: theme.primary,
          shadowOpacity: glowOpacity * 0.3,
          shadowRadius: 10,
          elevation: 5,
        }}>
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>
            📅 VIEW TIMETABLE
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={{
        marginTop: 30,
        width: '100%',
        maxWidth: 400,
        backgroundColor: theme.cardBackground,
        borderRadius: 15,
        padding: 20,
        borderWidth: 2,
        borderColor: theme.border,
      }}>
        <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 15 }}>
          📊 Session Info
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Total Duration:</Text>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
            {formatTime(config?.studentScreen?.timer?.duration || 120)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Time Remaining:</Text>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Progress:</Text>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
            {Math.round(((config?.studentScreen?.timer?.duration || 120) - timeLeft) / (config?.studentScreen?.timer?.duration || 120) * 100)}%
          </Text>
        </View>
      </View>
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
  themeButton: {
    backgroundColor: '#fbbf24',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 5,
  },
  themeButtonText: {
    fontSize: 18,
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
