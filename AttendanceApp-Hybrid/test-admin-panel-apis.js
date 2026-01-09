// Admin Panel API Endpoint Testing Script
// Tests all API endpoints used by the admin panel

const SERVER_URL = 'http://localhost:3000';

// List of all admin panel API endpoints extracted from renderer.js
const API_ENDPOINTS = [
    // Health and Config
    { method: 'GET', url: '/api/health', description: 'Server health check' },
    { method: 'GET', url: '/api/config/branches', description: 'Get available branches' },
    
    // Students Management
    { method: 'GET', url: '/api/students', description: 'Get all students' },
    { method: 'POST', url: '/api/students', description: 'Add new student' },
    { method: 'POST', url: '/api/students/bulk', description: 'Bulk import students' },
    { method: 'PUT', url: '/api/students/:id', description: 'Update student' },
    { method: 'DELETE', url: '/api/students/:id', description: 'Delete student' },
    { method: 'GET', url: '/api/student-management', description: 'Get student by enrollment' },
    
    // Teachers Management
    { method: 'GET', url: '/api/teachers', description: 'Get all teachers' },
    { method: 'POST', url: '/api/teachers', description: 'Add new teacher' },
    { method: 'POST', url: '/api/teachers/bulk', description: 'Bulk import teachers' },
    { method: 'PUT', url: '/api/teachers/:id', description: 'Update teacher' },
    { method: 'DELETE', url: '/api/teachers/:id', description: 'Delete teacher' },
    { method: 'PUT', url: '/api/teachers/:id/timetable-access', description: 'Update teacher permissions' },
    
    // Departments Management
    { method: 'GET', url: '/api/departments', description: 'Get all departments' },
    
    // Classrooms Management
    { method: 'GET', url: '/api/classrooms', description: 'Get all classrooms' },
    { method: 'POST', url: '/api/classrooms', description: 'Add new classroom' },
    { method: 'PUT', url: '/api/classrooms/:id', description: 'Update classroom' },
    { method: 'DELETE', url: '/api/classrooms/:id', description: 'Delete classroom' },
    
    // Timetable Management
    { method: 'GET', url: '/api/timetables', description: 'Get all timetables' },
    { method: 'GET', url: '/api/timetable/:semester/:branch', description: 'Get specific timetable' },
    { method: 'POST', url: '/api/timetable', description: 'Create/update timetable' },
    
    // Subjects Management
    { method: 'GET', url: '/api/subjects', description: 'Get all subjects' },
    
    // Attendance Management
    { method: 'GET', url: '/api/attendance/records', description: 'Get attendance records' },
    { method: 'GET', url: '/api/attendance/date-range', description: 'Get attendance date range' },
    
    // Settings Management
    { method: 'GET', url: '/api/settings/attendance-threshold', description: 'Get attendance threshold' },
    { method: 'POST', url: '/api/settings/attendance-threshold', description: 'Update attendance threshold' },
    
    // Holidays Management
    { method: 'GET', url: '/api/holidays', description: 'Get all holidays' },
    { method: 'POST', url: '/api/holidays', description: 'Add new holiday' },
    { method: 'PUT', url: '/api/holidays/:index', description: 'Update holiday' },
    { method: 'DELETE', url: '/api/holidays/:index', description: 'Delete holiday' },
    
    // Periods Management
    { method: 'POST', url: '/api/periods/update-all', description: 'Update all periods' },
    
    // Photo Upload
    { method: 'POST', url: '/api/upload-photo', description: 'Upload profile photo' }
];

async function testEndpoint(endpoint) {
    try {
        let url = `${SERVER_URL}${endpoint.url}`;
        
        // Replace placeholders with test values
        url = url.replace(':id', '507f1f77bcf86cd799439011'); // Sample MongoDB ObjectId
        url = url.replace(':semester', '3');
        url = url.replace(':branch', 'B.Tech%20Data%20Science');
        url = url.replace(':index', '0');
        
        const options = {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Add sample body for POST/PUT requests
        if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
            if (endpoint.url.includes('/students')) {
                options.body = JSON.stringify({
                    name: 'Test Student',
                    enrollmentNo: 'TEST001',
                    email: 'test@example.com',
                    password: 'test123',
                    course: 'B.Tech Data Science',
                    semester: '3',
                    dob: '2000-01-01'
                });
            } else if (endpoint.url.includes('/teachers')) {
                options.body = JSON.stringify({
                    name: 'Test Teacher',
                    employeeId: 'TEACH001',
                    email: 'teacher@example.com',
                    password: 'test123',
                    department: 'CSE',
                    subject: 'Test Subject',
                    dob: '1980-01-01'
                });
            } else if (endpoint.url.includes('/classrooms')) {
                options.body = JSON.stringify({
                    name: 'Test Room',
                    building: 'Test Building',
                    capacity: 50,
                    type: 'Classroom'
                });
            } else if (endpoint.url.includes('/holidays')) {
                options.body = JSON.stringify({
                    name: 'Test Holiday',
                    date: '2026-12-25',
                    type: 'Institute'
                });
            } else if (endpoint.url.includes('/settings/attendance-threshold')) {
                options.body = JSON.stringify({
                    threshold: 75
                });
            } else if (endpoint.url.includes('/timetable-access')) {
                options.body = JSON.stringify({
                    canEditTimetable: true
                });
            } else if (endpoint.url.includes('/periods/update-all')) {
                options.body = JSON.stringify({
                    periods: [
                        { number: 1, startTime: '09:00', endTime: '09:50' },
                        { number: 2, startTime: '10:00', endTime: '10:50' }
                    ]
                });
            } else if (endpoint.url.includes('/upload-photo')) {
                options.body = JSON.stringify({
                    photoData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
                    type: 'student',
                    id: 'TEST001'
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
            status: status,
            result: result,
            url: url
        };
        
    } catch (error) {
        return {
            endpoint: `${endpoint.method} ${endpoint.url}`,
            description: endpoint.description,
            status: 'ERROR',
            result: 'NETWORK_ERROR',
            error: error.message,
            url: `${SERVER_URL}${endpoint.url}`
        };
    }
}

async function testAllEndpoints() {
    console.log('🧪 Testing Admin Panel API Endpoints...\n');
    console.log('=' .repeat(80));
    
    const results = [];
    
    for (const endpoint of API_ENDPOINTS) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        const statusEmoji = result.result === 'PASS' ? '✅' : 
                           result.result === 'NOT_FOUND' ? '❌' : 
                           result.result === 'CLIENT_ERROR' ? '⚠️' : 
                           result.result === 'SERVER_ERROR' ? '🔥' : '💥';
        
        console.log(`${statusEmoji} ${result.endpoint.padEnd(45)} | ${result.status.toString().padEnd(3)} | ${result.description}`);
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('=' .repeat(80));
    
    // Summary
    const summary = results.reduce((acc, result) => {
        acc[result.result] = (acc[result.result] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ PASS: ${summary.PASS || 0}`);
    console.log(`❌ NOT_FOUND: ${summary.NOT_FOUND || 0}`);
    console.log(`⚠️ CLIENT_ERROR: ${summary.CLIENT_ERROR || 0}`);
    console.log(`🔥 SERVER_ERROR: ${summary.SERVER_ERROR || 0}`);
    console.log(`💥 NETWORK_ERROR: ${summary.NETWORK_ERROR || 0}`);
    
    const totalEndpoints = results.length;
    const workingEndpoints = summary.PASS || 0;
    const successRate = ((workingEndpoints / totalEndpoints) * 100).toFixed(1);
    
    console.log(`\n🎯 SUCCESS RATE: ${successRate}% (${workingEndpoints}/${totalEndpoints})`);
    
    // List failed endpoints
    const failedEndpoints = results.filter(r => r.result !== 'PASS');
    if (failedEndpoints.length > 0) {
        console.log('\n❌ FAILED ENDPOINTS:');
        failedEndpoints.forEach(endpoint => {
            console.log(`   ${endpoint.endpoint} - ${endpoint.result} (${endpoint.status})`);
        });
    }
    
    return results;
}

// Run the tests
testAllEndpoints().catch(console.error);