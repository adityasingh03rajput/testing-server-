#!/usr/bin/env node

/**
 * WiFi BSSID Test Script
 * Tests the integrated WiFi BSSID functionality from LetsBunk
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 WiFi BSSID Integration Test');
console.log('=====================================');

// Test 1: Check if WiFi files exist
console.log('\n📁 Checking WiFi Integration Files...');
const requiredFiles = [
  'WiFiBSSIDService.js',
  'WiFiStatusIndicator.js', 
  'useWiFiBSSID.js',
  'WiFiBSSIDTest.js',
  'android/app/src/main/java/com/countdowntimer/app/WifiModule.kt',
  'android/app/src/main/java/com/countdowntimer/app/WifiPackage.kt'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check Android Permissions
console.log('\n📱 Checking Android Permissions...');
try {
  const manifestContent = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  
  const requiredPermissions = [
    'ACCESS_WIFI_STATE',
    'ACCESS_FINE_LOCATION', 
    'ACCESS_COARSE_LOCATION'
  ];
  
  requiredPermissions.forEach(permission => {
    if (manifestContent.includes(permission)) {
      console.log(`✅ ${permission}`);
    } else {
      console.log(`❌ ${permission} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Could not read AndroidManifest.xml');
  allFilesExist = false;
}

// Test 3: Check App.js Integration
console.log('\n⚛️ Checking App.js Integration...');
try {
  const appContent = fs.readFileSync('App.js', 'utf8');
  
  const requiredImports = [
    'WiFiBSSIDTest',
    'WiFiStatusIndicator',
    'useWiFiBSSID'
  ];
  
  requiredImports.forEach(importName => {
    if (appContent.includes(importName)) {
      console.log(`✅ ${importName} imported`);
    } else {
      console.log(`❌ ${importName} - NOT IMPORTED`);
      allFilesExist = false;
    }
  });
  
  // Check for WiFi tab
  if (appContent.includes("activeTab === 'wifi'")) {
    console.log('✅ WiFi tab condition added');
  } else {
    console.log('❌ WiFi tab condition - MISSING');
    allFilesExist = false;
  }
  
} catch (error) {
  console.log('❌ Could not read App.js');
  allFilesExist = false;
}

// Test 4: Check BottomNavigation Integration
console.log('\n🧭 Checking BottomNavigation Integration...');
try {
  const navContent = fs.readFileSync('BottomNavigation.js', 'utf8');
  
  if (navContent.includes("id: 'wifi'")) {
    console.log('✅ WiFi tab added to navigation');
  } else {
    console.log('❌ WiFi tab - NOT ADDED TO NAVIGATION');
    allFilesExist = false;
  }
  
} catch (error) {
  console.log('❌ Could not read BottomNavigation.js');
  allFilesExist = false;
}

// Test 5: Check Native Module Registration
console.log('\n🔧 Checking Native Module Registration...');
try {
  const mainAppContent = fs.readFileSync('android/app/src/main/java/com/countdowntimer/app/MainApplication.kt', 'utf8');
  
  if (mainAppContent.includes('WifiPackage')) {
    console.log('✅ WifiPackage registered in MainApplication');
  } else {
    console.log('❌ WifiPackage - NOT REGISTERED');
    allFilesExist = false;
  }
  
} catch (error) {
  console.log('❌ Could not read MainApplication.kt');
  allFilesExist = false;
}

// Summary
console.log('\n📊 Test Summary');
console.log('=====================================');
if (allFilesExist) {
  console.log('✅ All WiFi BSSID integration tests PASSED!');
  console.log('\n🚀 Next Steps:');
  console.log('1. Build APK: npm run android');
  console.log('2. Install on device: adb install -r android/app/build/outputs/apk/debug/app-debug.apk');
  console.log('3. Test WiFi tab in the app');
  console.log('4. Grant location permissions when prompted');
  console.log('5. Check BSSID detection in WiFi test screen');
} else {
  console.log('❌ Some WiFi BSSID integration tests FAILED!');
  console.log('\n🔧 Please fix the missing components above.');
}

console.log('\n📋 WiFi BSSID Features Integrated:');
console.log('• Native WiFi BSSID detection (Android)');
console.log('• Location permission handling');
console.log('• Real-time WiFi monitoring');
console.log('• BSSID authorization verification');
console.log('• WiFi status indicator component');
console.log('• WiFi test screen with diagnostics');
console.log('• React Native hooks for WiFi state');

console.log('\n🎯 Usage in Your App:');
console.log('• Navigate to WiFi tab to test BSSID functionality');
console.log('• WiFi status indicator shows on home screen');
console.log('• Use useWiFiBSSID hook in your components');
console.log('• WiFiStatusIndicator component for status display');

console.log('\n📖 Example Usage:');
console.log(`
import useWiFiBSSID from './useWiFiBSSID';

const MyComponent = () => {
  const { bssid, isAuthorized, requestPermissions } = useWiFiBSSID({
    authorizedBSSID: 'your:authorized:bssid:here',
    onBSSIDChange: (info) => console.log('BSSID changed:', info)
  });
  
  return (
    <View>
      <Text>Current BSSID: {bssid}</Text>
      <Text>Authorized: {isAuthorized ? 'Yes' : 'No'}</Text>
    </View>
  );
};
`);

process.exit(allFilesExist ? 0 : 1);