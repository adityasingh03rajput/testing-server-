import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FluidSplashScreen = ({ onFinish }) => {
  const [particles, setParticles] = useState([]);
  const animationRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initialize particles from text "letsbunk"
    const initParticles = () => {
      const newParticles = [];
      const colors = ['#00d9ff', '#00f0ff', '#ffffff', '#0099cc', '#66e0ff'];
      
      // Create particles in a text-like pattern
      // Simplified grid pattern for "letsbunk"
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 2;
      const textWidth = 280;
      const textHeight = 80;
      const gap = 4;

      for (let y = -textHeight / 2; y < textHeight / 2; y += gap) {
        for (let x = -textWidth / 2; x < textWidth / 2; x += gap) {
          // Create a rough text shape (you can refine this)
          const shouldCreate = Math.random() > 0.3;
          
          if (shouldCreate) {
            newParticles.push({
              id: `${x}-${y}`,
              x: centerX + x + (Math.random() - 0.5) * 200,
              y: centerY + y + (Math.random() - 0.5) * 200,
              targetX: centerX + x,
              targetY: centerY + y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              radius: 1 + Math.random() * 1.5,
              color: colors[Math.floor(Math.random() * colors.length)],
              opacity: new Animated.Value(0),
            });
          }
        }
      }

      return newParticles;
    };

    const initialParticles = initParticles();
    setParticles(initialParticles);

    // Fade in particles
    initialParticles.forEach((particle, index) => {
      Animated.timing(particle.opacity, {
        toValue: 1,
        duration: 800,
        delay: index * 2,
        useNativeDriver: true,
      }).start();
    });

    // Animate particles
    let frame = 0;
    const animate = () => {
      frame++;
      
      setParticles(prevParticles =>
        prevParticles.map(particle => {
          // Spring-like attraction to target
          const tdx = particle.targetX - particle.x;
          const tdy = particle.targetY - particle.y;
          const distance = Math.sqrt(tdx * tdx + tdy * tdy);

          if (distance > 1) {
            const returnForce = 0.03;
            const springForce = distance * returnForce;
            particle.vx += (tdx / distance) * springForce;
            particle.vy += (tdy / distance) * springForce;
          }

          // Apply friction
          particle.vx *= 0.92;
          particle.vy *= 0.92;

          // Update position
          const newX = particle.x + particle.vx;
          const newY = particle.y + particle.vy;

          return {
            ...particle,
            x: newX,
            y: newY,
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 3000);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(timer);
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <G>
          {particles.map((particle) => (
            <Circle
              key={particle.id}
              cx={particle.x}
              cy={particle.y}
              r={particle.radius}
              fill={particle.color}
              opacity={0.9}
            />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0e1a',
    zIndex: 9999,
  },
});

export default FluidSplashScreen;
