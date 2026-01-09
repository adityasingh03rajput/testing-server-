// Production Server API Testing Script
// Tests all API endpoints on https://letsbunk-uw7g.onrender.com

const SERVER_URL = 'https://letsbunk-uw7g.onrender.com';

// Critical endpoints for both Admin Panel and React Native APK
const PRODUCTION_ENDPOINTS = [
    // Core System APIs
    { method: 'GET', url: '/api/health', description: 'Server health check', category: 'Core', critical: true },
    { method: 'GET', url: '/api/time', description: 'Server time sync', category: 'Core', critical: true },
    { method: 'GET', url: '/api/config', description: 'SDUI configuration', category: 'Core', critical: true },
    { method: 'GET', url: '/api/config/app', description: 'App configuration', category: 'Core', critical: true },
    { method: 'GET', url: '/api/config/branches', description: 'Available branches', category: 'Core', critical: true },
    
    // Authentication APIs
    { method: 'POST', url: '/api/login', description: 'User authentication', category: 'Auth', critical: true },
    { method: 'POST', url: '/api/refresh-profile', description: 'Profile refresh', category: 'Auth', critical: false },
    
    // Student Management APIs (Admin Panel)
    { method: 'GET', url: '/api/students', description: 'Get all students', category: 'Students', critical: true },
    { method: 'POST', url: '/api/students', description: 'Add new student', category: 'Students', critical: true },
    { method: 'POST', url: '/api/students/bulk', description: 'Bulk import students', category: 'Students', critical: false },
    { method: 'GET', url: '/api/student-management', description: 'Get student by enrollment', category: 'Students', critical: true },
    
    // Teacher Management APIs (Admin Panel)
    { method: 'GET', url: '/api/teachers', description: 'Get all teachers', category: 'Teachers', critical: true },
    { method: 'POST', url: '/api/teachers', description: 'Add new teacher', category: 'Teachers', critical: true },
    { method: 'POST', url: '/api/teachers/bulk', description: 'Bulk import teachers', category: 'Teachers', critical: false },
    { method: 'GET', url: '/api/teacher/current-class-students/:teacherId', description: 'Teacher current class', category: 'Teachers', critical: true },
    
    // NEW ENDPOINTS - Recently Added
    { method: 'GET', url: '/api/departments', description: 'Get departments', category: 'NEW', critical: true },
    { method: 'GET', url: '/api/classrooms', description: 'Get classrooms', category: 'NEW', critical: true },
    { method: 'POST', url: '/api/classrooms', description: 'Add classroom', category: 'NEW', critical: true },
    { method: 'GET', url: '/api/settings/attendance-threshold', description: 'Get attendance threshold', category: 'NEW', critical: true },
    { method: 'POST', url: '/api/settings/attendance-threshold', description: 'Update threshold', category: 'NEW', critical: true },
    { method: 'GET', url: '/api/holidays', description: 'Get holidays', category: 'NEW', critical: true },
    { method: 'POST', url: '/api/holidays', description: 'Add holiday', category: 'NEW', critical: true },
    { method: 'GET', url: '/api/attendance/date-range', description: 'Attendance date range', category: 'NEW', critical: true },
    
    // Timetable Management APIs
    { method: 'GET', url: '/api/timetables', description: 'Get all timetables', category: 'Timetable', critical: true },
    { method: 'GET', url: '/api/timetable/:semester/:branch', description: 'Get specific timetable', category: 'Timetable', critical: true },
    { method: 'POST', url: '/api/timetable', description: 'Save timetable', category: 'Timetable', critical: true },
    
    // Attendance Management APIs (React Native)
    { method: 'POST', url: '/api/attendance/start-session', description: 'Start attendance session', category: 'Attendance', critical: true },
    { method: 'POST', url: '/api/attendance/update-timer', description: 'Update timer', category: 'Attendance', critical: true },
    { method: 'GET', url: '/api/attendance/records', description: 'Get attendance records', category: 'Attendance', critical: true },
    { method: 'POST', url: '/api/attendance/record', description: 'Record attendance', category: 'Attendance', critical: true },
    
    // Face Verification APIs
    { method: 'POST', url: '/api/verify-face', description: 'Face verification', category: 'Face', critical: true },
    { method: 'POST', url: '/api/upload-photo', description: 'Upload photo', category: 'Face', critical: true },
    
    // Subject Management APIs
    { method: 'GET', url: '/api/subjects', description: 'Get subjects', category: 'Subjects', critical: false },
    
    // Unified Timer APIs (React Native)
    { method: 'POST', url: '/api/attendance/get-timer-state', description: 'Get timer state', category: 'Timer', critical: true },
    { method: 'POST', url: '/api/attendance/start-unified-timer', description: 'Start timer', category: 'Timer', critical: true },
    { method: 'POST', url: '/api/attendance/stop-unified-timer', description: 'Stop timer', category: 'Timer', critical: true }
];

async function testProductionEndpoint(endpoint) {
    try {
        let url = `${SERVER_URL}${endpoint.url}`;
        
        // Replace placeholders with test values
        url = url.replace(':teacherId', 'TEACH001');
        url = url.replace(':semester', '3');
        url = url.replace(':branch', 'B.Tech%20Data%20Science');
        
        // Add query parameters for specific endpoints
        if (endpoint.url.includes('/student-management')) {
            url += '?enrollmentNo=TEST001';
        } else if (endpoint.url.includes('/attendance/records')) {
            url += '?studentId=TEST001&limit=10';
        }
        
        const options = {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'LetsBunk-API-Test/1.0'
            }
        };
        
        // Add sample body for POST requests
        if (endpoint.method === 'POST') {
            if (endpoint.url.includes('/login')) {
                options.body = JSON.stringify({
                    id: 'TEST001',
                    password: 'test123'
                });
            } else if (endpoint.url.includes('/students') && !endpoint.url.includes('bulk')) {
                options.body = JSON.stringify({
                    name: 'Production Test Student',
                    enrollmentNo: 'PROD001',
                    email: 'prodtest@example.com',
                    password: 'test123',
                    course: 'B.Tech Data Science',
                    semester: '3',
                    dob: '2000-01-01'
                });
            } else if (endpoint.url.includes('/teachers') && !endpoint.url.includes('bulk')) {
                options.body = JSON.stringify({
                    name: 'Production Test Teacher',
                    employeeId: 'PRODTEACH001',
                    email: 'prodteacher@example.com',
                    password: 'test123',
                    department: 'CSE',
                    subject: 'Production Testing',
                    dob: '1980-01-01'
                });
            } else if (endpoint.url.includes('/classrooms')) {
                options.body = JSON.stringify({
                    name: 'Production Test Room',
                    building: 'Test Building',
                    capacity: 50,
                    type: 'Classroom'
                });
            } else if (endpoint.url.includes('/settings/attendance-threshold')) {
                options.body = JSON.stringify({
                    threshold: 75
                });
            } else if (endpoint.url.includes('/holidays')) {
                options.body = JSON.stringify({
                    name: 'Production Test Holiday',
                    date: '2026-12-25',
                    type: 'Institute'
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
            } else if (endpoint.url.includes('/verify-face')) {
                options.body = JSON.stringify({
                    userId: 'TEST001',
                    capturedImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
                });
            } else if (endpoint.url.includes('/upload-photo')) {
                options.body = JSON.stringify({
                    photoData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
                    type: 'student',
                    id: 'PROD001'
                });
            } else if (endpoint.url.includes('/timetable') && !endpoint.url.includes('/:')) {
                options.body = JSON.stringify({
                    semester: '3',
                    branch: 'B.Tech Data Science',
                    timetable: {
                        monday: [{ period: 1, subject: 'Production Test', room: 'TEST ROOM' }]
                    }
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
                        subject: 'Production Test',
                        room: 'TEST ROOM'
                    },
                    clientTime: Date.now()
                });
            } else if (endpoint.url.includes('/attendance/stop-unified-timer')) {
                options.body = JSON.stringify({
                    studentId: 'TEST001',
                    reason: 'test_complete',
                    clientTime: Date.now()
                });
            } else if (endpoint.url.includes('/refresh-profile')) {
                options.body = JSON.stringify({
                    userId: 'TEST001',
                    role: 'student'
                });
            }
        }
        
        const startTime = Date.now();
        const response = await fetch(url, options);
        const responseTime = Date.now() - startTime;
        const status = response.status;
        
        let result = 'UNKNOWN';
        let responseData = null;
        
        try {
            responseData = await response.json();
        } catch (e) {
            // Response might not be JSON
        }
        
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
            critical: endpoint.critical,
            status: status,
            result: result,
            responseTime: responseTime,
            url: url,
            responseData: responseData
        };
        
    } catch (error) {
        return {
            endpoint: `${endpoint.method} ${endpoint.url}`,
            description: endpoint.description,
            category: endpoint.category,
            critical: endpoint.critical,
            status: 'ERROR',
            result: 'NETWORK_ERROR',
            error: error.message,
            url: `${SERVER_URL}${endpoint.url}`
        };
    }
}

async function testProductionServer() {
    console.log('🌐 Testing Production Server APIs...');
    console.log(`🔗 Server: ${SERVER_URL}`);
    console.log('=' .repeat(100));
    
    const results = [];
    const categories = {};
    let criticalPassed = 0;
    let criticalTotal = 0;
    
    for (const endpoint of PRODUCTION_ENDPOINTS) {
        const result = await testProductionEndpoint(endpoint);
        results.push(result);
        
        // Track critical endpoints
        if (endpoint.critical) {
            criticalTotal++;
            if (result.result === 'PASS') {
                criticalPassed++;
            }
        }
        
        // Group by category
        if (!categories[result.category]) {
            categories[result.category] = [];
        }
        categories[result.category].push(result);
        
        const statusEmoji = result.result === 'PASS' ? '✅' : 
                           result.result === 'NOT_FOUND' ? '❌' : 
                           result.result === 'CLIENT_ERROR' ? '⚠️' : 
                           result.result === 'SERVER_ERROR' ? '🔥' : '💥';
        
        const criticalMark = endpoint.critical ? '🔥' : '  ';
        const responseTimeStr = result.responseTime ? `${result.responseTime}ms` : 'N/A';
        
        console.log(`${statusEmoji}${criticalMark} ${result.endpoint.padEnd(50)} | ${result.status.toString().padEnd(3)} | ${responseTimeStr.padEnd(8)} | ${result.description}`);
        
        // Delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('=' .repeat(100));
    
    // Critical endpoints summary
    const criticalSuccessRate = ((criticalPassed / criticalTotal) * 100).toFixed(1);
    console.log(`\n🔥 CRITICAL ENDPOINTS: ${criticalPassed}/${criticalTotal} (${criticalSuccessRate}%)`);
    
    // Category-wise summary
    console.log('\n📊 CATEGORY-WISE SUMMARY:');
    Object.keys(categories).forEach(category => {
        const categoryResults = categories[category];
        const passed = categoryResults.filter(r => r.result === 'PASS').length;
        const total = categoryResults.length;
        const percentage = ((passed / total) * 100).toFixed(1);
        
        const emoji = category === 'NEW' ? '🆕' : '📂';
        console.log(`${emoji} ${category.padEnd(15)} | ${passed}/${total} (${percentage}%)`);
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
    
    console.log(`\n🚀 PRODUCTION SUCCESS RATE: ${successRate}% (${workingEndpoints}/${totalEndpoints})`);
    
    // Performance analysis
    const passedResults = results.filter(r => r.result === 'PASS' && r.responseTime);
    if (passedResults.length > 0) {
        const avgResponseTime = passedResults.reduce((sum, r) => sum + r.responseTime, 0) / passedResults.length;
        const maxResponseTime = Math.max(...passedResults.map(r => r.responseTime));
        const minResponseTime = Math.min(...passedResults.map(r => r.responseTime));
        
        console.log('\n⚡ PERFORMANCE ANALYSIS:');
        console.log(`📊 Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`🚀 Fastest Response: ${minResponseTime}ms`);
        console.log(`🐌 Slowest Response: ${maxResponseTime}ms`);
    }
    
    // New endpoints status
    const newEndpoints = results.filter(r => r.category === 'NEW');
    const newPassed = newEndpoints.filter(r => r.result === 'PASS').length;
    console.log(`\n🆕 NEW ENDPOINTS STATUS: ${newPassed}/${newEndpoints.length} working`);
    
    // Failed endpoints
    const failedEndpoints = results.filter(r => r.result !== 'PASS');
    if (failedEndpoints.length > 0) {
        console.log('\n❌ FAILED ENDPOINTS:');
        failedEndpoints.forEach(endpoint => {
            const criticalMark = endpoint.critical ? '🔥 CRITICAL' : '';
            console.log(`   ${endpoint.endpoint} - ${endpoint.result} (${endpoint.status}) ${criticalMark}`);
        });
    }
    
    // Deployment status
    console.log('\n🌐 DEPLOYMENT STATUS:');
    if (criticalSuccessRate >= 90) {
        console.log('✅ PRODUCTION READY - Critical endpoints working');
    } else if (criticalSuccessRate >= 75) {
        console.log('⚠️ MOSTLY READY - Some critical issues need attention');
    } else {
        console.log('❌ NOT READY - Major issues detected');
    }
    
    return results;
}

// Run the production tests
testProductionServer().catch(console.error);