import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const FluidSimulationWebView = ({ visible, onClose, theme, studentId, socketUrl }) => {
  const longPressTimerRef = React.useRef(null);
  const gameActivatedRef = React.useRef(false);
  const webViewRef = React.useRef(null);

  const handlePressIn = () => {
    gameActivatedRef.current = false;
    // Start long press timer (2 seconds)
    longPressTimerRef.current = setTimeout(() => {
      gameActivatedRef.current = true;
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript('activateGameMode(); true;');
      }
    }, 2000);
  };

  const handlePressOut = () => {
    // Clear the timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    // Only close if game was NOT activated
    if (!gameActivatedRef.current) {
      onClose();
    }
    
    // Reset for next time
    gameActivatedRef.current = false;
  };

  const backgroundColor = theme.isDark ? '#0a0e1a' : '#0775ab';
  const colors = theme.isDark
    ? ['#00d9ff', '#00f0ff', '#ffffff', '#0099cc', '#66e0ff', '#33ccff']
    : ['#d97706', '#f59e0b', '#fbbf24', '#fb923c', '#ea580c', '#fdba74'];

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: ${backgroundColor};
      touch-action: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
    .hint {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      color: ${theme.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'};
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      text-align: center;
      pointer-events: none;
      animation: fadeInOut 3s ease-in-out infinite;
    }
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="hint">Touch and drag to interact</div>
  
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    
    let particles = [];
    let mouse = { x: 0, y: 0, isActive: false };
    let animationFrame;
    let isInitialized = false;
    let lastFrameTime = 0;
    let fps = 60;
    
    const colors = ${JSON.stringify(colors)};
    const bgColor = '${backgroundColor}';
    const fadeAlpha = ${theme.isDark ? '0.15' : '0.2'};
    
    // Adaptive performance based on device
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isLowEnd = isMobile && (navigator.hardwareConcurrency <= 4 || window.innerWidth < 400);
    const pixelRatio = isLowEnd ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const targetFPS = isLowEnd ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    
    function resizeCanvas() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      ctx.scale(pixelRatio, pixelRatio);
      
      if (!isInitialized) {
        initParticles();
        isInitialized = true;
      }
    }
    
    // Letter objects for game mode
    let letters = [];
    
    function initParticles() {
      particles = [];
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      const scale = Math.min(window.innerWidth, window.innerHeight) / 500;
      const fontSize = Math.floor(90 * scale);
      tempCanvas.width = 900;
      tempCanvas.height = 250;
      
      tempCtx.fillStyle = '#ffffff';
      tempCtx.font = 'bold ' + fontSize + 'px -apple-system, BlinkMacSystemFont, Arial, sans-serif';
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      tempCtx.fillText('letsbunk', tempCanvas.width / 2, tempCanvas.height / 2);
      
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const pixels = imageData.data;
      
      // Adaptive gap based on device capability
      const gap = isLowEnd ? 4 : (window.innerWidth < 400 ? 3 : 2);
      const maxParticles = isLowEnd ? 800 : 1500;
      let particleCount = 0;
      
      for (let y = 0; y < tempCanvas.height && particleCount < maxParticles; y += gap) {
        for (let x = 0; x < tempCanvas.width && particleCount < maxParticles; x += gap) {
          const index = (y * tempCanvas.width + x) * 4;
          const alpha = pixels[index + 3];
          
          if (alpha > 128) {
            const particleX = (x - tempCanvas.width / 2) * scale + window.innerWidth / 2;
            const particleY = (y - tempCanvas.height / 2) * scale + window.innerHeight / 2;
            
            particles.push({
              x: particleX,
              y: particleY,
              targetX: particleX,
              targetY: particleY,
              vx: 0,
              vy: 0,
              radius: isLowEnd ? 1.2 : (1 + Math.random() * 0.5),
              color: colors[Math.floor(Math.random() * colors.length)]
            });
            particleCount++;
          }
        }
      }
      
      // Create letter objects for game mode
      initLetters();
    }
    
    function initLetters() {
      const letterChars = ['l', 'e', 't', 's', 'b', 'u', 'n', 'k'];
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const letterSize = isLowEnd ? 50 : 60;
      const spacing = screenW / (letterChars.length + 1);
      
      letters = letterChars.map((char, i) => ({
        char: char,
        x: spacing * (i + 1),
        y: screenH * 0.3,
        vx: 0,
        vy: 0,
        size: letterSize,
        color: colors[i % colors.length],
        collected: false,
        mass: 1
      }));
    }
    
    function animate(currentTime) {
      // Frame rate limiting for low-end devices
      if (currentTime - lastFrameTime < frameInterval) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;
      
      // Optimized clear with fade
      ctx.globalAlpha = fadeAlpha;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalAlpha = 1;
      
      const maxDistance = isLowEnd ? 100 : 150;
      const maxDistanceSq = maxDistance * maxDistance;
      const useGlow = !isLowEnd;
      
      // Batch rendering setup
      if (useGlow) {
        ctx.shadowBlur = 10;
      }
      
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        
        // Mouse interaction with distance squared (faster)
        if (mouse.isActive) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distanceSq = dx * dx + dy * dy;
          
          if (distanceSq < maxDistanceSq) {
            const distance = Math.sqrt(distanceSq);
            const force = (1 - distance / maxDistance) * 4;
            const angle = Math.atan2(dy, dx);
            particle.vx -= Math.cos(angle) * force;
            particle.vy -= Math.sin(angle) * force;
          }
        }
        
        // Spring to target
        const tdx = particle.targetX - particle.x;
        const tdy = particle.targetY - particle.y;
        const targetDistanceSq = tdx * tdx + tdy * tdy;
        
        if (targetDistanceSq > 1) {
          const returnForce = 0.05;
          particle.vx += tdx * returnForce;
          particle.vy += tdy * returnForce;
        }
        
        // Friction
        particle.vx *= 0.88;
        particle.vy *= 0.88;
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Draw particle (batched for performance)
        if (useGlow) {
          ctx.shadowColor = particle.color;
        }
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      animationFrame = requestAnimationFrame(animate);
    }
    
    // Optimized event handlers
    function handleMove(x, y) {
      mouse.x = x;
      mouse.y = y;
      mouse.isActive = true;
    }
    
    function handleEnd() {
      mouse.isActive = false;
    }
    
    function handleGameStart(x, y) {
      if (!gameMode) return;
      
      const dx = x - striker.x;
      const dy = y - striker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < striker.radius + 20) {
        striker.isDragging = true;
        striker.dragStartX = x;
        striker.dragStartY = y;
      }
    }
    
    function handleGameMove(x, y) {
      if (!gameMode || !striker.isDragging) return;
      
      // Limit drag distance
      const maxDrag = isLowEnd ? 80 : 100;
      const dx = x - striker.dragStartX;
      const dy = y - striker.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > maxDrag) {
        const angle = Math.atan2(dy, dx);
        striker.x = striker.dragStartX + Math.cos(angle) * maxDrag;
        striker.y = striker.dragStartY + Math.sin(angle) * maxDrag;
      } else {
        striker.x = x;
        striker.y = y;
      }
    }
    
    function handleGameEnd() {
      if (!gameMode || !striker.isDragging) return;
      
      striker.isDragging = false;
      
      // Calculate launch velocity
      const dx = striker.dragStartX - striker.x;
      const dy = striker.dragStartY - striker.y;
      const power = isLowEnd ? 0.3 : 0.35;
      
      striker.vx = dx * power;
      striker.vy = dy * power;
    }
    
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        if (gameMode) {
          handleGameStart(x, y);
        } else {
          handleMove(x, y);
        }
      }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        if (gameMode) {
          handleGameMove(x, y);
        } else {
          handleMove(x, y);
        }
      }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (gameMode) {
        handleGameEnd();
      } else {
        handleEnd();
      }
    });
    
    canvas.addEventListener('touchcancel', (e) => {
      if (gameMode) {
        handleGameEnd();
      } else {
        handleEnd();
      }
    });
    
    canvas.addEventListener('mousedown', (e) => {
      if (gameMode) {
        handleGameStart(e.clientX, e.clientY);
      } else {
        handleMove(e.clientX, e.clientY);
      }
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (gameMode) {
        handleGameMove(e.clientX, e.clientY);
      } else if (e.buttons === 1) {
        handleMove(e.clientX, e.clientY);
      }
    });
    
    canvas.addEventListener('mouseup', (e) => {
      if (gameMode) {
        handleGameEnd();
      } else {
        handleEnd();
      }
    });
    
    canvas.addEventListener('mouseleave', (e) => {
      if (gameMode) {
        handleGameEnd();
      } else {
        handleEnd();
      }
    });
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 200);
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    });
    
    // Initialize
    resizeCanvas();
    requestAnimationFrame(animate);

    // ===== HIDDEN CARROM GAME MODE =====
    let gameMode = false;
    let gameStartTime = null;
    let collectedCount = 0;
    
    // Slingshot striker
    let striker = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: isLowEnd ? 20 : 25,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      homeX: 0,
      homeY: 0
    };

    function activateGameMode() {
      if (gameMode) return;
      
      gameMode = true;
      gameStartTime = Date.now();
      collectedCount = 0;
      
      // Reset letters
      letters.forEach(l => {
        l.collected = false;
        l.vx = 0;
        l.vy = 0;
      });
      
      // Position striker at bottom center
      striker.homeX = window.innerWidth / 2;
      striker.homeY = window.innerHeight - 150;
      striker.x = striker.homeX;
      striker.y = striker.homeY;
      striker.vx = 0;
      striker.vy = 0;
      striker.isDragging = false;
      
      document.querySelector('.hint').style.display = 'none';
    }

    // Override animate for game mode
    const originalAnimate = animate;
    animate = function(currentTime) {
      if (!gameMode) return originalAnimate(currentTime);
      
      // Frame rate limiting for game mode
      if (currentTime - lastFrameTime < frameInterval) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      
      // Collection zone (adaptive size)
      const zoneX = window.innerWidth / 2;
      const zoneY = window.innerHeight - 80;
      const zoneRadius = isLowEnd ? 90 : 80;
      
      // Draw zone with gradient
      const gradient = ctx.createRadialGradient(zoneX, zoneY, 0, zoneX, zoneY, zoneRadius);
      gradient.addColorStop(0, 'rgba(0, 255, 0, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(zoneX, zoneY, zoneRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = isLowEnd ? 3 : 4;
      ctx.beginPath();
      ctx.arc(zoneX, zoneY, zoneRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Game constants
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const friction = isLowEnd ? 0.98 : 0.97;
      const bounce = 0.7;
      const pushForce = isLowEnd ? 12 : 15;
      const touchRadius = isLowEnd ? 60 : 50;
      const useGlow = !isLowEnd;
      
      let allCollected = true;
      
      // Update striker physics
      if (!striker.isDragging) {
        const speedSq = striker.vx * striker.vx + striker.vy * striker.vy;
        
        if (speedSq > 0.05) {
          // Friction
          striker.vx *= friction;
          striker.vy *= friction;
          
          // Update position
          striker.x += striker.vx;
          striker.y += striker.vy;
          
          // Stop slow striker
          if (Math.abs(striker.vx) < 0.01) striker.vx = 0;
          if (Math.abs(striker.vy) < 0.01) striker.vy = 0;
        } else {
          // Return to home slowly
          const hdx = striker.homeX - striker.x;
          const hdy = striker.homeY - striker.y;
          const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
          
          if (hdist > 5) {
            striker.x += hdx * 0.05;
            striker.y += hdy * 0.05;
          }
        }
        
        // Enforce boundaries (always keep within screen)
        const margin = striker.radius;
        if (striker.x < margin) {
          striker.x = margin;
          striker.vx = Math.abs(striker.vx) * bounce;
        } else if (striker.x > screenWidth - margin) {
          striker.x = screenWidth - margin;
          striker.vx = -Math.abs(striker.vx) * bounce;
        }
        if (striker.y < margin) {
          striker.y = margin;
          striker.vy = Math.abs(striker.vy) * bounce;
        } else if (striker.y > screenHeight - margin) {
          striker.y = screenHeight - margin;
          striker.vy = -Math.abs(striker.vy) * bounce;
        }
      }
      
      // Update and draw letters
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        if (letter.collected) continue;
        
        allCollected = false;
        
        // Check collection
        const dx = zoneX - letter.x;
        const dy = zoneY - letter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < zoneRadius - letter.size / 2) {
          letter.collected = true;
          collectedCount++;
          continue;
        }
        
        // Striker collision with letters (kinetic energy transfer)
        const sdx = letter.x - striker.x;
        const sdy = letter.y - striker.y;
        const sdistSq = sdx * sdx + sdy * sdy;
        const minDist = striker.radius + letter.size / 2;
        const minDistSq = minDist * minDist;
        
        if (sdistSq < minDistSq && sdistSq > 0.01) {
          const sdist = Math.sqrt(sdistSq);
          const overlap = minDist - sdist;
          
          // Normalized collision vector (from striker TO letter)
          const nx = sdx / sdist;
          const ny = sdy / sdist;
          
          // Separate objects immediately (push letter away from striker)
          const strikerMass = 2.5;
          const letterMass = 1;
          const totalMass = strikerMass + letterMass;
          
          letter.x += nx * overlap * (strikerMass / totalMass);
          letter.y += ny * overlap * (strikerMass / totalMass);
          striker.x -= nx * overlap * (letterMass / totalMass);
          striker.y -= ny * overlap * (letterMass / totalMass);
          
          // Relative velocity along collision normal
          const dvx = striker.vx - letter.vx;
          const dvy = striker.vy - letter.vy;
          const dvn = dvx * nx + dvy * ny;
          
          // Only transfer energy if striker is moving toward letter
          if (dvn > 0) {
            // Kinetic energy transfer with restitution
            const restitution = 0.92;
            const j = (1 + restitution) * dvn / totalMass;
            
            // Apply impulse (striker loses energy, letter gains)
            const strikerImpulse = j * letterMass;
            const letterImpulse = j * strikerMass;
            
            striker.vx -= strikerImpulse * nx;
            striker.vy -= strikerImpulse * ny;
            letter.vx += letterImpulse * nx;
            letter.vy += letterImpulse * ny;
          }
        }
        
        // Letter-to-letter collision (elastic collision physics)
        for (let j = i + 1; j < letters.length; j++) {
          const other = letters[j];
          if (other.collected) continue;
          
          const ldx = letter.x - other.x;
          const ldy = letter.y - other.y;
          const ldistSq = ldx * ldx + ldy * ldy;
          const minDist = (letter.size + other.size) / 2;
          const minDistSq = minDist * minDist;
          
          if (ldistSq < minDistSq && ldistSq > 0.01) {
            const ldist = Math.sqrt(ldistSq);
            const overlap = minDist - ldist;
            
            // Normalized collision vector
            const nx = ldx / ldist;
            const ny = ldy / ldist;
            
            // Separate objects immediately (push apart)
            const separation = overlap * 0.52;
            letter.x += nx * separation;
            letter.y += ny * separation;
            other.x -= nx * separation;
            other.y -= ny * separation;
            
            // Relative velocity
            const dvx = letter.vx - other.vx;
            const dvy = letter.vy - other.vy;
            
            // Relative velocity in collision normal direction
            const dvn = dvx * nx + dvy * ny;
            
            // Only apply impulse if objects are moving toward each other
            if (dvn > 0) {
              // Elastic collision with restitution
              const restitution = 0.85;
              const impulse = (1 + restitution) * dvn;
              
              // Apply impulse (equal mass assumption)
              letter.vx -= impulse * nx;
              letter.vy -= impulse * ny;
              other.vx += impulse * nx;
              other.vy += impulse * ny;
            }
          }
        }
        
        // Update position first
        const speedSq = letter.vx * letter.vx + letter.vy * letter.vy;
        
        if (speedSq > 0.05) {
          // Friction
          letter.vx *= friction;
          letter.vy *= friction;
          
          // Update position
          letter.x += letter.vx;
          letter.y += letter.vy;
          
          // Stop slow letters
          if (Math.abs(letter.vx) < 0.01) letter.vx = 0;
          if (Math.abs(letter.vy) < 0.01) letter.vy = 0;
        }
        
        // Enforce boundaries (always keep within screen)
        const margin = letter.size / 2;
        if (letter.x < margin) {
          letter.x = margin;
          letter.vx = Math.abs(letter.vx) * bounce;
        } else if (letter.x > screenWidth - margin) {
          letter.x = screenWidth - margin;
          letter.vx = -Math.abs(letter.vx) * bounce;
        }
        if (letter.y < margin) {
          letter.y = margin;
          letter.vy = Math.abs(letter.vy) * bounce;
        } else if (letter.y > screenHeight - margin) {
          letter.y = screenHeight - margin;
          letter.vy = -Math.abs(letter.vy) * bounce;
        }
        
        // Draw letter
        ctx.save();
        ctx.translate(letter.x, letter.y);
        
        // Background circle
        if (useGlow) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = letter.color;
        }
        ctx.fillStyle = letter.color;
        ctx.beginPath();
        ctx.arc(0, 0, letter.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Letter text
        ctx.shadowBlur = 0;
        ctx.fillStyle = bgColor;
        ctx.font = 'bold ' + (letter.size * 0.6) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter.char, 0, 0);
        
        ctx.restore();
      }
      
      ctx.shadowBlur = 0;
      
      // Draw striker
      ctx.save();
      
      // Draw slingshot line when dragging
      if (striker.isDragging) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(striker.dragStartX, striker.dragStartY);
        ctx.lineTo(striker.x, striker.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw power indicator
        const dx = striker.dragStartX - striker.x;
        const dy = striker.dragStartY - striker.y;
        const power = Math.sqrt(dx * dx + dy * dy);
        const maxPower = isLowEnd ? 80 : 100;
        const powerPercent = Math.min(power / maxPower, 1);
        
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(striker.dragStartX, striker.dragStartY, 30, 0, Math.PI * 2 * powerPercent);
        ctx.stroke();
      }
      
      // Draw striker circle
      if (useGlow) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
      }
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(striker.x, striker.y, striker.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Striker center dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(striker.x, striker.y, striker.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // Timer & counter
      const elapsed = ((Date.now() - gameStartTime) / 1000).toFixed(1);
      const fontSize = isLowEnd ? 24 : 28;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + fontSize + 'px Arial';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.fillText('⏱️ ' + elapsed + 's', 20, 50);
      ctx.fillText('🔤 ' + collectedCount + '/8', 20, 90);
      ctx.shadowBlur = 0;
      
      // Check win
      if (allCollected) {
        gameMode = false;
        const finalTime = ((Date.now() - gameStartTime) / 1000).toFixed(2);
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'gameComplete',
          time: finalTime
        }));
        
        setTimeout(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'closeGame' }));
        }, 2500);
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
  </script>
</body>
</html>
  `;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webview}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          androidLayerType="hardware"
          androidHardwareAccelerationDisabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={false}
          cacheEnabled={false}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'gameComplete' && studentId && socketUrl) {
                fetch(`${socketUrl}/api/game-scores`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    studentId,
                    gameName: 'letsbunk-carrom',
                    completionTime: parseFloat(data.time),
                    timestamp: new Date().toISOString()
                  })
                }).catch(err => console.log('Score save error:', err));
              } else if (data.type === 'closeGame') {
                onClose();
              }
            } catch (e) {}
          }}
        />
        <TouchableOpacity
          style={styles.closeButton}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <View style={[styles.closeButtonInner, {
            backgroundColor: theme.isDark ? '#00d9ff' : '#d97706'
          }]}>
            <View style={styles.closeIconLine1} />
            <View style={styles.closeIconLine2} />
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0e1a',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  closeButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  closeIconLine1: {
    position: 'absolute',
    width: 24,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  closeIconLine2: {
    position: 'absolute',
    width: 24,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
});

export default FluidSimulationWebView;
