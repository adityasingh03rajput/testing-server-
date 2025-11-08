import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator,
  Animated, TextInput, ScrollView, FlatList, AppState, useColorScheme, Image, Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import FaceVerificationScreen from './FaceVerificationScreen';
import { initializeFaceCache, cacheProfilePhoto, isPhotoCached } from './FaceVerification';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import BottomNavigation from './BottomNavigation';
import CalendarScreen from './CalendarScreen';
import ProfileScreen from './ProfileScreen';
import TimetableScreen from './TimetableScreen';
import NotificationsScreen from './NotificationsScreen';
import LanyardCard from './LanyardCard';
import CircularTimer from './CircularTimer';
import { SunIcon, MoonIcon, LogoutIcon, RefreshIcon } from './Icons';
import { initializeServerTime, getServerTime } from './ServerTime';

const API_URL = 'https://google-8j5x.onrender.com/api/config';
const SOCKET_URL = 'https://google-8j5x.onrender.com';
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
  const [semester, setSemester] = useState('1');
  const [branch, setBranch] = useState('CSE');

  // Teacher-specific timetable states
  const [showTimetable, setShowTimetable] = useState(false);
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

  // Profile modal state
  const [showProfile, setShowProfile] = useState(false);

  // Face verification states
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [photoCached, setPhotoCached] = useState(false);
  const [verifiedToday, setVerifiedToday] = useState(false); // Track if verified today

  // Bottom navigation state
  const [activeTab, setActiveTab] = useState('home');
  const [notificationBadge, setNotificationBadge] = useState(0);

  // Lanyard state
  const [showLanyard, setShowLanyard] = useState(false);

  // Current day state for real-time timetable updates (using server time)
  const [currentDay, setCurrentDay] = useState(() => {
    try {
      const serverTime = getServerTime();
      return serverTime.getCurrentDay();
    } catch {
      // Fallback to device time if server time not initialized yet
      const dayIndex = new Date().getDay();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[dayIndex];
    }
  });

  // Class progress tracking
  const [currentClassInfo, setCurrentClassInfo] = useState(null);
  const [classStartTime, setClassStartTime] = useState(null);
  const [attendedMinutes, setAttendedMinutes] = useState(0);

  // Detailed attendance tracking (using server time)
  const [todayAttendance, setTodayAttendance] = useState({
    date: (() => {
      try {
        const serverTime = getServerTime();
        return serverTime.nowDate().toDateString();
      } catch {
        return new Date().toDateString();
      }
    })(),
    lectures: [], // { subject, attended, total, present }
    totalAttended: 0,
    totalClassTime: 0,
    dayPresent: false
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const intervalRef = useRef(null);
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(null);

  // Animations
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const profileScaleAnim = useRef(new Animated.Value(0)).current;

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
    // Animate profile modal when it opens
    if (showProfile) {
      profileScaleAnim.setValue(0);
      Animated.spring(profileScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [showProfile]);

  // Update current day at midnight and reset verification (using server time)
  useEffect(() => {
    let lastDate = (() => {
      try {
        const serverTime = getServerTime();
        return serverTime.nowDate().toDateString();
      } catch {
        return new Date().toDateString();
      }
    })();

    const updateCurrentDay = () => {
      try {
        const serverTime = getServerTime();
        const now = serverTime.nowDate();
        const currentDate = now.toDateString();

        // Update current day using server time
        setCurrentDay(serverTime.getCurrentDay());

        // Check if date changed (new day)
        if (currentDate !== lastDate) {
          console.log('🌅 New day detected (server time)! Resetting face verification status.');
          setVerifiedToday(false);
          setIsFaceVerified(false);
          setIsRunning(false);
          lastDate = currentDate;
        }
      } catch (error) {
        console.warn('⚠️ Server time not available, using device time');
        const now = new Date();
        const currentDate = now.toDateString();
        const dayIndex = now.getDay();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        setCurrentDay(days[dayIndex]);

        if (currentDate !== lastDate) {
          console.log('🌅 New day detected (device time)! Resetting face verification status.');
          setVerifiedToday(false);
          setIsFaceVerified(false);
          setIsRunning(false);
          lastDate = currentDate;
        }
      }
    };

    // Check every minute if day has changed
    const dayCheckInterval = setInterval(() => {
      updateCurrentDay();
    }, 60000); // Check every minute

    return () => clearInterval(dayCheckInterval);
  }, []);

  // Fetch timetable when user is logged in and semester/branch are available
  useEffect(() => {
    if (selectedRole === 'student' && semester && branch && !showLogin) {
      console.log('Fetching timetable for logged in student:', semester, branch);
      fetchTimetable(semester, branch);
    }
  }, [selectedRole, semester, branch, showLogin]);

  // Check if today is a leave day (Sunday or no classes)
  const isLeaveDay = () => {
    try {
      const serverTime = getServerTime();
      const today = serverTime.nowDate().getDay();
      // Sunday = 0
      if (today === 0) return true;

      // Check if there are any classes today
      if (!timetable?.schedule?.[currentDay]) return false;
      const schedule = timetable.schedule[currentDay];
      if (!schedule || !Array.isArray(schedule)) return false;
      const hasClasses = schedule.some(slot => !slot.isBreak && slot.subject);
      return !hasClasses;
    } catch (error) {
      console.log('Error checking leave day:', error);
      return false;
    }
  };

  // Save attendance to server when lectures are updated
  useEffect(() => {
    if (selectedRole === 'student' && todayAttendance.lectures.length > 0 && studentId && semester && branch) {
      saveAttendanceToServer();
    }
  }, [todayAttendance.lectures.length]);

  // Calculate current class progress every second
  useEffect(() => {
    if (!timetable?.schedule?.[currentDay] || selectedRole !== 'student') return;

    const updateClassProgress = () => {
      let now, currentHour, currentMinute, currentSeconds, currentTimeInSeconds;

      try {
        const serverTime = getServerTime();
        now = serverTime.nowDate();
        currentHour = now.getHours();
        currentMinute = now.getMinutes();
        currentSeconds = now.getSeconds();
        currentTimeInSeconds = (currentHour * 3600) + (currentMinute * 60) + currentSeconds;
      } catch {
        now = new Date();
        currentHour = now.getHours();
        currentMinute = now.getMinutes();
        currentSeconds = now.getSeconds();
        currentTimeInSeconds = (currentHour * 3600) + (currentMinute * 60) + currentSeconds;
      }

      const schedule = timetable.schedule[currentDay];
      let foundClass = null;

      for (const slot of schedule) {
        if (slot.time && !slot.isBreak) {
          const [start, end] = slot.time.split('-').map(t => t.trim());
          const [startH, startM] = start.split(':').map(Number);
          const [endH, endM] = end.split(':').map(Number);

          const startSeconds = (startH * 3600) + (startM * 60);
          const endSeconds = (endH * 3600) + (endM * 60);

          if (currentTimeInSeconds >= startSeconds && currentTimeInSeconds <= endSeconds) {
            const elapsed = currentTimeInSeconds - startSeconds;
            const total = endSeconds - startSeconds;
            const remaining = total - elapsed;

            foundClass = {
              subject: slot.subject,
              room: slot.room,
              startTime: start,
              endTime: end,
              elapsedMinutes: Math.floor(elapsed / 60),
              remainingMinutes: Math.floor(remaining / 60),
              remainingSeconds: remaining,
              totalMinutes: Math.floor(total / 60),
              elapsedSeconds: elapsed,
              totalSeconds: total,
            };
            break;
          }
        }
      }

      // Update class info and attendance tracking
      setCurrentClassInfo(prevClass => {
        // Detect class change - new class started
        if (foundClass && prevClass && foundClass.subject !== prevClass.subject) {
          // Save attendance for previous class
          if (attendedMinutes > 0) {
            saveLectureAttendance(prevClass, attendedMinutes);
          }
          // Reset attendance tracking for new class, but keep verification status
          setClassStartTime(null);
          setAttendedMinutes(0);
          // Timer continues running if already verified today
        }
        // Detect class end
        else if (!foundClass && prevClass && attendedMinutes > 0) {
          saveLectureAttendance(prevClass, attendedMinutes);
          setClassStartTime(null);
          setAttendedMinutes(0);
          // Keep timer running if verified, it will auto-start for next class
        }
        return foundClass;
      });

      // Track attendance time when timer is running
      if (foundClass && isRunning) {
        try {
          const serverTime = getServerTime();
          const currentServerTime = serverTime.now();
          setClassStartTime(prev => prev || currentServerTime);
          setAttendedMinutes(prev => {
            const startTime = classStartTime || currentServerTime;
            return Math.floor((currentServerTime - startTime) / 60000);
          });
        } catch {
          // If server time fails, don't track attendance - security measure
          console.error('⚠️ Cannot track attendance without server time');
        }
      }
    };

    updateClassProgress();
    const progressInterval = setInterval(updateClassProgress, 1000);

    return () => clearInterval(progressInterval);
  }, [timetable, currentDay, selectedRole, isRunning, classStartTime, attendedMinutes]);

  useEffect(() => {
    // Initialize server time synchronization (CRITICAL for security)
    const serverTime = initializeServerTime(SOCKET_URL);
    serverTime.initialize().then(async (success) => {
      if (serverTime.isDeviceTimeManipulated()) {
        console.error('🚨 DEVICE TIME MANIPULATION DETECTED');
        console.error('   Please set your device time to automatic');
        Alert.alert(
          '⚠️ Time Error',
          'Your device time is incorrect. Please set your device time to automatic (use network-provided time) and restart the app.\n\nThe app cannot function with incorrect device time for security reasons.',
          [{ text: 'OK' }]
        );
      } else if (success) {
        console.log('✅ Server time synchronized');
        console.log('   Server time:', serverTime.nowISO());
        console.log('   Device time:', new Date().toISOString());
        console.log('   Offset:', serverTime.serverTimeOffset, 'ms');
      } else {
        console.warn('⚠️ Server time sync failed');
      }
    });

    // Initialize face cache
    initializeFaceCache();

    loadConfig();
    setupSocket();

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        if (backgroundTimeRef.current && isRunning && selectedRole === 'student') {
          try {
            const serverTime = getServerTime();
            const currentServerTime = serverTime.now();
            const timeInBackground = Math.floor((currentServerTime - backgroundTimeRef.current) / 1000);
            setTimeLeft(prev => {
              const newTime = Math.max(0, prev - timeInBackground);
              updateTimerOnServer(newTime, newTime > 0, newTime === 0 ? 'present' : null);
              return newTime;
            });
          } catch {
            // If server time fails, reset timer - security measure
            console.error('⚠️ Cannot calculate background time without server time');
            setTimeLeft(0);
            updateTimerOnServer(0, false, null);
          }
        }
        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        if (isRunning && selectedRole === 'student') {
          try {
            const serverTime = getServerTime();
            const currentServerTime = serverTime.now();
            backgroundTimeRef.current = currentServerTime;
          } catch {
            // If server time fails, don't track background time
            console.error('⚠️ Cannot track background time without server time');
            backgroundTimeRef.current = null;
          }
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

  // Save lecture attendance when class ends
  const saveLectureAttendance = (lectureInfo, attendedMin) => {
    const totalMin = lectureInfo.totalMinutes;
    const attendancePercentage = (attendedMin / totalMin) * 100;
    const isPresent = attendancePercentage >= 75;

    const lectureRecord = {
      subject: lectureInfo.subject,
      room: lectureInfo.room,
      startTime: lectureInfo.startTime,
      endTime: lectureInfo.endTime,
      attended: attendedMin,
      total: totalMin,
      percentage: Math.round(attendancePercentage),
      present: isPresent
    };

    setTodayAttendance(prev => {
      const updatedLectures = [...prev.lectures];
      const existingIndex = updatedLectures.findIndex(l =>
        l.subject === lectureInfo.subject && l.startTime === lectureInfo.startTime
      );

      if (existingIndex >= 0) {
        updatedLectures[existingIndex] = lectureRecord;
      } else {
        updatedLectures.push(lectureRecord);
      }

      const totalAttended = updatedLectures.reduce((sum, l) => sum + l.attended, 0);
      const totalClassTime = updatedLectures.reduce((sum, l) => sum + l.total, 0);
      const dayPercentage = totalClassTime > 0 ? (totalAttended / totalClassTime) * 100 : 0;
      const dayPresent = dayPercentage >= 75;

      // CRITICAL: Use server time for attendance date to prevent manipulation
      let attendanceDate;
      try {
        const serverTime = getServerTime();
        attendanceDate = serverTime.nowDate().toDateString();
      } catch {
        console.warn('⚠️ Server time not available for attendance date, using device time');
        attendanceDate = new Date().toDateString();
      }

      return {
        date: attendanceDate,
        lectures: updatedLectures,
        totalAttended,
        totalClassTime,
        dayPercentage: Math.round(dayPercentage),
        dayPresent
      };
    });
  };

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    const totalDays = attendanceHistory.length + (todayAttendance.lectures.length > 0 ? 1 : 0);
    const presentDays = attendanceHistory.filter(d => d.dayPresent).length + (todayAttendance.dayPresent ? 1 : 0);

    return {
      totalDays,
      presentDays,
      attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    };
  };

  // Save attendance to server
  const saveAttendanceToServer = async () => {
    if (!studentId || todayAttendance.lectures.length === 0) return;

    try {
      // Get server date for validation
      let clientDate;
      try {
        const serverTime = getServerTime();
        clientDate = serverTime.nowDate().toISOString();
      } catch {
        clientDate = new Date().toISOString();
      }

      const response = await fetch(`${SOCKET_URL}/api/attendance/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName,
          enrollmentNumber: userData?.enrollmentNo,
          status: todayAttendance.dayPresent ? 'present' : 'absent',
          timerValue: 0,
          semester,
          branch,
          lectures: todayAttendance.lectures,
          totalAttended: todayAttendance.totalAttended,
          totalClassTime: todayAttendance.totalClassTime,
          dayPercentage: todayAttendance.dayPercentage,
          clientDate: clientDate // Send for server validation
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Attendance saved to server:', data.record);
      }
    } catch (error) {
      console.log('Error saving attendance to server:', error);
    }
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
            // Use enrollmentNo as studentId for attendance tracking
            setStudentId(userData.enrollmentNo || userData._id);
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

      // Fetch attendance records (last 30 days) - use server time
      let thirtyDaysAgo;
      try {
        const serverTime = getServerTime();
        thirtyDaysAgo = new Date(serverTime.now());
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      } catch {
        thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      }
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

  // Convert timetable format for CircularTimer (supports dynamic days)
  const convertTimetableFormat = (timetable) => {
    if (!timetable || !timetable.timetable) return null;

    const schedule = {};
    // Get days dynamically from timetable in proper week order
    const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKeys = Object.keys(timetable.timetable).sort((a, b) => 
      dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase())
    );

    dayKeys.forEach((dayKey) => {
      const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
      if (timetable.timetable[dayKey]) {
        schedule[dayName] = timetable.timetable[dayKey].map(period => ({
          subject: period.subject,
          room: period.room,
          time: timetable.periods && timetable.periods[period.period - 1]
            ? `${timetable.periods[period.period - 1].startTime}-${timetable.periods[period.period - 1].endTime}`
            : '',
          isBreak: period.isBreak
        }));
      }
    });

    console.log('Converted timetable schedule (dynamic days):', schedule);

    return { ...timetable, schedule };
  };

  const fetchTimetable = async (sem, br) => {
    try {
      console.log('Fetching timetable for:', sem, br);
      const response = await fetch(`${SOCKET_URL}/api/timetable/${sem}/${br}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Timetable data:', data);
      if (data.success) {
        const convertedTimetable = convertTimetableFormat(data.timetable);
        setTimetable(convertedTimetable);
        console.log('Timetable set successfully');
        console.log('Periods count:', data.timetable.periods?.length);
      }
    } catch (error) {
      console.log('Error fetching timetable:', error);
    }
  };

  // Auto-refresh timetable every 60 seconds to get period updates
  useEffect(() => {
    if (selectedRole === 'student' && semester && branch && !showLogin) {
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing timetable...');
        fetchTimetable(semester, branch);
      }, 60000); // Refresh every 60 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [selectedRole, semester, branch, showLogin]);

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
        // Fallback: use offline mode with server time if available
        let offlineId;
        try {
          const serverTime = getServerTime();
          offlineId = 'offline_' + serverTime.now();
        } catch {
          offlineId = 'offline_' + Date.now();
        }
        await AsyncStorage.setItem(STUDENT_ID_KEY, offlineId);
        await AsyncStorage.setItem(STUDENT_NAME_KEY, studentName.trim());
        setStudentId(offlineId);
        setShowNameInput(false);
      }
    } catch (error) {
      console.log('Error registering student, using offline mode:', error);
      // Fallback: use offline mode with server time if available
      let offlineId;
      try {
        const serverTime = getServerTime();
        offlineId = 'offline_' + serverTime.now();
      } catch {
        offlineId = 'offline_' + Date.now();
      }
      await AsyncStorage.setItem(STUDENT_ID_KEY, offlineId);
      await AsyncStorage.setItem(STUDENT_NAME_KEY, studentName.trim());
      setStudentId(offlineId);
      setShowNameInput(false);
    }
  };

  // Remove the old 2-minute timer logic - timer now runs continuously based on lectures
  useEffect(() => {
    // Timer runs continuously when started, no automatic stop
    // Attendance is tracked per lecture in the class progress effect
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

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
        // Get server date for validation
        let clientDate;
        try {
          const serverTime = getServerTime();
          clientDate = serverTime.nowDate().toISOString();
        } catch {
          clientDate = new Date().toISOString();
        }

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
            branch,
            clientDate: clientDate // Send for server validation
          })
        });
      } catch (error) {
        console.log('Error saving attendance record:', error);
      }
    }
  };

  const handleStartPause = () => {
    // Only allow starting, no pausing
    if (isRunning) {
      // Already running, do nothing
      return;
    }

    // Check if there's an active class
    if (!currentClassInfo) {
      alert('No active class right now. Please wait for the next lecture to start.');
      return;
    }

    // If trying to start timer and not verified today yet, show face verification
    if (!verifiedToday) {
      setShowFaceVerification(true);
      return;
    }

    // Start timer (no toggle, only start)
    setIsRunning(true);
    updateTimerOnServer(timeLeft, true);
  };

  const handleVerificationSuccess = async (result) => {
    console.log('✅ Face verification successful:', result);
    setIsFaceVerified(true);
    setVerifiedToday(true); // Mark as verified for the entire day
    setShowFaceVerification(false);

    // Mark verification for current class
    if (currentClassInfo) {
      try {
        const serverTime = getServerTime();
        const currentServerTime = serverTime.now();
        setClassStartTime(currentServerTime);
      } catch {
        // If server time fails, don't mark class start - security measure
        console.error('⚠️ Cannot mark class start without server time');
      }
    }

    // Keep screen awake for continuous tracking
    try {
      await activateKeepAwakeAsync('attendance-tracking');
      console.log('✅ Keep awake activated');
    } catch (error) {
      console.log('Error activating keep awake:', error);
    }

    // Auto-start timer after verification
    setTimeout(() => {
      setIsRunning(true);
      updateTimerOnServer(timeLeft, true);
    }, 500);
  };

  const handleVerificationFailed = (result) => {
    console.log('❌ Face verification failed:', result);
    alert('Face verification failed. Please try again.');
  };

  const handleReset = () => {
    // Reset stops the timer and clears verification for the day
    setIsRunning(false);
    setVerifiedToday(false);
    setIsFaceVerified(false);
    setClassStartTime(null);
    setAttendedMinutes(0);
    clearInterval(intervalRef.current);
    const duration = config?.studentScreen?.timer?.duration || 120;
    setTimeLeft(duration);
    updateTimerOnServer(duration, false, 'absent');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const refreshUserProfile = async () => {
    if (!loginId) return;

    try {
      const response = await fetch(`${SOCKET_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: loginId,
          password: 'refresh' // Special flag for refresh without password check
        })
      });

      const data = await response.json();
      if (data.success && data.user) {
        setUserData(data.user);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
        console.log('✅ Profile refreshed with latest photo');
      }
    } catch (error) {
      console.log('Error refreshing profile:', error);
    }
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
        // Debug: Log user data to check photoUrl
        console.log('🔍 Login successful, user data:', data.user);
        console.log('📸 PhotoUrl:', data.user.photoUrl);

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
          // Use enrollmentNo as studentId for attendance tracking
          setStudentId(data.user.enrollmentNo || data.user._id);
          setSemester(data.user.semester);
          setBranch(data.user.course);

          // Fetch timetable for student
          fetchTimetable(data.user.semester, data.user.course);

          storageData.push(
            [STUDENT_NAME_KEY, data.user.name],
            [STUDENT_ID_KEY, data.user.enrollmentNo || data.user._id]
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

        // Cache profile photo for face verification (students only)
        if (data.user.role === 'student' && data.user.photoUrl) {
          console.log('📥 Caching profile photo for face verification...');
          cacheProfilePhoto(data.user.photoUrl, data.user._id).then(async (cachedPath) => {
            if (cachedPath) {
              console.log('✅ Photo cached successfully');
              setPhotoCached(true);
            } else {
              console.log('⚠️ Failed to cache photo');
            }
          });
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

  // Timetable Modal (for teachers only)
  if (selectedRole === 'teacher' && showTimetable && timetable) {
    // Get days dynamically from timetable
    const daysFull = Object.keys(timetable.timetable);
    const days = daysFull.map(day => day.substring(0, 3).charAt(0).toUpperCase() + day.substring(1, 3));
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
    // Deactivate keep awake
    try {
      deactivateKeepAwake('attendance-tracking');
      console.log('✅ Keep awake deactivated');
    } catch (error) {
      console.log('Error deactivating keep awake:', error);
    }

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
    setVerifiedToday(false); // Reset verification status
    setIsFaceVerified(false);
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
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBar} />
        
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Compact Header */}
          <View style={{
            backgroundColor: theme.primary,
            paddingTop: 50,
            paddingBottom: 20,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <TouchableOpacity onPress={() => setShowProfile(true)} activeOpacity={0.8}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#fff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#fff',
                  overflow: 'hidden',
                }}>
                  {userData?.photoUrl ? (
                    <Image
                      source={{ uri: userData.photoUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 20, color: theme.primary, fontWeight: 'bold' }}>
                      {getInitials(userData?.name || 'Teacher')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
                  {userData?.name || 'Teacher'}
                </Text>
                <Text style={{ fontSize: 13, color: '#fff', opacity: 0.9, marginTop: 2 }}>
                  {userData?.department || ''} Department
                </Text>
              </View>
              <TouchableOpacity onPress={toggleTheme} style={{ padding: 8, marginRight: 8 }}>
                <Text style={{ fontSize: 20 }}>
                  {themeMode === 'system' ? '🔄' : isDarkTheme ? '☀️' : '🌙'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }}>
                <Text style={{ fontSize: 20 }}>🚪</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Grid - 2x2 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>{totalStudents}</Text>
                <Text style={{ fontSize: 12, color: '#fff', opacity: 0.9, marginTop: 4 }}>Total</Text>
              </View>
              <View style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: 'rgba(0,255,136,0.2)',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(0,255,136,0.3)',
              }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#00ff88' }}>{presentStudents}</Text>
                <Text style={{ fontSize: 12, color: '#fff', opacity: 0.9, marginTop: 4 }}>Present</Text>
              </View>
              <View style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: 'rgba(255,170,0,0.2)',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,170,0,0.3)',
              }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ffaa00' }}>{attendingStudents}</Text>
                <Text style={{ fontSize: 12, color: '#fff', opacity: 0.9, marginTop: 4 }}>Active</Text>
              </View>
              <View style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: 'rgba(255,68,68,0.2)',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,68,68,0.3)',
              }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ff4444' }}>{absentStudents}</Text>
                <Text style={{ fontSize: 12, color: '#fff', opacity: 0.9, marginTop: 4 }}>Absent</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Row */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
            <TouchableOpacity
              onPress={() => setActiveTab('timetable')}
              activeOpacity={0.8}
              style={{ flex: 1 }}
            >
              <View style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: theme.primary,
              }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>📅</Text>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                  {canEditTimetable ? 'Manage' : 'View'}
                </Text>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                  Timetable
                </Text>
              </View>
            </TouchableOpacity>

            {totalStudents > 0 && (
              <View style={{
                flex: 1,
                backgroundColor: theme.cardBackground,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: theme.border,
              }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.primary }}>
                  {attendancePercentage}%
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                  Attendance
                </Text>
              </View>
            )}
          </View>

          {/* Student List */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
                📋 Live Attendance
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                {students.length} student{students.length !== 1 ? 's' : ''}
              </Text>
            </View>
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
                  style={{ marginBottom: 12 }}
                >
                  <View style={{
                    backgroundColor: theme.cardBackground,
                    borderRadius: 12,
                    padding: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: statusColor,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                          {statusIcon} {student.name || 'Unknown'}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                          {student.enrollmentNumber || 'N/A'}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: statusColor + '20',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: statusColor,
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: statusColor }}>
                          {studentStatus.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
                        {formatTime(student.timerValue || 0)}
                      </Text>
                      {student.isRunning && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff88', marginRight: 6 }} />
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#00ff88' }}>LIVE</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {students.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
                <Text style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 4 }}>
                  No students attending yet
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, opacity: 0.7, textAlign: 'center' }}>
                  Students will appear here when they start their session
                </Text>
              </View>
            )}
          </View>
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

        {/* Profile Modal */}
        {showProfile && (
          <Modal
            transparent={true}
            visible={showProfile}
            animationType="fade"
            onRequestClose={() => setShowProfile(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[styles.profileModalContent, {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                transform: [{ scale: profileScaleAnim }]
              }]}>
                <ScrollView>
                  {/* Header */}
                  <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.primary }]}>👤 Profile</Text>
                    <TouchableOpacity onPress={() => setShowProfile(false)}>
                      <Text style={styles.modalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Profile Avatar */}
                  <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                    <View style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: theme.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 4,
                      borderColor: theme.border,
                      marginBottom: 15,
                      overflow: 'hidden',
                    }}>
                      {userData?.photoUrl ? (
                        <Image
                          source={{ uri: userData.photoUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                          onError={(e) => console.log('❌ Profile modal photo error:', e.nativeEvent.error)}
                          onLoad={() => console.log('✅ Profile modal photo loaded')}
                        />
                      ) : (
                        <Text style={{ fontSize: 48, color: isDarkTheme ? '#0a1628' : '#ffffff', fontWeight: 'bold' }}>
                          {getInitials(userData?.name || 'User')}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
                      {userData?.name || 'User'}
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 5 }}>
                      {selectedRole === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
                    </Text>
                  </View>

                  {/* Profile Information */}
                  <View style={[styles.detailSection, { borderBottomColor: theme.border + '40' }]}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>📋 Personal Information</Text>

                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.name || 'N/A'}</Text>
                    </View>

                    {selectedRole === 'teacher' ? (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Employee ID:</Text>
                          <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.employeeId || loginId || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Department:</Text>
                          <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.department || 'N/A'}</Text>
                        </View>
                        {userData?.email && (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email:</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{userData.email}</Text>
                          </View>
                        )}
                        {userData?.phone && (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone:</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{userData.phone}</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Enrollment No:</Text>
                          <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.enrollmentNo || loginId || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Course:</Text>
                          <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.course || branch || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Semester:</Text>
                          <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.semester || semester || 'N/A'}</Text>
                        </View>
                        {userData?.email && (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email:</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{userData.email}</Text>
                          </View>
                        )}
                        {userData?.phone && (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone:</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{userData.phone}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={{ padding: 20 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowProfile(false);
                        setTimeout(() => handleLogout(), 300);
                      }}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: isDarkTheme ? '#ff4444' : '#dc2626',
                        paddingVertical: 15,
                        paddingHorizontal: 30,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                        🚪 Logout
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </Animated.View>
            </View>
          </Modal>
        )}
      </View>
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

  // Render Calendar Screen
  if (activeTab === 'calendar') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBar} />
        <CalendarScreen
          theme={theme}
          studentId={studentId}
          semester={semester}
          branch={branch}
          socketUrl={SOCKET_URL}
        />
        <BottomNavigation
          theme={theme}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={selectedRole}
          notificationBadge={notificationBadge}
        />
      </View>
    );
  }

  // Render Timetable Screen (Teachers)
  if (activeTab === 'timetable' && selectedRole === 'teacher') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBar} />
        <TimetableScreen
          theme={theme}
          semester={semester}
          branch={branch}
          socketUrl={SOCKET_URL}
          canEdit={userData?.canEditTimetable || false}
          isTeacher={true}
        />
        <BottomNavigation
          theme={theme}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={selectedRole}
          notificationBadge={notificationBadge}
        />
      </View>
    );
  }

  // Render Notifications Screen (Teachers)
  if (activeTab === 'notifications' && selectedRole === 'teacher') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBar} />
        <NotificationsScreen
          theme={theme}
          userData={userData}
          socketUrl={SOCKET_URL}
        />
        <BottomNavigation
          theme={theme}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={selectedRole}
          notificationBadge={notificationBadge}
        />
      </View>
    );
  }

  // Render Students Screen (Teachers)
  if (activeTab === 'students' && selectedRole === 'teacher') {
    const [currentClassInfo, setCurrentClassInfo] = React.useState(null);
    const [filteredStudents, setFilteredStudents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const fetchCurrentClassStudents = async () => {
        try {
          setLoading(true);
          const response = await fetch(
            `${SOCKET_URL}/api/teacher/current-class-students/${userData.employeeId}`
          );
          const data = await response.json();
          
          if (data.success && data.hasActiveClass) {
            setCurrentClassInfo(data.currentClass);
            setFilteredStudents(data.students);
          } else {
            setCurrentClassInfo(null);
            setFilteredStudents([]);
          }
        } catch (error) {
          console.error('Error fetching current class students:', error);
          setFilteredStudents([]);
        } finally {
          setLoading(false);
        }
      };

      fetchCurrentClassStudents();
      
      // Refresh every 2 minutes
      const interval = setInterval(fetchCurrentClassStudents, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }, [userData.employeeId]);

    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBar} />
        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: 20, paddingTop: 60, paddingBottom: 100 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
              Students
            </Text>
            
            {/* Current Class Info */}
            {currentClassInfo && (
              <View style={{
                backgroundColor: theme.primary + '20',
                padding: 16,
                borderRadius: 12,
                marginBottom: 20,
                borderLeftWidth: 4,
                borderLeftColor: theme.primary,
              }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
                  📚 Current Class
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                  {currentClassInfo.subject}
                </Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 2 }}>
                  🎓 {currentClassInfo.branch} - Semester {currentClassInfo.semester}
                </Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 2 }}>
                  🏢 Room {currentClassInfo.room} (Capacity: {currentClassInfo.capacity})
                </Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                  🕐 {currentClassInfo.startTime} - {currentClassInfo.endTime}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary, marginTop: 8 }}>
                  👥 {filteredStudents.length} Students
                </Text>
              </View>
            )}

            {!currentClassInfo && !loading && (
              <View style={{
                backgroundColor: theme.cardBackground,
                padding: 20,
                borderRadius: 12,
                marginBottom: 20,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>⏰</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                  No Active Class
                </Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
                  You don't have any class scheduled right now
                </Text>
              </View>
            )}

            {loading && (
              <View style={{
                backgroundColor: theme.cardBackground,
                padding: 40,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Text style={{ fontSize: 16, color: theme.textSecondary }}>
                  Loading students...
                </Text>
              </View>
            )}
            
            {/* Student List - Only showing current class students */}
            {filteredStudents.map((student, index) => {
              const studentStatus = student.status || 'absent';
              const statusIcon = studentStatus === 'present' ? '✅' :
                studentStatus === 'attending' ? '⏱️' : '❌';
              const statusColor = studentStatus === 'present' ? '#10b981' :
                studentStatus === 'attending' ? '#f59e0b' : '#ef4444';

              return (
                <View
                  key={student._id || index}
                  style={{
                    backgroundColor: theme.cardBackground,
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderLeftWidth: 4,
                    borderLeftColor: statusColor,
                  }}
                >
                  {/* Profile Photo */}
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: theme.primary + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    {student.photoUrl ? (
                      <Image
                        source={{ uri: student.photoUrl }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                      />
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.primary }}>
                        {getInitials(student.name)}
                      </Text>
                    )}
                  </View>

                  {/* Student Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                      {student.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                      {student.enrollmentNo || student._id}
                    </Text>
                    {student.timerValue !== undefined && (
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                        ⏱️ {Math.floor(student.timerValue / 60)}:{(student.timerValue % 60).toString().padStart(2, '0')}
                      </Text>
                    )}
                  </View>

                  {/* Status Badge */}
                  <View style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: statusColor + '20',
                  }}>
                    <Text style={{ fontSize: 20 }}>{statusIcon}</Text>
                  </View>
                </View>
              );
            })}

            {filteredStudents.length === 0 && !loading && currentClassInfo && (
              <View style={{
                backgroundColor: theme.cardBackground,
                padding: 40,
                borderRadius: 12,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 16, color: theme.textSecondary }}>
                  No students found for this class
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        <BottomNavigation
          theme={theme}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={selectedRole}
          notificationBadge={notificationBadge}
        />
      </View>
    );
  }

  // Render Timetable Screen
  if (activeTab === 'timetable') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBar} />
        <TimetableScreen
          theme={theme}
          semester={semester}
          branch={branch}
          socketUrl={SOCKET_URL}
        />
        <BottomNavigation
          theme={theme}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={selectedRole}
          notificationBadge={notificationBadge}
        />
      </View>
    );
  }

  // Home Screen (Timer)
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      {/* Profile Picture - Shows Lanyard */}
      <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
        <TouchableOpacity onPress={() => setShowLanyard(true)} activeOpacity={0.8}>
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.primary,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: theme.border,
            overflow: 'hidden',
          }}>
            {userData?.photoUrl ? (
              <Image
                source={{ uri: userData.photoUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                onError={(e) => {
                  console.log('❌ Failed to load student photo:', userData.photoUrl);
                  console.log('Error:', e.nativeEvent.error);
                }}
                onLoad={() => console.log('✅ Student photo loaded:', userData.photoUrl)}
              />
            ) : (
              <Text style={{ fontSize: 20, color: isDarkTheme ? '#0a1628' : '#ffffff', fontWeight: 'bold' }}>
                {getInitials(studentName || 'Student')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={toggleTheme} style={[styles.iconButton, { backgroundColor: '#fbbf24' }]}>
          {themeMode === 'system' ? (
            <RefreshIcon size={20} color="#fff" />
          ) : isDarkTheme ? (
            <SunIcon size={20} color="#fff" />
          ) : (
            <MoonIcon size={20} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={[styles.iconButton, { backgroundColor: '#ef4444' }]}>
          <LogoutIcon size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 110, paddingHorizontal: 20, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >

        {/* Title */}
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: theme.primary,
          marginBottom: 15,
          textAlign: 'center',
        }}>
          Countdown Timer
        </Text>

        {/* Student Info Card */}
        <View style={{
          backgroundColor: theme.cardBackground,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
          borderWidth: 2,
          borderColor: theme.border,
          width: '100%',
          maxWidth: 400,
        }}>
          <Text style={[styles.studentNameDisplay, { color: theme.text, fontSize: 17, marginBottom: 6 }]}>
            👋 {studentName}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                {userData?.enrollmentNo || 'Student'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                {semester && branch ? `Sem ${semester} • ${branch}` : ''}
              </Text>
            </View>
            <View style={{
              backgroundColor: statusColor + '20',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 15,
              borderWidth: 1,
              borderColor: statusColor,
            }}>
              <Text style={{ color: statusColor, fontSize: 11, fontWeight: 'bold' }}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {/* Circular Timer */}
        <CircularTimer
          theme={theme}
          initialTime={(config?.studentScreen?.timer?.duration || 120) - timeLeft}
          isRunning={isRunning}
          onToggleTimer={handleStartPause}
          onReset={handleReset}
          formatTime={formatTime}
          timetable={timetable}
          currentDay={currentDay}
        />

        {/* Current Class Progress */}
        {currentClassInfo && (
          <View style={{
            marginTop: 10,
            width: '100%',
            maxWidth: 400,
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            padding: 14,
            borderWidth: 2,
            borderColor: theme.primary,
          }}>
            <Text style={{ color: theme.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
              📚 Current Class: {currentClassInfo.subject}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 10 }}>
              {currentClassInfo.startTime} - {currentClassInfo.endTime} • {currentClassInfo.room}
            </Text>

            {/* Countdown Timer Display */}
            <View style={{
              backgroundColor: theme.background,
              borderRadius: 12,
              padding: 15,
              marginBottom: 10,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: isRunning ? '#22c55e' : theme.border,
            }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 5 }}>
                Time Remaining
              </Text>
              <Text style={{
                color: isRunning ? '#22c55e' : theme.text,
                fontSize: 36,
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}>
                {Math.floor(currentClassInfo.remainingSeconds / 60)}:{(currentClassInfo.remainingSeconds % 60).toString().padStart(2, '0')}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 5 }}>
                {currentClassInfo.elapsedMinutes} min elapsed • {currentClassInfo.totalMinutes} min total
              </Text>
            </View>

            {/* Attendance Status */}
            <View style={{
              backgroundColor: theme.background,
              borderRadius: 8,
              padding: 10,
              marginBottom: 8
            }}>
              {!verifiedToday && (
                <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  ⚠️ Face verification required to start attendance
                </Text>
              )}
              {verifiedToday && isRunning && (
                <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  ✅ Attendance tracking: {attendedMinutes} min recorded
                </Text>
              )}
              {verifiedToday && !isRunning && (
                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  ⏸️ Attendance paused
                </Text>
              )}
            </View>

            {/* Progress Bar */}
            <View style={{
              height: 6,
              backgroundColor: theme.border,
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <View style={{
                height: '100%',
                width: `${(currentClassInfo.elapsedSeconds / currentClassInfo.totalSeconds) * 100}%`,
                backgroundColor: isRunning ? '#22c55e' : theme.primary,
              }} />
            </View>
          </View>
        )}

        {!currentClassInfo && (
          <View style={{
            marginTop: 10,
            width: '100%',
            maxWidth: 400,
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            padding: 14,
            borderWidth: 2,
            borderColor: theme.border,
          }}>
            <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>
              🏖️ It's a leave
            </Text>
          </View>
        )}

        {/* Today's Attendance Summary */}
        {todayAttendance.lectures.length > 0 && (
          <View style={{
            marginTop: 10,
            width: '100%',
            maxWidth: 400,
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            padding: 14,
            borderWidth: 2,
            borderColor: theme.border,
          }}>
            <Text style={{ color: theme.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
              📊 Today's Attendance
            </Text>

            {/* Overall Stats */}
            <View style={{
              backgroundColor: todayAttendance.dayPresent ? '#22c55e20' : '#ef444420',
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: todayAttendance.dayPresent ? '#22c55e' : '#ef4444'
            }}>
              <Text style={{
                color: todayAttendance.dayPresent ? '#22c55e' : '#ef4444',
                fontSize: 13,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {todayAttendance.dayPresent ? '✅ Present' : '❌ Absent'} • {todayAttendance.dayPercentage}%
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 3 }}>
                {todayAttendance.totalAttended} min attended / {todayAttendance.totalClassTime} min total
              </Text>
            </View>

            {/* Per Lecture Breakdown */}
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
              Lectures:
            </Text>
            {todayAttendance.lectures.map((lecture, index) => (
              <View key={index} style={{
                backgroundColor: theme.background,
                borderRadius: 6,
                padding: 8,
                marginBottom: 6,
                borderLeftWidth: 3,
                borderLeftColor: lecture.present ? '#22c55e' : '#ef4444'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600', flex: 1 }}>
                    {lecture.subject}
                  </Text>
                  <Text style={{
                    color: lecture.present ? '#22c55e' : '#ef4444',
                    fontSize: 11,
                    fontWeight: 'bold'
                  }}>
                    {lecture.present ? '✓' : '✗'} {lecture.percentage}%
                  </Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 2 }}>
                  {lecture.attended} min / {lecture.total} min • {lecture.startTime}-{lecture.endTime}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Overall Attendance Stats */}
        {(() => {
          const stats = getAttendanceStats();
          return stats.totalDays > 0 && (
            <View style={{
              marginTop: 10,
              width: '100%',
              maxWidth: 400,
              backgroundColor: theme.cardBackground,
              borderRadius: 12,
              padding: 14,
              borderWidth: 2,
              borderColor: theme.border,
            }}>
              <Text style={{ color: theme.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                📈 Overall Attendance
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Days Attended:</Text>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>
                  {stats.presentDays} / {stats.totalDays}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Attendance:</Text>
                <Text style={{
                  color: stats.attendancePercentage >= 75 ? '#22c55e' : '#ef4444',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  {stats.attendancePercentage}%
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Quick Stats */}
        <View style={{
          marginTop: 5,
          width: '100%',
          maxWidth: 400,
          backgroundColor: theme.cardBackground,
          borderRadius: 12,
          padding: 14,
          borderWidth: 2,
          borderColor: theme.border,
        }}>
          <Text style={{ color: theme.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
            📊 Session Info
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Total Duration:</Text>
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>
              {formatTime(config?.studentScreen?.timer?.duration || 120)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Time Remaining:</Text>
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>
              {formatTime(timeLeft)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Progress:</Text>
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>
              {Math.round(((config?.studentScreen?.timer?.duration || 120) - timeLeft) / (config?.studentScreen?.timer?.duration || 120) * 100)}%
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      {showProfile && (
        <Modal
          transparent={true}
          visible={showProfile}
          animationType="fade"
          onRequestClose={() => setShowProfile(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.profileModalContent, {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              transform: [{ scale: profileScaleAnim }]
            }]}>
              <ScrollView>
                {/* Header */}
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.primary }]}>👤 Profile</Text>
                  <TouchableOpacity onPress={() => setShowProfile(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Profile Avatar */}
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <View style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: theme.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 4,
                    borderColor: theme.border,
                    marginBottom: 15,
                    overflow: 'hidden',
                  }}>
                    {userData?.photoUrl ? (
                      <Image
                        source={{ uri: userData.photoUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        onError={(e) => console.log('❌ Student profile modal photo error:', e.nativeEvent.error)}
                        onLoad={() => console.log('✅ Student profile modal photo loaded')}
                      />
                    ) : (
                      <Text style={{ fontSize: 48, color: isDarkTheme ? '#0a1628' : '#ffffff', fontWeight: 'bold' }}>
                        {getInitials(userData?.name || studentName || 'User')}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
                    {userData?.name || studentName || 'User'}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 5 }}>
                    🎓 Student
                  </Text>
                </View>

                {/* Profile Information */}
                <View style={[styles.detailSection, { borderBottomColor: theme.border + '40' }]}>
                  <Text style={[styles.sectionTitle, { color: theme.primary }]}>📋 Personal Information</Text>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.name || studentName || 'N/A'}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Enrollment No:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.enrollmentNo || loginId || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Course:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.course || branch || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Semester:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{userData?.semester || semester || 'N/A'}</Text>
                  </View>
                  {userData?.email && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{userData.email}</Text>
                    </View>
                  )}
                  {userData?.phone && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{userData.phone}</Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={{ padding: 20 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowProfile(false);
                      setTimeout(() => handleLogout(), 300);
                    }}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isDarkTheme ? '#ff4444' : '#dc2626',
                      paddingVertical: 15,
                      paddingHorizontal: 30,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                      🚪 Logout
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Face Verification Modal */}
      {showFaceVerification && (
        <Modal
          visible={showFaceVerification}
          animationType="slide"
          onRequestClose={() => setShowFaceVerification(false)}
        >
          <FaceVerificationScreen
            userId={studentId}
            onVerificationSuccess={handleVerificationSuccess}
            onVerificationFailed={handleVerificationFailed}
            onCancel={() => setShowFaceVerification(false)}
            theme={theme}
            isDarkTheme={isDarkTheme}
          />
        </Modal>
      )}

      {/* Lanyard Card */}
      <LanyardCard
        visible={showLanyard}
        onClose={() => setShowLanyard(false)}
        userData={userData}
        theme={theme}
        onOpenFullProfile={() => {
          setShowLanyard(false);
          setTimeout(() => setShowProfile(true), 300);
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        theme={theme}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={selectedRole}
        notificationBadge={notificationBadge}
      />
    </View>
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
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
  profileModalContent: {
    backgroundColor: '#0d1f3c',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
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
