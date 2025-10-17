# Timer SDUI Server

Server-Driven UI backend for the countdown timer app.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Configuration

Edit the `/api/config` endpoint in `index.js` to change:
- Timer duration
- Colors (background, text, buttons)
- Button text
- Font sizes
- Title text

Changes take effect immediately - just restart the app to fetch new config!

## Connect from Phone

1. Make sure your phone and computer are on the same WiFi network
2. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
3. Update `API_URL` in `App.js` to use your IP:
   ```javascript
   const API_URL = 'http://YOUR_IP_ADDRESS:3000/api/config';
   ```
4. Rebuild the APK

## Example Config Changes

### Change timer to 5 minutes:
```javascript
timer: {
  duration: 300, // 5 minutes = 300 seconds
  ...
}
```

### Change colors:
```javascript
timer: {
  backgroundColor: '#2c3e50',
  textColor: '#e74c3c',
  ...
}
```

### Change button text:
```javascript
buttons: [
  {
    id: 'startPause',
    text: 'GO',
    pauseText: 'STOP',
    ...
  }
]
```
