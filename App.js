import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator,
  Animated, TextInput, ScrollView, FlatList
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
  
  // Login states
  const [showLogin, setShowLogin] = useState(true);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

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

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

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
      const cachedRole = await AsyncStorage.getItem(ROLE_KEY);
      const cachedStudentId = await AsyncStorage.getItem(STUDENT_ID_KEY);
      const cachedStudentName = await AsyncStorage.getItem(STUDENT_NAME_KEY);

      if (cachedRole) {
        setSelectedRole(cachedRole);
        if (cachedRole === 'student' && cachedStudentId && cachedStudentName) {
          setStudentId(cachedStudentId);
          setStudentName(cachedStudentName);
          setShowNameInput(false);
        } else if (cachedRole === 'student') {
          setShowNameInput(true);
        }
      }

      const cachedConfig = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedConfig) {
        setConfig(JSON.parse(cachedConfig));
      }

      fetchConfig();
      if (cachedRole === 'teacher') {
        fetchStudents();
      }
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

  const updateTimerOnServer = (timer, running, status = null) => {
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
        }
        
        await AsyncStorage.setItem(ROLE_KEY, data.user.role);
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
    await AsyncStorage.removeItem(ROLE_KEY);
    await AsyncStorage.removeItem(STUDENT_NAME_KEY);
    await AsyncStorage.removeItem(STUDENT_ID_KEY);
  };

  // Teacher Dashboard
  if (selectedRole === 'teacher') {
    const teacherConfig = config?.teacherScreen || getDefaultConfig().teacherScreen;
    const canEditTimetable = userData?.canEditTimetable || false;
    
    return (
      <Animated.View style={[styles.container, { backgroundColor: teacherConfig?.backgroundColor || '#0a1628', opacity: fadeAnim }]}>
        <StatusBar style="light" />
        
        {/* Teacher Info Header */}
        <View style={styles.teacherHeader}>
          <View>
            <Text style={[styles.glowText, {
              fontSize: teacherConfig?.title?.fontSize || 32,
              color: teacherConfig?.title?.color || '#00f5ff',
            }]}>
              {teacherConfig?.title?.text || 'Live Attendance'}
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#00d9ff',
              marginTop: 5,
            }}>
              👨‍🏫 {userData?.name || 'Teacher'}
            </Text>
            <Text style={{
              fontSize: 14,
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

        <Text style={{
          fontSize: teacherConfig?.subtitle?.fontSize || 16,
          color: teacherConfig?.subtitle?.color || '#00d9ff',
          marginBottom: 15,
          textAlign: 'center',
        }}>
          {teacherConfig?.subtitle?.text || 'Real-time student tracking'}
        </Text>

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
          <View style={{
            backgroundColor: canEditTimetable ? '#00bfff' : '#00d9ff80',
            paddingVertical: 15,
            paddingHorizontal: 30,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: '#00bfff',
            shadowOpacity: 0.5,
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
          </View>
        </TouchableOpacity>

        {/* Student List */}
        <ScrollView style={styles.studentList} contentContainerStyle={styles.studentListContent}>
          {students.map((student) => (
            <Animated.View
              key={student._id}
              style={[styles.studentCard, {
                backgroundColor: teacherConfig?.cardBackgroundColor || '#0d1f3c',
                borderColor: teacherConfig?.cardBorderColor || '#00d9ff',
                shadowColor: teacherConfig?.statusColors?.[student.status] || '#00d9ff',
                shadowOpacity: glowOpacity,
                shadowRadius: 15,
              }]}
            >
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>{student.name}</Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: teacherConfig?.statusColors?.[student.status] || '#00d9ff'
                }]}>
                  <Text style={styles.statusText}>{student.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.timerText}>{formatTime(student.timerValue)}</Text>
            </Animated.View>
          ))}
          {students.length === 0 && (
            <Text style={styles.emptyText}>No students attending yet</Text>
          )}
        </ScrollView>
      </Animated.View>
    );
  }

  // Student Timer Screen
  const screen = config?.studentScreen || getDefaultConfig().studentScreen;
  const startPauseBtn = screen?.buttons?.[0] || getDefaultConfig().studentScreen.buttons[0];
  const resetBtn = screen?.buttons?.[1] || getDefaultConfig().studentScreen.buttons[1];

  return (
    <Animated.View style={[styles.container, { backgroundColor: screen?.backgroundColor || '#0a1628', opacity: fadeAnim }]}>
      <StatusBar style="light" />
      
      {/* Logout Button for Student */}
      <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, { position: 'absolute', top: 40, right: 20, zIndex: 10 }]}>
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
    marginBottom: 10,
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
