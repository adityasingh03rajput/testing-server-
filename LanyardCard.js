import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ScrollView
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LanyardCard({ 
  visible, 
  onClose, 
  userData, 
  theme,
  onOpenFullProfile 
}) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Drop down animation
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Swing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(swingAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(swingAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Subtle rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Pull up animation
      Animated.spring(slideAnim, {
        toValue: -300,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const swingInterpolate = swingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 5],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.lanyardContainer}>
          {/* Lanyard String */}
          <Animated.View
            style={[
              styles.lanyardString,
              {
                transform: [
                  { translateY: slideAnim },
                  { translateX: swingInterpolate },
                ],
              },
            ]}
          >
            <View style={[styles.stringLine, { backgroundColor: theme.primary }]} />
            <View style={[styles.stringLine, { backgroundColor: theme.primary }]} />
          </Animated.View>

          {/* ID Card */}
          <Animated.View
            style={[
              styles.cardContainer,
              {
                transform: [
                  { translateY: slideAnim },
                  { translateX: swingInterpolate },
                  { rotate: rotateInterpolate },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={(e) => {
                e.stopPropagation();
              }}
              onLongPress={onOpenFullProfile}
              delayLongPress={500}
            >
              <View style={[styles.card, { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.primary,
              }]}>
                {/* Card Header */}
                <View style={[styles.cardHeader, { backgroundColor: theme.primary }]}>
                  <Text style={styles.cardHeaderText}>STUDENT ID CARD</Text>
                </View>

                {/* Photo */}
                <View style={styles.photoContainer}>
                  {userData?.photoUrl ? (
                    <Image 
                      source={{ uri: userData.photoUrl }} 
                      style={styles.photo}
                    />
                  ) : (
                    <View style={[styles.photoPlaceholder, { backgroundColor: theme.primary }]}>
                      <Text style={styles.photoPlaceholderText}>
                        {getInitials(userData?.name)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.infoContainer}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {userData?.name || 'Student Name'}
                  </Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>ID:</Text>
                    <Text style={[styles.value, { color: theme.text }]}>
                      {userData?.enrollmentNo || 'N/A'}
                    </Text>
                  </View>

                  {userData?.role === 'student' && (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Course:</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                          {userData?.course || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Sem:</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                          {userData?.semester || 'N/A'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    Long press for details
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  lanyardContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  lanyardString: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: -10,
  },
  stringLine: {
    width: 4,
    height: 100,
    borderRadius: 2,
  },
  cardContainer: {
    width: 280,
  },
  card: {
    borderRadius: 16,
    borderWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  cardHeader: {
    padding: 12,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  photoPlaceholderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
});
