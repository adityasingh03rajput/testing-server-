#!/usr/bin/env node

/**
 * List All API Endpoints - Google Render Server
 * 
 * This script lists all available API endpoints from the attendance system
 * deployed on Google Render server.
 * 
 * Usage: node list-all-endpoints.js
 */

const axios = require('axios');

// Google Render Server URL (from your deployment)
const BASE_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

// All API endpoints discovered from server.js
const ENDPOINTS = [
    // ========================================
    // CONFIGURATION & HEALTH
    // ========================================
    {
        method: 'GET',
        path: '/',
        description: 'Root endpoint - API server info',
        category: 'System'
    },
    {
        method: 'GET',
        path: '/api/health',
        description: 'Health check endpoint',
        category: 'System'
    },
    {
        method: 'GET',
        path: '/api/time',
        description: 'Server time synchronization',
        category: 'System'
    },
    {
        method: 'GET',
        path: '/api/config',
        description: 'SDUI Configuration for mobile app',
        category: 'Configuration'
    },
    {
        method: 'GET',
        path: '/api/config/branches',
        description: 'Get available branches (dynamic)',
        category: 'Configuration'
    },
    {
        method: 'GET',
        path: '/api/config/semesters',
        description: 'Get available semesters (dynamic)',
        category: 'Configuration'
    },
    {
        method: 'GET',
        path: '/api/config/academic-year',
        description: 'Get current academic year (calculated)',
        category: 'Configuration'
    },
    {
        method: 'GET',
        path: '/api/config/app',
        description: 'Get app configuration (all dynamic settings)',
        category: 'Configuration'
    },

    // ========================================
    // AUTHENTICATION
    // ========================================
    {
        method: 'POST',
        path: '/api/login',
        description: 'Login endpoint for students and teachers',
        category: 'Authentication',
        body: { id: 'string', password: 'string' }
    },

    // ========================================
    // STUDENT MANAGEMENT
    // ========================================
    {
        method: 'POST',
        path: '/api/student/register',
        description: 'Register new student (legacy)',
        category: 'Student Management',
        body: { name: 'string' }
    },
    {
        method: 'GET',
        path: '/api/students',
        description: 'Get all students',
        category: 'Student Management'
    },
    {
        method: 'GET',
        path: '/api/student-management',
        description: 'Get single student by enrollment number',
        category: 'Student Management',
        query: { enrollmentNo: 'string' }
    },
    {
        method: 'GET',
        path: '/api/view-records/students',
        description: 'Get students by semester and branch (for ViewRecords screen)',
        category: 'Student Management',
        query: { semester: 'string', branch: 'string' }
    },
    {
        method: 'POST',
        path: '/api/students',
        description: 'Create new student',
        category: 'Student Management',
        body: { enrollmentNo: 'string', name: 'string', email: 'string', password: 'string', course: 'string', semester: 'string', dob: 'date', phone: 'string' }
    },
    {
        method: 'POST',
        path: '/api/students/bulk',
        description: 'Bulk import students',
        category: 'Student Management',
        body: { students: 'array' }
    },
    {
        method: 'PUT',
        path: '/api/students/:id',
        description: 'Update student by ID',
        category: 'Student Management'
    },
    {
        method: 'DELETE',
        path: '/api/students/:id',
        description: 'Delete student by ID',
        category: 'Student Management'
    },
    {
        method: 'GET',
        path: '/api/debug/timer-calc/:enrollmentNo',
        description: 'Debug endpoint to test timer calculation',
        category: 'Student Management'
    },

    // ========================================
    // TEACHER MANAGEMENT
    // ========================================
    {
        method: 'GET',
        path: '/api/teachers',
        description: 'Get all teachers',
        category: 'Teacher Management'
    },
    {
        method: 'POST',
        path: '/api/teachers',
        description: 'Create new teacher',
        category: 'Teacher Management',
        body: { employeeId: 'string', name: 'string', email: 'string', password: 'string', department: 'string', subject: 'string', dob: 'date', phone: 'string' }
    },
    {
        method: 'POST',
        path: '/api/teachers/bulk',
        description: 'Bulk import teachers',
        category: 'Teacher Management',
        body: { teachers: 'array' }
    },
    {
        method: 'PUT',
        path: '/api/teachers/:id',
        description: 'Update teacher by ID',
        category: 'Teacher Management'
    },
    {
        method: 'PUT',
        path: '/api/teachers/:id/timetable-access',
        description: 'Update teacher timetable access permissions',
        category: 'Teacher Management',
        body: { canEditTimetable: 'boolean' }
    },
    {
        method: 'DELETE',
        path: '/api/teachers/:id',
        description: 'Delete teacher by ID',
        category: 'Teacher Management'
    },
    {
        method: 'GET',
        path: '/api/teacher/current-lecture/:teacherId',
        description: 'Get current lecture for a teacher based on time and timetable',
        category: 'Teacher Management'
    },
    {
        method: 'GET',
        path: '/api/teacher/allowed-branches/:teacherId',
        description: 'Get allowed branches for a teacher (branches they teach)',
        category: 'Teacher Management'
    },
    {
        method: 'GET',
        path: '/api/teacher/current-class-students/:teacherId',
        description: 'Get Teacher\'s Current Class Students (Role-based filtering)',
        category: 'Teacher Management'
    },
    {
        method: 'GET',
        path: '/api/teacher-schedule/:teacherId/:day',
        description: 'Get teacher schedule for specific day',
        category: 'Teacher Management'
    },

    // ========================================
    // TIMETABLE MANAGEMENT
    // ========================================
    {
        method: 'GET',
        path: '/api/timetables',
        description: 'Get all timetables (for conflict checking)',
        category: 'Timetable'
    },
    {
        method: 'GET',
        path: '/api/timetable/:semester/:branch',
        description: 'Get timetable for specific semester and branch',
        category: 'Timetable'
    },
    {
        method: 'POST',
        path: '/api/timetable',
        description: 'Create/update timetable',
        category: 'Timetable',
        body: { semester: 'string', branch: 'string', periods: 'array', timetable: 'object' }
    },
    {
        method: 'PUT',
        path: '/api/timetable/:semester/:branch',
        description: 'Update timetable (used by mobile app)',
        category: 'Timetable',
        body: { timetable: 'object', periods: 'array' }
    },
    {
        method: 'POST',
        path: '/api/periods/update-all',
        description: 'Update periods for ALL timetables',
        category: 'Timetable',
        body: { periods: 'array' }
    },

    // ========================================
    // SUBJECT MANAGEMENT
    // ========================================
    {
        method: 'GET',
        path: '/api/subjects',
        description: 'Get all subjects (with optional filters)',
        category: 'Subject Management',
        query: { semester: 'string', branch: 'string', isActive: 'boolean' }
    },
    {
        method: 'GET',
        path: '/api/subjects/:subjectCode',
        description: 'Get single subject by code',
        category: 'Subject Management'
    },
    {
        method: 'POST',
        path: '/api/subjects',
        description: 'Create new subject',
        category: 'Subject Management',
        body: { subjectCode: 'string', subjectName: 'string', shortName: 'string', semester: 'string', branch: 'string', credits: 'number', type: 'string', description: 'string' }
    },
    {
        method: 'PUT',
        path: '/api/subjects/:subjectCode',
        description: 'Update subject',
        category: 'Subject Management'
    },
    {
        method: 'DELETE',
        path: '/api/subjects/:subjectCode',
        description: 'Delete subject',
        category: 'Subject Management'
    },
    {
        method: 'GET',
        path: '/api/subjects/grouped/by-semester-branch',
        description: 'Get subjects grouped by semester and branch',
        category: 'Subject Management'
    },

    // ========================================
    // ATTENDANCE SYSTEM (NEW)
    // ========================================
    {
        method: 'POST',
        path: '/api/attendance/start-session',
        description: 'Face Verification & Timer Start',
        category: 'Attendance System',
        body: { studentId: 'string', studentName: 'string', enrollmentNo: 'string', semester: 'string', branch: 'string', faceData: 'string' }
    },
    {
        method: 'POST',
        path: '/api/attendance/update-timer',
        description: 'Update Timer (Heartbeat every 5 minutes)',
        category: 'Attendance System',
        body: { studentId: 'string', timerValue: 'number', wifiConnected: 'boolean' }
    },
    {
        method: 'POST',
        path: '/api/attendance/lecture-start',
        description: 'Lecture Started (Called by server when lecture begins)',
        category: 'Attendance System',
        body: { period: 'string', subject: 'string', teacher: 'string', teacherName: 'string', room: 'string', startTime: 'string', endTime: 'string', semester: 'string', branch: 'string' }
    },
    {
        method: 'POST',
        path: '/api/attendance/lecture-end',
        description: 'Lecture Ended (Calculate and save attendance)',
        category: 'Attendance System',
        body: { period: 'string', subject: 'string', semester: 'string', branch: 'string' }
    },
    {
        method: 'POST',
        path: '/api/attendance/add-verification',
        description: 'Add Face Verification Event',
        category: 'Attendance System',
        body: { studentId: 'string', period: 'string', verificationType: 'string', event: 'string' }
    },

    // ========================================
    // ATTENDANCE SYSTEM (LEGACY)
    // ========================================
    {
        method: 'POST',
        path: '/api/attendance/record',
        description: 'Save attendance record (legacy)',
        category: 'Attendance Legacy',
        body: { studentId: 'string', studentName: 'string', enrollmentNo: 'string', status: 'string', timerValue: 'number', semester: 'string', branch: 'string' }
    },
    {
        method: 'GET',
        path: '/api/attendance/records',
        description: 'Get attendance records with filters',
        category: 'Attendance Legacy',
        query: { studentId: 'string', startDate: 'string', endDate: 'string', semester: 'string', branch: 'string' }
    },
    {
        method: 'POST',
        path: '/api/attendance/backup',
        description: '5-minute backup: Save attended minutes for recovery',
        category: 'Attendance Legacy',
        body: { studentId: 'string', enrollmentNo: 'string', studentName: 'string', semester: 'string', branch: 'string', attendedMinutes: 'number', currentClass: 'string', timestamp: 'string', isRunning: 'boolean', status: 'string' }
    },
    {
        method: 'POST',
        path: '/api/attendance/sync-offline',
        description: 'Offline Attendance Sync - Sync offline time when student reconnects',
        category: 'Attendance Legacy',
        body: { studentId: 'string', offlineStartTime: 'string', offlineEndTime: 'string', offlineDuration: 'number', lastKnownSeconds: 'number', lectureSubject: 'string' }
    },
    {
        method: 'GET',
        path: '/api/attendance/stats',
        description: 'Get attendance statistics',
        category: 'Attendance Legacy',
        query: { studentId: 'string', semester: 'string', branch: 'string', startDate: 'string', endDate: 'string' }
    },
    {
        method: 'GET',
        path: '/api/attendance/date/:date',
        description: 'Get students attendance for a specific date (for teachers)',
        category: 'Attendance Legacy'
    },

    // ========================================
    // FACE VERIFICATION
    // ========================================
    {
        method: 'POST',
        path: '/api/verify-face',
        description: 'Face Verification API - Using face-api.js only',
        category: 'Face Verification',
        body: { userId: 'string', capturedImage: 'string' }
    },
    {
        method: 'GET',
        path: '/api/face-descriptor/:userId',
        description: 'Get face descriptor for client-side verification (encrypted)',
        category: 'Face Verification'
    },
    {
        method: 'POST',
        path: '/api/verify-face-proof',
        description: 'Verify face proof from client (cryptographic verification)',
        category: 'Face Verification',
        body: { userId: 'string', timestamp: 'string', match: 'boolean', confidence: 'number', descriptorHash: 'string', serverTimeISO: 'string', signature: 'string' }
    },

    // ========================================
    // PHOTO MANAGEMENT
    // ========================================
    {
        method: 'POST',
        path: '/api/upload-photo',
        description: 'Photo upload endpoint',
        category: 'Photo Management',
        body: { photoData: 'string', type: 'string', id: 'string' }
    },
    {
        method: 'GET',
        path: '/api/photo/:filename',
        description: 'Get photo by filename (for testing)',
        category: 'Photo Management'
    }
];

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function getMethodColor(method) {
    switch (method) {
        case 'GET': return 'green';
        case 'POST': return 'yellow';
        case 'PUT': return 'blue';
        case 'DELETE': return 'red';
        default: return 'white';
    }
}

async function testEndpoint(endpoint) {
    try {
        const url = `${BASE_URL}${endpoint.path}`;
        
        // Only test GET endpoints that don't require parameters
        if (endpoint.method === 'GET' && !endpoint.path.includes(':')) {
            const response = await axios.get(url, { timeout: 5000 });
            return { status: response.status, success: true };
        }
        
        return { status: 'N/A', success: null, reason: 'Requires parameters or not GET' };
    } catch (error) {
        if (error.response) {
            return { status: error.response.status, success: false };
        }
        return { status: 'ERROR', success: false, reason: error.message };
    }
}

async function main() {
    console.log(colorize('\n🌐 ATTENDANCE SYSTEM API ENDPOINTS', 'bright'));
    console.log(colorize(`📍 Server: ${BASE_URL}`, 'cyan'));
    console.log(colorize(`📊 Total Endpoints: ${ENDPOINTS.length}`, 'cyan'));
    console.log('='.repeat(80));

    // Group endpoints by category
    const categories = {};
    ENDPOINTS.forEach(endpoint => {
        if (!categories[endpoint.category]) {
            categories[endpoint.category] = [];
        }
        categories[endpoint.category].push(endpoint);
    });

    // Test server connectivity first
    console.log(colorize('\n🔍 Testing Server Connectivity...', 'bright'));
    try {
        const healthCheck = await axios.get(`${BASE_URL}/api/health`, { timeout: 10000 });
        console.log(colorize(`✅ Server is online! Status: ${healthCheck.status}`, 'green'));
        console.log(colorize(`📋 Response: ${JSON.stringify(healthCheck.data)}`, 'dim'));
    } catch (error) {
        console.log(colorize(`❌ Server connectivity issue: ${error.message}`, 'red'));
        console.log(colorize('⚠️  Endpoint testing will be limited', 'yellow'));
    }

    // Display endpoints by category
    for (const [categoryName, endpoints] of Object.entries(categories)) {
        console.log(colorize(`\n📂 ${categoryName.toUpperCase()} (${endpoints.length} endpoints)`, 'bright'));
        console.log('-'.repeat(60));

        for (const endpoint of endpoints) {
            const methodColor = getMethodColor(endpoint.method);
            const methodText = colorize(endpoint.method.padEnd(6), methodColor);
            const pathText = colorize(endpoint.path, 'white');
            
            console.log(`${methodText} ${pathText}`);
            console.log(colorize(`       ${endpoint.description}`, 'dim'));
            
            if (endpoint.query) {
                console.log(colorize(`       Query: ${JSON.stringify(endpoint.query)}`, 'cyan'));
            }
            
            if (endpoint.body) {
                console.log(colorize(`       Body: ${JSON.stringify(endpoint.body)}`, 'magenta'));
            }
            
            console.log(); // Empty line for spacing
        }
    }

    // Test some key endpoints
    console.log(colorize('\n🧪 Testing Key Endpoints...', 'bright'));
    console.log('-'.repeat(40));

    const testEndpoints = [
        '/api/health',
        '/api/time',
        '/api/config',
        '/api/config/branches',
        '/api/config/semesters',
        '/api/students',
        '/api/teachers',
        '/api/subjects',
        '/api/timetables'
    ];

    for (const path of testEndpoints) {
        const endpoint = ENDPOINTS.find(e => e.path === path && e.method === 'GET');
        if (endpoint) {
            const result = await testEndpoint(endpoint);
            const statusColor = result.success === true ? 'green' : 
                               result.success === false ? 'red' : 'yellow';
            
            console.log(`${colorize('GET'.padEnd(6), 'green')} ${path.padEnd(30)} ${colorize(result.status, statusColor)}`);
            
            if (result.reason) {
                console.log(colorize(`       ${result.reason}`, 'dim'));
            }
        }
    }

    // Summary
    console.log(colorize('\n📈 SUMMARY', 'bright'));
    console.log('='.repeat(40));
    console.log(`🌐 Server URL: ${BASE_URL}`);
    console.log(`📊 Total Endpoints: ${ENDPOINTS.length}`);
    console.log(`📂 Categories: ${Object.keys(categories).length}`);
    
    const methodCounts = {};
    ENDPOINTS.forEach(e => {
        methodCounts[e.method] = (methodCounts[e.method] || 0) + 1;
    });
    
    console.log('\n📋 Endpoints by Method:');
    Object.entries(methodCounts).forEach(([method, count]) => {
        const color = getMethodColor(method);
        console.log(`   ${colorize(method, color)}: ${count}`);
    });

    console.log('\n📂 Endpoints by Category:');
    Object.entries(categories).forEach(([category, endpoints]) => {
        console.log(`   ${category}: ${endpoints.length}`);
    });

    console.log(colorize('\n✅ Endpoint listing complete!', 'green'));
    console.log(colorize('💡 Use this information to integrate with the attendance system API', 'cyan'));
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error(colorize(`❌ Error: ${error.message}`, 'red'));
        process.exit(1);
    });
}

module.exports = { ENDPOINTS, BASE_URL };