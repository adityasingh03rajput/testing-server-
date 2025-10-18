# 🎨 UI Quick Reference Guide

## 🎯 What Changed?

### Visual Elements

1. **Camera Preview**
   - Size: 400px → **450px** ✨
   - Border radius: 20px → **30px**
   - Added: Shadow effects & elevation

2. **Face Frame**
   - Size: 250x300 → **280x320**
   - Style: Solid → **Dashed**
   - Animation: None → **Pulse effect**
   - Color: Static white → **Dynamic (white/green)**

3. **Reference Photo**
   - Size: 80px → **90px**
   - Position: Below camera → **Floating badge**
   - Border: Simple → **Glowing cyan**
   - Label: Above → **Overlay**

4. **Status Display**
   - Style: Plain text → **Card with icon**
   - Background: None → **Theme card**
   - Icon: None → **Dynamic (✓/✗/●)**

5. **Buttons**
   - Size: Standard → **Larger**
   - Style: Basic → **Gradient with icons**
   - Feedback: None → **Shadow & elevation**

6. **Tips Section**
   - Style: Bullet points → **Icon-based**
   - Icons: None → **💡 ☀️ 👓**
   - Spacing: Tight → **Comfortable**

## 🎨 Color Palette

```javascript
// Success States
Success Green: #00ff88
Info Cyan: #00d9ff

// Neutral States
White: #ffffff
Gray: #666666

// Dynamic (Theme-based)
Primary: theme.primary
Background: theme.background
Text: theme.text
Card: theme.cardBackground
Border: theme.border
```

## 📐 Dimensions

```javascript
// Camera
cameraHeight: 450
cameraRadius: 30

// Face Frame
frameWidth: 280
frameHeight: 320
frameBorder: 4
frameRadius: 160

// Reference Badge
badgeSize: 90
badgeRadius: 45
badgeBorder: 3

// Buttons
buttonPadding: 18
buttonRadius: 16

// Countdown
countdownSize: 120
countdownRadius: 60
```

## ✨ Animations

```javascript
// Pulse Animation (Face Frame)
Duration: 2000ms (1000ms up, 1000ms down)
Scale: 1.0 → 1.05 → 1.0
Loop: Infinite

// Fade In (Screen)
Duration: 500ms
Opacity: 0 → 1
Timing: On mount

// Color Transition (Frame)
From: #ffffff (white)
To: #00ff88 (green)
Trigger: Verification start
```

## 🎭 States

### 1. Loading
- Show: ActivityIndicator
- Message: "Requesting camera..."
- Button: Disabled

### 2. Ready
- Frame: White, pulsing
- Icon: ✓
- Message: "Ready! Position your face"
- Button: Enabled

### 3. Verifying
- Frame: Green, static
- Icon: ActivityIndicator
- Message: "Verifying..."
- Button: Disabled

### 4. Success
- Frame: Green
- Icon: ✓
- Message: "Verified! XX%"
- Action: Auto-navigate

### 5. Failed
- Frame: White
- Icon: ✗
- Message: "Face does not match"
- Action: Reset after 2s

### 6. Error
- Show: Error screen
- Icon: 📷
- Message: "Camera Access Required"
- Button: "Go Back"

## 🎯 Touch Targets

```javascript
// Minimum sizes for accessibility
Verify Button: 
  - Height: 56px (18px padding × 2 + text)
  - Width: 100%
  - Tap area: Full width

Cancel Button:
  - Height: 52px (16px padding × 2 + text)
  - Width: 100%
  - Tap area: Full width

Reference Badge:
  - Size: 90×90px
  - Tap area: None (display only)
```

## 📱 Responsive Behavior

```javascript
// All sizes are relative to screen width
Container padding: 20px
Camera width: 100% - 40px (padding)
Button width: 100%
Text: Scales with system font size
```

## 🎨 Shadow Effects

```javascript
// Camera Container
elevation: 10
shadowColor: #000
shadowOffset: { width: 0, height: 10 }
shadowOpacity: 0.3
shadowRadius: 20

// Verify Button
elevation: 5
shadowColor: #000
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.2
shadowRadius: 8

// Status Card
elevation: 3
shadowColor: #000
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.1
shadowRadius: 4
```

## 🚀 Performance Tips

1. **Animations**: Use `useNativeDriver: true`
2. **Images**: Use `resizeMode="cover"`
3. **Re-renders**: Minimize state updates
4. **Memory**: Clean up timers in useEffect
5. **Camera**: Release on unmount

## 📝 Usage Example

```javascript
<FaceVerificationScreen
  userId="student123"
  onVerificationSuccess={(result) => {
    console.log('Success:', result);
  }}
  onVerificationFailed={(result) => {
    console.log('Failed:', result);
  }}
  onCancel={() => {
    console.log('Cancelled');
  }}
  theme={{
    primary: '#007AFF',
    background: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    cardBackground: '#FFFFFF',
    border: '#E0E0E0',
  }}
/>
```

## 🎉 Result

A **modern, professional, and user-friendly** face verification experience! 🚀
