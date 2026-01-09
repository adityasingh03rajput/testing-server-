const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const tests = [
    // Core Server APIs
    { name: 'Health Check', method: 'GET', url: '/api/health' },
    { name: 'Server Time', method: 'GET', url: '/api/time' },
    { name: 'Config (SDUI)', method: 'GET', url: '/api/config' },
    
    // Student APIs (Admin Panel)
    { name: 'All Students (Admin Panel)', method: 'GET', url: '/api/students?all=true' },
    { name: 'Students Paginated', method: 'GET', url: '/api/students?page=1&limit=10' },
    { name: 'Students by Semester', method: 'GET', url: '/api/students?semester=3&all=true' },
    { name: 'Students Search', method: 'GET', url: '/api/students?search=ADITYA&all=true' },
    { name: 'View Records Students', method: 'GET', url: '/api/view-records/students?semester=3&branch=B.Tech Computer Science' },
    
    // Teacher APIs
    { name: 'All Teachers', method: 'GET', url: '/api/teachers' },
    { name: 'Teachers by Semester', method: 'GET', url: '/api/teachers?semester=3' },
    
    // Timetable APIs (Mobile App)
    { name: 'All Timetables', method: 'GET', url: '/api/timetables' },
    { name: 'Specific Timetable', method: 'GET', url: '/api/timetable/3/B.Tech Computer Science' },
    
    // Attendance APIs (Mobile App)
    { name: 'Attendance Sessions', method: 'GET', url: '/api/attendance/sessions' },
    { name: 'Attendance Records', method: 'GET', url: '/api/attendance/records' },
    
    // Subject APIs
    { name: 'All Subjects', method: 'GET', url: '/api/subjects' },
    { name: 'Subjects by Semester', method: 'GET', url: '/api/subjects?semester=3' },
    
    // Classroom APIs (WiFi Attendance)
    { name: 'All Classrooms', method: 'GET', url: '/api/classrooms' },
    { name: 'Classroom by Room', method: 'GET', url: '/api/classrooms/CR101' },
    
    // Student Management (Individual)
    { name: 'Student Management Query', method: 'GET', url: '/api/student-management?enrollmentNo=2024CSE05001' },
    
    // Face Verification (Mobile App)
    { name: 'Face Verification Endpoint', method: 'GET', url: '/api/face-verification/status' },
];

async function runComprehensiveTest() {
    console.log('🧪 COMPREHENSIVE API TEST - Admin Panel & Mobile App');
    console.log('=' .repeat(60));
    
    const results = {
        passed: 0,
        failed: 0,
        details: []
    };
    
    for (const test of tests) {
        try {
            const startTime = Date.now();
            const response = await axios({
                method: test.method,
                url: `${BASE_URL}${test.url}`,
                timeout: 10000
            });
            
            const duration = Date.now() - startTime;
            const status = response.status;
            const dataSize = JSON.stringify(response.data).length;
            
            if (status >= 200 && status < 300) {
                console.log(`✅ ${test.name}`);
                console.log(`   Status: ${status} | Duration: ${duration}ms | Data: ${dataSize} bytes`);
                
                // Show sample data for key endpoints
                if (test.url.includes('/api/students?all=true')) {
                    console.log(`   📊 Students Count: ${response.data.students?.length || 0}`);
                } else if (test.url.includes('/api/teachers')) {
                    console.log(`   👥 Teachers Count: ${response.data.teachers?.length || 0}`);
                } else if (test.url.includes('/api/timetables')) {
                    console.log(`   📅 Timetables Count: ${response.data.timetables?.length || 0}`);
                } else if (test.url.includes('/api/classrooms')) {
                    console.log(`   🏫 Classrooms Count: ${response.data.classrooms?.length || 0}`);
                }
                
                results.passed++;
                results.details.push({ test: test.name, status: 'PASS', code: status, duration });
            } else {
                console.log(`⚠️  ${test.name} - Unexpected status: ${status}`);
                results.failed++;
                results.details.push({ test: test.name, status: 'WARN', code: status, duration });
            }
            
        } catch (error) {
            console.log(`❌ ${test.name}`);
            console.log(`   Error: ${error.response?.status || error.code} - ${error.message}`);
            results.failed++;
            results.details.push({ 
                test: test.name, 
                status: 'FAIL', 
                error: error.response?.status || error.code 
            });
        }
        
        console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(30));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / tests.length) * 100).toFixed(1)}%`);
    
    // Categorize by usage
    console.log('\n🎯 API USAGE BREAKDOWN');
    console.log('=' .repeat(30));
    
    const adminPanelAPIs = results.details.filter(r => 
        r.test.includes('Students') || 
        r.test.includes('Teachers') || 
        r.test.includes('View Records')
    );
    
    const mobileAppAPIs = results.details.filter(r => 
        r.test.includes('Timetable') || 
        r.test.includes('Attendance') || 
        r.test.includes('Face') || 
        r.test.includes('Config')
    );
    
    const sharedAPIs = results.details.filter(r => 
        r.test.includes('Health') || 
        r.test.includes('Time') || 
        r.test.includes('Subjects') || 
        r.test.includes('Classrooms')
    );
    
    console.log(`📱 Admin Panel APIs: ${adminPanelAPIs.filter(a => a.status === 'PASS').length}/${adminPanelAPIs.length} working`);
    console.log(`📲 Mobile App APIs: ${mobileAppAPIs.filter(a => a.status === 'PASS').length}/${mobileAppAPIs.length} working`);
    console.log(`🔄 Shared APIs: ${sharedAPIs.filter(a => a.status === 'PASS').length}/${sharedAPIs.length} working`);
    
    return results;
}

// Run the test
runComprehensiveTest().catch(console.error);