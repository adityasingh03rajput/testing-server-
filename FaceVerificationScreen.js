import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { initializeFaceAPI } from './OfflineFaceVerification';
import { CheckIcon, XIcon, SunIcon, UserIcon } from './Icons';
import { getServerTime } from './ServerTime';

export default function FaceVerificationScreen({
  userId,
  onVerificationSuccess,
  onVerificationFailed,
  onCancel,
  theme,
}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [verificationMessage, setVerificationMessage] = useState('Loading...');
  const [cachedPhoto, setCachedPhoto] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const cameraRef = useRef(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for face frame
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Request camera permission
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        // Initialize face-api.js models
        setVerificationMessage('Loading AI models...');
        const modelsLoaded = await initializeFaceAPI();
        if (!modelsLoaded) {
          setVerificationMessage('Failed to load face detection models');
          return;
        }

        // Check if user has reference photo on server
        setVerificationMessage('Checking reference photo...');
        try {
          console.log('🔍 Verifying reference photo exists for:', userId);

          const response = await fetch(
            `https://google-8j5x.onrender.com/api/student-management?enrollmentNo=${userId}`
          );

          const data = await response.json();

          if (data.success && data.student) {
            if (data.student.photoUrl) {
              console.log('✅ Reference photo exists on server');
              // We don't need to download it - server will use it during verification
              setCachedPhoto('server'); // Just a flag to indicate photo exists
              setVerificationMessage('Ready! Position your face');
            } else {
              console.log('⚠️ No reference photo found');
              setVerificationMessage('❌ No reference photo found. Please upload your photo in the admin panel first.');
              setIsInitializing(false);
              return;
            }
          } else {
            console.log('⚠️ Student not found:', userId);
            setVerificationMessage('❌ Student not found. Please check your enrollment number.');
            setIsInitializing(false);
            return;
          }
        } catch (error) {
          console.log('❌ Error checking reference photo:', error);
          setVerificationMessage('❌ Network error. Please check your connection.');
          setIsInitializing(false);
          return;
        }

        setVerificationMessage('Ready! Position your face');
        setIsInitializing(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setVerificationMessage('Initialization failed');
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isVerifying) {
      performCapture();
    }
  }, [countdown, isVerifying]);

  const startVerification = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setCountdown(3);
    setVerificationMessage('Get ready...');
  };

  const performCapture = async () => {
    if (!cameraRef.current) return;

    setVerificationMessage('Capturing...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setVerificationMessage('Verifying with server...');

      // Server-side verification - only send captured photo and userId
      const { verifyFaceOffline } = require('./OfflineFaceVerification');
      const result = await verifyFaceOffline(photo.uri, null, userId);

      // Clean up captured photo
      try {
        await FileSystem.deleteAsync(photo.uri, { idempotent: true });
      } catch (err) {
        console.log('Could not delete temp photo:', err);
      }

      if (result.success && result.match) {
        setVerificationMessage(`✅ Verified! ${result.confidence}%`);
        setTimeout(() => {
          onVerificationSuccess(result);
        }, 1000);
      } else {
        const message = result.message || 'Face does not match';
        setVerificationMessage(`❌ ${message}`);
        setTimeout(() => {
          setIsVerifying(false);
          setVerificationMessage('Ready! Position your face');
        }, 2000);
        onVerificationFailed(result);
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationMessage('❌ Verification error. Try again.');
      setIsVerifying(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Requesting camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📷</Text>
          <Text style={[styles.errorText, { color: theme.text }]}>Camera Access Required</Text>
          <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>
            Please enable camera permissions in settings
          </Text>
          <TouchableOpacity onPress={onCancel} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Face Verification</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Position your face within the circle
        </Text>
      </View>

      {/* Camera View with Modern Frame */}
      <View style={styles.cameraWrapper}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          >
            {/* Gradient Overlay */}
            <View style={styles.gradientOverlay}>
              {/* Animated Face Frame */}
              <Animated.View
                style={[
                  styles.faceFrame,
                  {
                    transform: [{ scale: isVerifying ? 1 : pulseAnim }],
                    borderColor: isVerifying ? '#00ff88' : '#fff',
                    shadowColor: isVerifying ? '#00ff88' : '#fff',
                  }
                ]}
              />

              {/* Countdown */}
              {countdown > 0 && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
              )}

              {/* Corner Markers */}
              <View style={styles.cornerMarkers}>
                <View style={[styles.cornerTL, { borderColor: isVerifying ? '#00ff88' : '#fff' }]} />
                <View style={[styles.cornerTR, { borderColor: isVerifying ? '#00ff88' : '#fff' }]} />
                <View style={[styles.cornerBL, { borderColor: isVerifying ? '#00ff88' : '#fff' }]} />
                <View style={[styles.cornerBR, { borderColor: isVerifying ? '#00ff88' : '#fff' }]} />
              </View>
            </View>
          </CameraView>
        </View>

        {/* Reference photo is securely stored on server - not displayed here */}
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.statusIconContainer}>
          {isVerifying ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : verificationMessage.includes('Ready') || verificationMessage.includes('Verified') ? (
            <CheckIcon size={24} color="#10b981" />
          ) : verificationMessage.includes('Failed') || verificationMessage.includes('error') ? (
            <XIcon size={24} color="#ef4444" />
          ) : (
            <View style={styles.statusDot} />
          )}
        </View>
        <Text style={[styles.statusText, { color: theme.text }]}>
          {verificationMessage}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          onPress={startVerification}
          disabled={isInitializing || isVerifying || !cachedPhoto}
          style={[
            styles.verifyButton,
            {
              backgroundColor: (!isInitializing && !isVerifying && cachedPhoto) ? theme.primary : '#666',
              opacity: (!isInitializing && !isVerifying && cachedPhoto) ? 1 : 0.5,
            }
          ]}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <CheckIcon size={20} color="#fff" />
              <Text style={styles.verifyButtonText}>
                {isInitializing ? 'Initializing...' : 'Verify Face'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCancel}
          style={[styles.cancelButton, { borderColor: theme.border }]}
        >
          <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <View style={styles.tipRow}>
          <UserIcon size={20} color={theme.textSecondary} />
          <Text style={[styles.tipText, { color: theme.textSecondary }]}>
            Look directly at the camera
          </Text>
        </View>
        <View style={styles.tipRow}>
          <SunIcon size={20} color={theme.textSecondary} />
          <Text style={[styles.tipText, { color: theme.textSecondary }]}>
            Ensure good lighting
          </Text>
        </View>
        <View style={styles.tipRow}>
          <UserIcon size={20} color={theme.textSecondary} />
          <Text style={[styles.tipText, { color: theme.textSecondary }]}>
            Remove glasses if possible
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  cameraWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  cameraContainer: {
    width: '100%',
    height: 450,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  camera: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  faceFrame: {
    width: 280,
    height: 320,
    borderWidth: 4,
    borderRadius: 160,
    borderStyle: 'dashed',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 5,
  },
  cornerMarkers: {
    position: 'absolute',
    width: 300,
    height: 340,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 10,
  },
  countdownContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00ff88',
  },
  countdownText: {
    color: '#00ff88',
    fontSize: 60,
    fontWeight: 'bold',
  },
  referenceBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#00d9ff',
    elevation: 5,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  referenceBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 217, 255, 0.9)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  referenceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 18,
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  actionContainer: {
    gap: 12,
    marginBottom: 20,
  },
  verifyButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  verifyButtonIcon: {
    color: '#fff',
    fontSize: 20,
    marginRight: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fbbf24',
  },
  tipText: {
    fontSize: 15,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
