// Configuration for the attendance app
const config = {
  // Server Configuration
  SERVER_URL: 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net',
  API_BASE_URL: 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api',
  
  // Socket Configuration
  SOCKET_URL: 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net',
  
  // Face Recognition Configuration
  FACE_DETECTION_THRESHOLD: 0.6,
  FACE_MATCH_THRESHOLD: 0.6,
  
  // WiFi Configuration
  AUTHORIZED_BSSIDS: [
    '00:1a:2b:3c:4d:5e', // Example BSSID - replace with actual college WiFi BSSID
    '11:22:33:44:55:66'  // Add more authorized BSSIDs as needed
  ],
  
  // App Configuration
  APP_NAME: 'Attendance App',
  VERSION: '1.0.0',
  
  // Timer Configuration
  DEFAULT_TIMER_DURATION: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  
  // Notification Configuration
  NOTIFICATION_CHANNEL_ID: 'attendance_notifications',
  NOTIFICATION_CHANNEL_NAME: 'Attendance Notifications',
  
  // Development Configuration
  DEBUG_MODE: __DEV__ || false,
  LOG_LEVEL: 'info'
};

export default config;