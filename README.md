# Server-Driven UI Countdown Timer App

A React Native countdown timer app with Server-Driven UI (SDUI) capabilities. Change the timer duration, colors, and text without rebuilding the APK!

## 🎯 Features

- **Server-Driven UI**: Update timer settings from the server
- **Dynamic Configuration**: Change duration, colors, button text without rebuilding
- **Optimized Size**: Only 13 MB APK
- **Fallback Support**: Works offline with default config

## 🚀 Quick Start

### 1. Start the Server

```bash
# Double-click START_SERVER.bat
# OR
cd server
npm start
```

Server will run at: `http://192.168.107.31:3000`

### 2. Install the APK

The optimized APK is located at:
```
android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk (13 MB)
```

**Installation Options:**
- **Via ADB**: `adb install android\app\build\outputs\apk\release\app-armeabi-v7a-release.apk`
- **Manual**: Transfer to phone and install (enable "Install from Unknown Sources")

### 3. Use the App

1. Make sure your phone and computer are on the same WiFi network
2. Open the app - it will fetch config from the server
3. The timer will use the server configuration

## 🎨 Customize the Timer

Edit `server/index.js` to change:

### Change Timer Duration (e.g., 5 minutes):
```javascript
timer: {
  duration: 300, // 5 minutes = 300 seconds
  ...
}
```

### Change Colors:
```javascript
screen: {
  backgroundColor: '#2c3e50', // Dark blue-gray
  timer: {
    backgroundColor: '#34495e',
    textColor: '#e74c3c', // Red
    ...
  },
  buttons: [
    {
      backgroundColor: '#27ae60', // Green
      ...
    }
  ]
}
```

### Change Button Text:
```javascript
buttons: [
  {
    id: 'startPause',
    text: 'GO',
    pauseText: 'STOP',
    ...
  },
  {
    id: 'reset',
    text: 'RESTART',
    ...
  }
]
```

**After making changes:**
1. Save `server/index.js`
2. Restart the server
3. Close and reopen the app (or pull to refresh if implemented)

## 📱 How SDUI Works

1. App launches and fetches config from `http://192.168.107.31:3000/api/config`
2. Server responds with JSON containing UI configuration
3. App renders UI based on the configuration
4. No APK rebuild needed for UI changes!

## 🔧 Rebuild APK (if needed)

If you need to change the server URL or app logic:

```bash
cd android
.\gradlew assembleRelease
```

New APK will be at: `android/app/build/outputs/apk/release/`

## 📝 Configuration Schema

```json
{
  "version": "1.0.0",
  "screen": {
    "type": "timer",
    "backgroundColor": "#1a1a2e",
    "title": {
      "text": "Countdown Timer",
      "fontSize": 32,
      "color": "#eee",
      "fontWeight": "bold"
    },
    "timer": {
      "duration": 120,
      "backgroundColor": "#16213e",
      "textColor": "#0f3460",
      "fontSize": 72,
      "borderRadius": 20
    },
    "buttons": [
      {
        "id": "startPause",
        "text": "START",
        "pauseText": "PAUSE",
        "backgroundColor": "#e94560",
        "textColor": "#fff",
        "fontSize": 18
      },
      {
        "id": "reset",
        "text": "RESET",
        "backgroundColor": "#533483",
        "textColor": "#fff",
        "fontSize": 18
      }
    ]
  }
}
```

## 🌐 Network Setup

**Your Computer's IP**: `192.168.107.31`

Make sure:
- Server is running on your computer
- Phone and computer are on the same WiFi
- Firewall allows port 3000

## 💡 Tips

- Server changes take effect immediately - just restart the app
- App works offline with default config if server is unreachable
- You can deploy the server to a cloud service (Heroku, Railway, etc.) for remote access
