// Quick API Test for Critical Admin Panel Endpoints
const SERVER_URL = 'http://localhost:3000';

const CRITICAL_ENDPOINTS = [
    'GET /api/health',
    'GET /api/students',
    'GET /api/teachers', 
    'GET /api/departments',
    'GET /api/classrooms',
    'GET /api/settings/attendance-threshold',
    'GET /api/holidays',
    'GET /api/attendance/records',
    'GET /api/timetables',
    'GET /api/subjects'
];

async function quickTest() {
    console.log('🚀 Quick API Test for Admin Panel\n');
    
    for (const endpoint of CRITICAL_ENDPOINTS) {
        const [method, path] = endpoint.split(' ');
        try {
            const response = await fetch(`${SERVER_URL}${path}`);
            const status = response.status;
            const emoji = status >= 200 && status < 300 ? '✅' : '❌';
            console.log(`${emoji} ${endpoint.padEnd(40)} - ${status}`);
        } catch (error) {
            console.log(`💥 ${endpoint.padEnd(40)} - ERROR: ${error.message}`);
        }
    }
}

quickTest();