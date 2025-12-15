// Test APK Functionality
// This script tests if the APK can connect to the Azure server

const axios = require('axios');

const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testAPKFunctionality() {
    console.log('🔍 Testing APK Functionality...\n');
    
    try {
        // Test 1: Server Health Check
        console.log('1. Testing server connection...');
        const healthResponse = await axios.get(`${SERVER_URL}/api/health`, { timeout: 10000 });
        console.log('✅ Server is healthy:', healthResponse.data);
        
        // Test 2: API Endpoints
        console.log('\n2. Testing API endpoints...');
        
        // Test students endpoint
        const studentsResponse = await axios.get(`${SERVER_URL}/api/students`, { timeout: 10000 });
        console.log(`✅ Students API: ${studentsResponse.data.length} students found`);
        
        // Test teachers endpoint
        const teachersResponse = await axios.get(`${SERVER_URL}/api/teachers`, { timeout: 10000 });
        console.log(`✅ Teachers API: ${teachersResponse.data.length} teachers found`);
        
        // Test 3: Socket.IO Connection
        console.log('\n3. Testing Socket.IO connection...');
        const io = require('socket.io-client');
        const socket = io(SERVER_URL, { timeout: 5000 });
        
        socket.on('connect', () => {
            console.log('✅ Socket.IO connected successfully');
            socket.disconnect();
        });
        
        socket.on('connect_error', (error) => {
            console.log('❌ Socket.IO connection failed:', error.message);
        });
        
        // Test 4: APK Installation Status
        console.log('\n4. Checking APK installation...');
        const { exec } = require('child_process');
        
        exec('adb shell pm list packages | findstr countdowntimer', (error, stdout, stderr) => {
            if (error) {
                console.log('❌ APK not found on device');
                return;
            }
            console.log('✅ APK installed on device:', stdout.trim());
            
            // Get app info
            exec('adb shell dumpsys package com.countdowntimer.app | findstr "versionName"', (error, stdout, stderr) => {
                if (!error && stdout) {
                    console.log('✅ App version:', stdout.trim());
                }
            });
        });
        
        console.log('\n🎉 APK Functionality Test Complete!');
        console.log('\n📱 Next Steps:');
        console.log('1. Open the app on your device');
        console.log('2. Test login with teacher/student credentials');
        console.log('3. Verify WiFi attendance tracking');
        console.log('4. Test face verification functionality');
        console.log('5. Check real-time updates via Socket.IO');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Server might be down. Check Azure deployment status.');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('\n💡 Connection timeout. Check network connectivity.');
        }
    }
}

// Run the test
testAPKFunctionality();