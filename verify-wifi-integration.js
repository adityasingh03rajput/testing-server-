#!/usr/bin/env node

/**
 * WiFi Integration Verification Script
 * Checks if all WiFi-based attendance system components are properly integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying WiFi-Based Attendance System Integration...\n');

const checks = [
  {
    name: 'WiFiManager.js exists',
    check: () => fs.existsSync('./WiFiManager.js'),
    description: 'Core WiFi detection and BSSID validation'
  },
  {
    name: 'useWiFiAttendance.js exists',
    check: () => fs.existsSync('./useWiFiAttendance.js'),
    description: 'React hook for WiFi-based attendance tracking'
  },
  {
    name: 'WiFiStatusIndicator.js exists',
    check: () => fs.existsSync('./WiFiStatusIndicator.js'),
    description: 'Visual component showing WiFi connection status'
  },
  {
    name: 'CircularTimer WiFi integration',
    check: () => {
      const content = fs.readFileSync('./CircularTimer.js', 'utf8');
      return content.includes('useWiFiAttendance') && 
             content.includes('WiFiStatusIndicator') &&
             content.includes('serverUrl') &&
             content.includes('lectureInfo');
    },
    description: 'CircularTimer component integrated with WiFi system'
  },
  {
    name: 'App.js WiFi props',
    check: () => {
      const content = fs.readFileSync('./App.js', 'utf8');
      return content.includes('onTimerPaused') && 
             content.includes('onTimerResumed') &&
             content.includes('serverUrl={SOCKET_URL}') &&
             content.includes('studentId={studentId}');
    },
    description: 'App.js passes WiFi props to CircularTimer'
  },
  {
    name: 'Server WiFi endpoints',
    check: () => {
      const content = fs.readFileSync('./index.js', 'utf8');
      return content.includes('/api/attendance/wifi-event') && 
             content.includes('/api/classrooms') &&
             content.includes('wifiBSSID') &&
             content.includes('wifiEvents');
    },
    description: 'Server has WiFi endpoints and database schema'
  },
  {
    name: 'Android WiFi permissions',
    check: () => {
      const content = fs.readFileSync('./android/app/src/main/AndroidManifest.xml', 'utf8');
      return content.includes('ACCESS_WIFI_STATE') && 
             content.includes('ACCESS_FINE_LOCATION') &&
             content.includes('CHANGE_WIFI_STATE');
    },
    description: 'Android manifest has required WiFi permissions'
  },
  {
    name: 'WiFi library dependency',
    check: () => {
      const content = fs.readFileSync('./package.json', 'utf8');
      return content.includes('react-native-wifi-reborn');
    },
    description: 'react-native-wifi-reborn library is installed'
  },
  {
    name: 'WiFi documentation',
    check: () => fs.existsSync('./WIFI_ATTENDANCE_SYSTEM.md') && 
                 fs.existsSync('./WIFI_IMPLEMENTATION_SUMMARY.md'),
    description: 'Complete WiFi system documentation exists'
  }
];

let passed = 0;
let failed = 0;

checks.forEach((check, index) => {
  try {
    const result = check.check();
    if (result) {
      console.log(`✅ ${index + 1}. ${check.name}`);
      console.log(`   ${check.description}`);
      passed++;
    } else {
      console.log(`❌ ${index + 1}. ${check.name}`);
      console.log(`   ${check.description}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${check.name} (Error: ${error.message})`);
    console.log(`   ${check.description}`);
    failed++;
  }
  console.log('');
});

console.log('📊 Integration Verification Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / checks.length) * 100)}%\n`);

if (failed === 0) {
  console.log('🎉 WiFi-Based Attendance System is fully integrated!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Build APK: BUILD_APK_FIXED.bat');
  console.log('2. Install on device: adb install -r android\\app\\build\\outputs\\apk\\release\\app-release.apk');
  console.log('3. Configure classroom BSSIDs in admin panel');
  console.log('4. Test WiFi detection with students in classroom');
} else {
  console.log('⚠️  Some components are missing or not properly integrated.');
  console.log('Please fix the failed checks before proceeding.');
}