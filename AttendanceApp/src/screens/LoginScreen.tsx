import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../store';
import { loginUser, loadStoredAuth, enableBiometric } from '../store/slices/authSlice';
import { Button, Card, Input, toastManager } from '../components/ui';
import { colors, typography, spacing, shadows } from '../theme';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated, biometricEnabled } = useSelector(
    (state: RootState) => state.auth
  );

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && biometricEnabled && biometricAvailable) {
      handleBiometricAuth();
    }
  }, [isAuthenticated, biometricEnabled, biometricAvailable]);

  useEffect(() => {
    if (error) {
      toastManager.error('Login Failed', error);
    }
  }, [error]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.warn('Biometric check failed:', error);
    }
  };

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      toastManager.error('Validation Error', 'Please fix the errors below');
      return;
    }

    try {
      await dispatch(loginUser({ username: username.trim(), password })).unwrap();
      toastManager.success('Welcome!', 'Login successful');
    } catch (error: any) {
      // Error is handled by useEffect above
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Let\'s Bunk',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        toastManager.success('Welcome!', 'Biometric authentication successful');
      }
    } catch (error) {
      console.warn('Biometric authentication error:', error);
      toastManager.error('Authentication Failed', 'Biometric authentication failed');
    }
  };

  const toggleBiometric = async () => {
    if (!biometricAvailable) {
      toastManager.warning(
        'Biometric Not Available',
        'Please set up fingerprint or face recognition in your device settings'
      );
      return;
    }

    try {
      await dispatch(enableBiometric(!biometricEnabled)).unwrap();
      toastManager.success(
        'Biometric Authentication',
        `Biometric authentication ${!biometricEnabled ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      toastManager.error('Error', 'Failed to update biometric settings');
    }
  };

  const fillDemoCredentials = (role: 'student' | 'teacher' | 'admin') => {
    const credentials = {
      student: { username: 'student', password: 'student123' },
      teacher: { username: 'teacher', password: 'teacher123' },
      admin: { username: 'admin', password: 'admin123' },
    };

    setUsername(credentials[role].username);
    setPassword(credentials[role].password);
    setErrors({});
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoEmoji}>📚</Text>
              </View>
            </View>
            <Text style={styles.title}>Let's Bunk</Text>
            <Text style={styles.subtitle}>Attendance Management System</Text>
          </View>

          {/* Login Form */}
          <Card variant="elevated" padding="large" style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>

            <View style={styles.form}>
              <Input
                label="Username"
                placeholder="Enter your username or email"
                value={username}
                onChangeText={setUsername}
                error={errors.username}
                leftIcon="person"
                autoCapitalize="none"
                autoCorrect={false}
                required
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                leftIcon="lock-closed"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                required
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                fullWidth
                size="large"
                style={styles.loginButton}
              />

              {/* Biometric Authentication */}
              {biometricAvailable && (
                <View style={styles.biometricSection}>
                  <TouchableOpacity
                    style={styles.biometricToggle}
                    onPress={toggleBiometric}
                  >
                    <Ionicons
                      name={biometricEnabled ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={colors.primary[600]}
                    />
                    <Text style={styles.biometricText}>
                      Enable Biometric Authentication
                    </Text>
                  </TouchableOpacity>

                  {biometricEnabled && (
                    <Button
                      title="Use Biometric"
                      onPress={handleBiometricAuth}
                      variant="outline"
                      icon="finger-print"
                      fullWidth
                      style={styles.biometricButton}
                    />
                  )}
                </View>
              )}
            </View>
          </Card>

          {/* Demo Accounts */}
          <Card variant="outlined" padding="medium" style={styles.demoCard}>
            <Text style={styles.demoTitle}>Demo Accounts</Text>
            <Text style={styles.demoSubtitle}>
              Try the app with these demo credentials:
            </Text>

            <View style={styles.demoButtons}>
              <Button
                title="Student"
                onPress={() => fillDemoCredentials('student')}
                variant="outline"
                size="small"
                icon="school"
                style={styles.demoButton}
              />
              <Button
                title="Teacher"
                onPress={() => fillDemoCredentials('teacher')}
                variant="outline"
                size="small"
                icon="person"
                style={styles.demoButton}
              />
              <Button
                title="Admin"
                onPress={() => fillDemoCredentials('admin')}
                variant="outline"
                size="small"
                icon="settings"
                style={styles.demoButton}
              />
            </View>
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.linkText}>Contact Administrator</Text>
            </Text>
            <Text style={styles.versionText}>
              Secure • Reliable • Modern
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  form: {
    gap: spacing.md,
  },
  loginButton: {
    marginTop: spacing.lg,
  },
  biometricSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.md,
  },
  biometricToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  biometricText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  biometricButton: {
    marginTop: spacing.sm,
  },
  demoCard: {
    marginBottom: spacing.xl,
  },
  demoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  demoSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  demoButton: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  linkText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
  versionText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default LoginScreen;