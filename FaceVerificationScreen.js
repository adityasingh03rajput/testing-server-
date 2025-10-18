import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { getCachedPhoto } from './FaceVerification';
import { initializeFaceAPI, detectFacePresence } from './OfflineFaceVerification';

export default function FaceVerificationScreen({
  userId,
  onVerificationSuccess,
  onVerificationFailed,
  onCancel,
  theme,
  isDarkTheme
}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [verificationMessage, setVerificationMessage] = useState('Loading...');
  const [cachedPhoto, setCachedPhoto] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        // Request camera permission
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        // Initialize face-api.js models
        setVerificationMessage('📦 Loading AI models...');
        const modelsLoaded = await initializeFaceAPI();
        if (!modelsLoaded) {
          setVerificationMessage('⚠️ Failed to load face detection models');
          return;
        }

        // Get user's photo URL from server
        setVerificationMessage('📷 Loading reference photo...');
        try {
          const response = await fetch(`http://192.168.107.31:3000/api/students`);
          const data = await response.json();

          if (data.success && data.students) {
            const student = data.students.find(s => s._id === userId);
            if (student && student.photoUrl) {
              setCachedPhoto(student.photoUrl);
              console.log('✅ Got photo URL:', student.photoUrl);
            } else {
              setVerificationMessage('⚠️ No reference photo found. Please upload your photo via admin panel.');
              return;
            }
          } else {
            setVerificationMessage('⚠️ Could not load student data.');
            return;
          }
        } catch (error) {
          console.log('❌ Error loading photo:', error);
          setVerificationMessage('⚠️ Could not load reference photo.');
          return;
        }

        setVerificationMessage('✅ Ready! Position your face in the frame');
        setIsInitializing(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setVerificationMessage('❌ Initialization failed: ' + error.message);
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isVerifying) {
      // Auto capture after countdown
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

    setVerificationMessage('📸 Capturing...');

    try {
      // Capture photo (temporary, will be deleted after upload)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setVerificationMessage('🔍 Verifying with server...');

      // Use server-side face verification
      const { verifyFaceOffline } = require('./OfflineFaceVerification');
      const result = await verifyFaceOffline(photo.uri, cachedPhoto, userId);

      // Delete captured photo immediately after verification
      try {
        await FileSystem.deleteAsync(photo.uri, { idempotent: true });
        console.log('🗑️ Temporary photo deleted');
      } catch (err) {
        console.log('Could not delete temp photo:', err);
      }

      console.log('📊 Verification result:', JSON.stringify(result));

      if (result.success && result.match) {
        setVerificationMessage(`✅ Verified! (${result.confidence}% confidence)`);
        setTimeout(() => {
          onVerificationSuccess(result);
        }, 1000);
      } else {
        const message = result.message || '❌ Face does not match';
        console.log('❌ Verification failed:', message);
        setVerificationMessage(message);
        setTimeout(() => {
          setIsVerifying(false);
          setVerificationMessage('Position your face in the frame');
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
        <Text style={[styles.text, { color: theme.text }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.text, { color: theme.text }]}>Camera permission denied</Text>
        <TouchableOpacity onPress={onCancel} style={[styles.button, { backgroundColor: theme.primary }]}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        >
          {/* Face Frame Overlay */}
          <View style={styles.overlay}>
            <View style={[styles.faceFrame, isVerifying && styles.faceFrameActive]} />
            {countdown > 0 && (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      {/* Reference Photo */}
      {cachedPhoto && (
        <View style={styles.referenceContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Reference Photo:</Text>
          <Image
            source={{ uri: cachedPhoto }}
            style={styles.referencePhoto}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Status Message */}
      <View style={[styles.messageContainer, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.message, { color: theme.text }]}>
          {verificationMessage}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={startVerification}
          disabled={isInitializing || isVerifying || !cachedPhoto}
          style={[
            styles.verifyButton,
            { backgroundColor: (!isInitializing && !isVerifying && cachedPhoto) ? theme.primary : '#666' }
          ]}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isInitializing ? 'Initializing...' : '✓ Verify Face'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCancel}
          style={[styles.cancelButton, { borderColor: theme.border }]}
        >
          <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
          • Look directly at the camera
        </Text>
        <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
          • Ensure good lighting
        </Text>
        <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
          • Remove glasses if possible
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  cameraContainer: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 250,
    height: 300,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 150,
    opacity: 0.5,
  },
  faceFrameActive: {
    borderColor: '#00ff88',
    opacity: 1,
  },
  countdownOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  referenceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  referencePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#00d9ff',
  },
  messageContainer: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
});
