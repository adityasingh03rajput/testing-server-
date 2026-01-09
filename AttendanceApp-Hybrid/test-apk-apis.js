// React Native APK API Endpoint Testing Script
// Tests all API endpoints used by the React Native APK

const SERVER_URL = 'http://localhost:3000';

// List of all React Native APK API endpoints extracted from app files
const APK_API_ENDPOINTS = [
    // Core System APIs
    { method: 'GET', url: '/api/health', description: 'Server health check', category: 'Core' },
    { method: 'GET', url: '/api/time', description: 'Server time synchronization', category: 'Core' },
    { method: 'GET', url: '/api/config', description: 'SDUI configuration', category: 'Core' },
    { method: 'GET', url: '/api/config/app', description: 'App configuration', category: 'Core' },
    
    // Authentication APIs
    { method: 'POST', url: '/api/login', description: 'User authentication', category: 'Auth' },
    { method: 'POST', url: '/api/refresh-profile', description: 'Profile refresh', category: 'Auth' },
    
    // Student Management APIs
    { method: 'POST', url: '/api/student/register', description: 'Student registration', category: 'Student' },
    { method: 'GET', url: '/api/student/:id', description: 'Get student by ID', category: 'Student' },
    { method: 'GET', url: '/api/student-management', description: 'Get student by enrollment', category: 'Student' },
    { method: 'GET', url: '/api/view-records/students', description: 'Get students by semester/branch', category: 'Student' },
    
    // Teacher Management APIs
    { method: 'GET', url: '/api/teachers', description: 'Get all teachers', category: 'Teacher' },
    { method: 'GET', url: '/api/teacher/current-class-students/:teacherId', description: 'Get teacher current class', category: 'Teacher' },
    { method: 'GET', url: '/api/teacher-schedule/:teacherId/:day', description: 'Get teacher schedule', category: 'Teacher' },
    
    // Attendance Management APIs
    { method: 'POST', url: '/api/attendance/start-session', description: 'Start attendance session', category: 'Attendance' },
    { method: 'POST', url: '/api/attendance/update-timer', description: 'Update timer heartbeat', category: 'Attendance' },
    { method: 'POST', url: '/api/attendance/record', description: 'Record attendance', category: 'Attendance' },
    { method: 'POST', url: '/api/attendance/add-verification', description: 'Add face verification', category: 'Attendance' },
    { method: 'GET', url: '/api/attendance/records', description: 'Get attendance records', category: 'Attendance' },
    { method: 'GET', url: '/api/attendance/stats', description: 'Get attendance statistics', category: 'Attendance' },
    { method: 'POST', url: '/api/attendance/sync-offline', description: 'Sync offline attendance', category: 'Attendance' },
    { method: 'POST', url: '/api/attendance/wifi-event', description: 'Log WiFi events', category: 'Attendance' },
    
    // Unified Timer APIs
    { method: 'POST', url: '/api/attendance/get-timer-state', description: 'Get timer state', category: 'Timer' },
    { method: 'POST', url: '/api/attendance/start-unified-timer', description: 'Start unified timer', category: 'Timer' },
    { method: 'POST', url: '/api/attendance/stop-unified-timer', description: 'Stop unified timer', category: 'Timer' },
    { method: 'POST', url: '/api/attendance/pause-unified-timer', description: 'Pause unified timer', category: 'Timer' },
    { method: 'POST', url: '/api/attendance/resume-unified-timer', description: 'Resume unified timer', category: 'Timer' },
    
    // Attendance Tracking APIs (useAttendanceTracking.js)
    { method: 'POST', url: '/api/attendance/start', description: 'Start attendance tracking', category: 'Tracking' },
    { method: 'POST', url: '/api/attendance/stop', description: 'Stop attendance tracking', category: 'Tracking' },
    { method: 'GET', url: '/api/attendance/report/:studentId', description: 'Get attendance report', category: 'Tracking' },
    
    // Timetable Management APIs
    { method: 'GET', url: '/api/timetable/:semester/:branch', description: 'Get timetable', category: 'Timetable' },
    { method: 'POST', url: '/api/timetable', description: 'Save timetable', category: 'Timetable' },
    { method: 'PUT', url: '/api/timetable/:semester/:branch', description: 'Update timetable', category: 'Timetable' },
    
    // Face Verification APIs
    { method: 'POST', url: '/api/verify-face', description: 'Face verification', category: 'Face' },
    
    // Random Ring System APIs
    { method: 'POST', url: '/api/random-ring', description: 'Create random ring', category: 'RandomRing' },
    { method: 'POST', url: '/api/random-ring/teacher-action', description: 'Teacher random ring action', category: 'RandomRing' },
    
    // Classroom & WiFi APIs
    { method: 'GET', url: '/api/classrooms', description: 'Get classrooms (for BSSID)', category: 'WiFi' },
    
    // Holiday APIs
    { method: 'GET', url: '/api/holidays/range', description: 'Get holidays by date range', category: 'Calendar' },
    
    // Game/Gamification APIs
    { method: 'POST', url: '/api/game-scores', description: 'Submit game scores', category: 'Game' }
];

async function testAPKEndpoint(endpoint) {
    try {
        let url = `${SERVER_URL}${endpoint.url}`;
        
        // Replace placeholders with test values
        url = url.replace(':id', '507f1f77bcf86cd799439011'); // Sample MongoDB ObjectId
        url = url.replace(':studentId', 'TEST001');
        url = url.replace(':teacherId', 'TEACH001');
        url = url.replace(':semester', '3');
        url = url.replace(':branch', 'B.Tech%20Data%20Science');
        url = url.replace(':day', 'Monday');
        
        // Add query parameters for GET requests that need them
        if (endpoint.url.includes('/student-management')) {
            url += '?enrollmentNo=TEST001';
        } else if (endpoint.url.includes('/view-records/students')) {
            url += '?semester=3&branch=B.Tech%20Data%20Science';
        } else if (endpoint.url.includes('/attendance/records')) {
            url += '?studentId=TEST001';
        } else if (endpoint.url.includes('/attendance/stats')) {
            url += '?studentId=TEST001';
        } else if (endpoint.url.includes('/holidays/range')) {
            const startDate = new Date('2026-01-01').toISOString();
            const endDate = new Date('2026-12-31').toISOString();
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        
        const options = {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Add sample body for POST/PUT requests
        if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
            if (endpoint.url.includes('/login')) {
                options.body = JSON.stringify({
                    id: 'TEST001',
                    password: 'test123'
                });
            } else if (endpoint.url.includes('/student/register')) {
                options.body = JSON.stringify({
                    name: 'Test Student',
                    enrollmentNo: 'TEST001',
                    semester: '3',
                    branch: 'B.Tech Data Science',
                    email: 'test@example.com',
                    phone: '+91-9876543210'
                });
            } else if (endpoint.url.includes('/refresh-profile')) {
                options.body = JSON.stringify({
                    userId: 'TEST001',
                    role: 'student'
                });
            } else if (endpoint.url.includes('/attendance/start-session')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    studentName: 'Test Student',
                    enrollmentNo: 'TEST001',
                    semester: '3',
                    branch: 'B.Tech Data Science'
                });
            } else if (endpoint.url.includes('/attendance/update-timer')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    timerValue: 1800,
                    wifiConnected: true
                });
            } else if (endpoint.url.includes('/attendance/record')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    date: new Date().toISOString(),
                    status: 'present',
                    timerValue: 1800
                });
            } else if (endpoint.url.includes('/attendance/add-verification')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    period: 'P1',
                    verificationType: 'face',
                    event: 'morning_checkin'
                });
            } else if (endpoint.url.includes('/attendance/sync-offline')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    offlineRecords: []
                });
            } else if (endpoint.url.includes('/attendance/wifi-event')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    event: 'connected',
                    bssid: 'b4:86:18:6f:fb:eb',
                    timestamp: new Date().toISOString()
                });
            } else if (endpoint.url.includes('/attendance/get-timer-state')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    clientTime: Date.now()
                });
            } else if (endpoint.url.includes('/attendance/start-unified-timer')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    lectureInfo: {
                        subject: 'Test Subject',
                        room: 'LAB 8',
                        period: 'P1'
                    },
                    clientTime: Date.now()
                });
            } else if (endpoint.url.includes('/attendance/stop-unified-timer')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    reason: 'manual',
                    clientTime: Date.now()
                });
            } else if (endpoint.url.includes('/attendance/pause-unified-timer')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    reason: 'break',
                    clientTime: Date.now()
                });
            } else if (endpoint.url.includes('/attendance/resume-unified-timer')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    reason: 'break_over',
                    clientTime: Date.now()
                });
            } else if (endpoint.url.includes('/attendance/start')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    lectureInfo: {
                        subject: 'Test Subject',
                        room: 'LAB 8'
                    }
                });
            } else if (endpoint.url.includes('/attendance/stop')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    reason: 'manual'
                });
            } else if (endpoint.url.includes('/timetable') && !endpoint.url.includes('/:')) {
                options.body = JSON.stringify({
                    semester: '3',
                    branch: 'B.Tech Data Science',
                    timetable: {
                        monday: [{ period: 1, subject: 'Test Subject', room: 'LAB 8' }]
                    }
                });
            } else if (endpoint.url.includes('/verify-face')) {
                options.body = JSON.stringify({
                    userId: 'TEST001',
                    capturedImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
                });
            } else if (endpoint.url.includes('/random-ring/teacher-action')) {
                options.body = JSON.stringify({
                    randomRingId: '507f1f77bcf86cd799439011',
                    studentId: 'TEST001',
                    action: 'accept'
                });
            } else if (endpoint.url.includes('/random-ring')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    teacherId: 'TEACH001',
                    period: 'P1'
                });
            } else if (endpoint.url.includes('/game-scores')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    score: 100,
                    game: 'fluid-simulation'
                });
            }
        }
        
        const response = await fetch(url, options);
        const status = response.status;
        
        let result = 'UNKNOWN';
        if (status >= 200 && status < 300) {
            result = 'PASS';
        } else if (status === 404) {
            result = 'NOT_FOUND';
        } else if (status >= 400 && status < 500) {
            result = 'CLIENT_ERROR';
        } else if (status >= 500) {
            result = 'SERVER_ERROR';
        }
        
        return {
            endpoint: `${endpoint.method} ${endpoint.url}`,
            description: endpoint.description,
            category: endpoint.category,
            status: status,
            result: result,
            url: url
        };
        
    } catch (error) {
        return {
            endpoint: `${endpoint.method} ${endpoint.url}`,
            description: endpoint.description,
            category: endpoint.category,
            status: 'ERROR',
            result: 'NETWORK_ERROR',
            error: error.message,
            url: `${SERVER_URL}${endpoint.url}`
        };
    }
}

async function testAllAPKEndpoints() {
    console.log('📱 Testing React Native APK API Endpoints...\n');
    console.log('=' .repeat(90));
    
    const results = [];
    const categories = {};
    
    for (const endpoint of APK_API_ENDPOINTS) {
        const result = await testAPKEndpoint(endpoint);
        results.push(result);
        
        // Group by category
        if (!categories[result.category]) {
            categories[result.category] = [];
        }
        categories[result.category].push(result);
        
        const statusEmoji = result.result === 'PASS' ? '✅' : 
                           result.result === 'NOT_FOUND' ? '❌' : 
                           result.result === 'CLIENT_ERROR' ? '⚠️' : 
                           result.result === 'SERVER_ERROR' ? '🔥' : '💥';
        
        console.log(`${statusEmoji} ${result.endpoint.padEnd(50)} | ${result.status.toString().padEnd(3)} | ${result.description}`);
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    console.log('=' .repeat(90));
    
    // Category-wise summary
    console.log('\n📊 CATEGORY-WISE SUMMARY:');
    Object.keys(categories).forEach(category => {
        const categoryResults = categories[category];
        const passed = categoryResults.filter(r => r.result === 'PASS').length;
        const total = categoryResults.length;
        const percentage = ((passed / total) * 100).toFixed(1);
        
        console.log(`📂 ${category.padEnd(15)} | ${passed}/${total} (${percentage}%)`);
    });
    
    // Overall summary
    const summary = results.reduce((acc, result) => {
        acc[result.result] = (acc[result.result] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\n🎯 OVERALL SUMMARY:');
    console.log(`✅ PASS: ${summary.PASS || 0}`);
    console.log(`❌ NOT_FOUND: ${summary.NOT_FOUND || 0}`);
    console.log(`⚠️ CLIENT_ERROR: ${summary.CLIENT_ERROR || 0}`);
    console.log(`🔥 SERVER_ERROR: ${summary.SERVER_ERROR || 0}`);
    console.log(`💥 NETWORK_ERROR: ${summary.NETWORK_ERROR || 0}`);
    
    const totalEndpoints = results.length;
    const workingEndpoints = summary.PASS || 0;
    const successRate = ((workingEndpoints / totalEndpoints) * 100).toFixed(1);
    
    console.log(`\n🚀 APK API SUCCESS RATE: ${successRate}% (${workingEndpoints}/${totalEndpoints})`);
    
    // List failed endpoints by category
    const failedEndpoints = results.filter(r => r.result !== 'PASS');
    if (failedEndpoints.length > 0) {
        console.log('\n❌ FAILED ENDPOINTS BY CATEGORY:');
        const failedByCategory = {};
        failedEndpoints.forEach(endpoint => {
            if (!failedByCategory[endpoint.category]) {
                failedByCategory[endpoint.category] = [];
            }
            failedByCategory[endpoint.category].push(endpoint);
        });
        
        Object.keys(failedByCategory).forEach(category => {
            console.log(`\n📂 ${category}:`);
            failedByCategory[category].forEach(endpoint => {
                console.log(`   ${endpoint.endpoint} - ${endpoint.result} (${endpoint.status})`);
            });
        });
    }
    
    // Critical endpoints check
    const criticalEndpoints = [
        'GET /api/health',
        'POST /api/login',
        'GET /api/config/app',
        'POST /api/attendance/update-timer',
        'GET /api/timetable/:semester/:branch',
        'POST /api/verify-face'
    ];
    
    console.log('\n🔥 CRITICAL ENDPOINTS STATUS:');
    criticalEndpoints.forEach(endpoint => {
        const result = results.find(r => r.endpoint === endpoint);
        if (result) {
            const emoji = result.result === 'PASS' ? '✅' : '❌';
            console.log(`${emoji} ${endpoint} - ${result.result}`);
        }
    });
    
    return results;
}

// Run the tests
testAllAPKEndpoints().catch(console.error);