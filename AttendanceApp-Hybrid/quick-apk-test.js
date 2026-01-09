// Quick APK API Test for Critical Endpoints
const SERVER_URL = 'http://localhost:3000';

const CRITICAL_APK_ENDPOINTS = [
    'GET /api/health',
    'GET /api/time', 
    'GET /api/config',
    'GET /api/config/app',
    'POST /api/login',
    'GET /api/student-management',
    'GET /api/teachers',
    'GET /api/classrooms',
    'GET /api/timetable/3/B.Tech%20Data%20Science',
    'POST /api/attendance/update-timer',
    'POST /api/verify-face'
];

async function quickAPKTest() {
    console.log('🚀 Quick APK API Test for Critical Endpoints\n');
    
    let passed = 0;
    let total = 0;
    
    for (const endpoint of CRITICAL_APK_ENDPOINTS) {
        const [method, path] = endpoint.split(' ');
        total++;
        
        try {
            const options = { method };
            
            // Add body for POST requests
            if (method === 'POST') {
                options.headers = { 'Content-Type': 'application/json' };
                
                if (path.includes('/login')) {
                    options.body = JSON.stringify({ id: 'TEST001', password: 'test123' });
                } else if (path.includes('/attendance/update-timer')) {
                    options.body = JSON.stringify({ studentId: 'TEST001', timerValue: 1800, wifiConnected: true });
                } else if (path.includes('/verify-face')) {
                    options.body = JSON.stringify({ userId: 'TEST001', capturedImage: 'data:image/jpeg;base64,test' });
                }
            }
            
            // Add query params for specific endpoints
            let url = `${SERVER_URL}${path}`;
            if (path.includes('/student-management')) {
                url += '?enrollmentNo=TEST001';
            }
            
            const response = await fetch(url, options);
            const status = response.status;
            const emoji = status >= 200 && status < 300 ? '✅' : '❌';
            
            if (status >= 200 && status < 300) passed++;
            
            console.log(`${emoji} ${endpoint.padEnd(45)} - ${status}`);
        } catch (error) {
            console.log(`💥 ${endpoint.padEnd(45)} - ERROR: ${error.message}`);
        }
    }
    
    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`\n🎯 APK API SUCCESS RATE: ${successRate}% (${passed}/${total})`);
}

quickAPKTest();