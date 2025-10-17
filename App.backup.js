import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.107.31:3000/api/config';
const CACHE_KEY = '@timer_config';
const ROLE_KEY = '@user_role';

const getDefaultConfig = () => ({
  roleSelection: {
    backgroundColor: '#1a1a2e',
    title: { text: 'Who are you?', fontSize: 36, color: '#eee', fontWeight: 'bold' },
    subtitle: { text: 'Select your role to continue', fontSize: 16, color: '#aaa' },
    roles: [
      { id: 'student', text: 'Student', icon: '🎓', backgroundColor: '#e94560', textColor: '#fff' },
      { id: 'teacher', text: 'Teacher', icon: '👨‍🏫', backgroundColor: '#533483', textColor: '#fff' }
    ]
  },
  studentScreen: {
    backgroundColor: '#1a1a2e',
    title: { text: 'Countdown Timer', fontSize: 32, color: '#eee', fontWeight: 'bold' },
    timer: { duration: 120, backgroundColor: '#16213e', textColor: '#0f3460', fontSize: 72, borderRadius: 20 },
    buttons: [
      { id: 'startPause', text: 'START', pauseText: 'PAUSE', backgroundColor: '#e94560', textColor: '#fff', fontSize: 18 },
      { id: 'reset', text: 'RESET', backgroundColor: '#533483', textColor: '#fff', fontSize: 18 }
    ]
  },
  teacherScreen: {
    backgroundColor: '#1a1a2e',
    greeting: { text: 'Hello Sir', fontSize: 48, color: '#eee', fontWeight: 'bold' },
    subtitle: { text: 'Welcome back!', fontSize: 24, color: '#aaa' }
  }
});

export default function App() {
  const [config, setConfig] = useState(getDefaultConfig());
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const cachedRole = await AsyncStorage.getItem(ROLE_KEY);
      if (cachedRole) {
        setSelectedRole(cachedRole);
      }

      const cachedConfig = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedConfig) {
        const parsedConfig = JSON.parse(cachedConfig);
        setConfig(parsedConfig);
        if (cachedRole === 'student' && parsedConfig.studentScreen) {
          setTimeLeft(parsedConfig.studentScreen.timer.duration);
        }
      }
      
      setLoading(false);
      await fetchConfig();
    } catch (error) {
      console.error('Failed to load config:', error);
      setLoading(false);
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
      console.error('Failed to fetch config from server:', error);
    }
  };

  const handleRoleSelect = async (role) => {
    await AsyncStorage.setItem(ROLE_KEY, role);
    setSelectedRole(role);
    if (role === 'student' && config && config.studentScreen) {
      setTimeLeft(config.studentScreen.timer.duration);
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => setIsRunning(!isRunning);
  
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(config?.studentScreen?.timer?.duration || 120);
    clearInterval(intervalRef.current);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#1a1a2e' }]}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={{ color: '#eee', marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  // Role Selection Screen
  if (!selectedRole && config.roleSelection) {
    const roleConfig = config.roleSelection;
    return (
      <View style={[styles.container, { backgroundColor: roleConfig.backgroundColor }]}>
        <StatusBar style="light" />
        <Text style={{
          fontSize: roleConfig.title.fontSize,
          fontWeight: roleConfig.title.fontWeight,
          color: roleConfig.title.color,
          marginBottom: 10,
        }}>
          {roleConfig.title.text}
        </Text>
        <Text style={{
          fontSize: roleConfig.subtitle.fontSize,
          color: roleConfig.subtitle.color,
          marginBottom: 60,
        }}>
          {roleConfig.subtitle.text}
        </Text>
        
        <View style={styles.roleContainer}>
          {roleConfig.roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.roleButton, { backgroundColor: role.backgroundColor }]}
              onPress={() => handleRoleSelect(role.id)}
            >
              <Text style={styles.roleIcon}>{role.icon}</Text>
              <Text style={[styles.roleText, { color: role.textColor }]}>
                {role.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // Teacher Screen
  if (selectedRole === 'teacher' && config.teacherScreen) {
    const teacherConfig = config.teacherScreen;
    return (
      <View style={[styles.container, { backgroundColor: teacherConfig.backgroundColor }]}>
        <StatusBar style="light" />
        <Text style={{
          fontSize: teacherConfig.greeting.fontSize,
          fontWeight: teacherConfig.greeting.fontWeight,
          color: teacherConfig.greeting.color,
          marginBottom: 20,
        }}>
          {teacherConfig.greeting.text}
        </Text>
        <Text style={{
          fontSize: teacherConfig.subtitle.fontSize,
          color: teacherConfig.subtitle.color,
        }}>
          {teacherConfig.subtitle.text}
        </Text>
      </View>
    );
  }

  // Student Timer Screen
  if (selectedRole === 'student' && config.studentScreen) {
    const screen = config.studentScreen;
    const startPauseBtn = screen.buttons.find(b => b.id === 'startPause');
    const resetBtn = screen.buttons.find(b => b.id === 'reset');

    return (
      <View style={[styles.container, { backgroundColor: screen.backgroundColor }]}>
        <StatusBar style="light" />
        <Text style={{
          fontSize: screen.title.fontSize,
          fontWeight: screen.title.fontWeight,
          color: screen.title.color,
          marginBottom: 50,
        }}>
          {screen.title.text}
        </Text>

        <View style={{
          backgroundColor: screen.timer.backgroundColor,
          borderRadius: screen.timer.borderRadius,
          padding: 40,
          marginBottom: 50,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 8,
        }}>
          <Text style={{
            fontSize: screen.timer.fontSize,
            fontWeight: 'bold',
            color: screen.timer.textColor,
            fontVariant: ['tabular-nums'],
          }}>
            {formatTime(timeLeft)}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: startPauseBtn.backgroundColor }]}
            onPress={handleStartPause}
          >
            <Text style={[styles.buttonText, {
              color: startPauseBtn.textColor,
              fontSize: startPauseBtn.fontSize
            }]}>
              {isRunning ? startPauseBtn.pauseText : startPauseBtn.text}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: resetBtn.backgroundColor }]}
            onPress={handleReset}
          >
            <Text style={[styles.buttonText, {
              color: resetBtn.textColor,
              fontSize: resetBtn.fontSize
            }]}>
              {resetBtn.text}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Fallback
  return (
    <View style={[styles.container, { backgroundColor: '#1a1a2e' }]}>
      <Text style={{ color: '#eee' }}>Something went wrong</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  roleIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  roleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
});
