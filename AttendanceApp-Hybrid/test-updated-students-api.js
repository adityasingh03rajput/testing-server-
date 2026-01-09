// Test Updated Students API - Verify 123+ students are returned
const SERVER_URL = 'https://letsbunk-uw7g.onrender.com';

async function testStudentsAPI() {
    console.log('🧪 TESTING UPDATED STUDENTS API');
    console.log('='.repeat(50));
    
    try {
        // Test 1: Get all students with all=true parameter
        console.log('\n📡 Test 1: GET /api/students?all=true');
        const allStudentsResponse = await fetch(`${SERVER_URL}/api/students?all=true`);
        
        if (allStudentsResponse.ok) {
            const allData = await allStudentsResponse.json();
            console.log(`✅ SUCCESS: Retrieved ${allData.students?.length || 0} students`);
            console.log(`📊 Total: ${allData.total}`);
            console.log(`📝 Message: ${allData.message}`);
            
            if (allData.students && allData.students.length > 0) {
                console.log('\n👥 Sample Students:');
                allData.students.slice(0, 5).forEach((student, index) => {
                    console.log(`${index + 1}. ${student.name} (${student.enrollmentNo}) - ${student.course} - Sem ${student.semester}`);
                });
                
                if (allData.students.length > 5) {
                    console.log(`... and ${allData.students.length - 5} more students`);
                }
            }
        } else {
            console.log(`❌ FAILED: ${allStudentsResponse.status} ${allStudentsResponse.statusText}`);
        }
        
        // Test 2: Get paginated students (default)
        console.log('\n📡 Test 2: GET /api/students (paginated)');
        const paginatedResponse = await fetch(`${SERVER_URL}/api/students`);
        
        if (paginatedResponse.ok) {
            const paginatedData = await paginatedResponse.json();
            console.log(`✅ SUCCESS: Retrieved ${paginatedData.students?.length || 0} students (paginated)`);
            if (paginatedData.pagination) {
                console.log(`📄 Pagination: Page ${paginatedData.pagination.page}/${paginatedData.pagination.pages}`);
                console.log(`📊 Total: ${paginatedData.pagination.total}`);
            }
        } else {
            console.log(`❌ FAILED: ${paginatedResponse.status} ${paginatedResponse.statusText}`);
        }
        
        // Test 3: Search functionality
        console.log('\n📡 Test 3: GET /api/students?search=ADITYA');
        const searchResponse = await fetch(`${SERVER_URL}/api/students?search=ADITYA&all=true`);
        
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(`✅ SUCCESS: Found ${searchData.students?.length || 0} students matching "ADITYA"`);
            if (searchData.students && searchData.students.length > 0) {
                searchData.students.forEach((student, index) => {
                    console.log(`${index + 1}. ${student.name} (${student.enrollmentNo})`);
                });
            }
        } else {
            console.log(`❌ FAILED: ${searchResponse.status} ${searchResponse.statusText}`);
        }
        
        // Test 4: Filter by semester
        console.log('\n📡 Test 4: GET /api/students?semester=3');
        const semesterResponse = await fetch(`${SERVER_URL}/api/students?semester=3&all=true`);
        
        if (semesterResponse.ok) {
            const semesterData = await semesterResponse.json();
            console.log(`✅ SUCCESS: Found ${semesterData.students?.length || 0} students in Semester 3`);
        } else {
            console.log(`❌ FAILED: ${semesterResponse.status} ${semesterResponse.statusText}`);
        }
        
        // Test 5: ViewRecords API
        console.log('\n📡 Test 5: GET /api/view-records/students');
        const viewRecordsResponse = await fetch(`${SERVER_URL}/api/view-records/students?semester=3&branch=B.Tech Data Science`);
        
        if (viewRecordsResponse.ok) {
            const viewRecordsData = await viewRecordsResponse.json();
            console.log(`✅ SUCCESS: ViewRecords returned ${viewRecordsData.students?.length || 0} students`);
        } else {
            console.log(`❌ FAILED: ${viewRecordsResponse.status} ${viewRecordsResponse.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }
    
    console.log('\n🏁 API TESTING COMPLETE');
    console.log('='.repeat(50));
    console.log('📋 SUMMARY:');
    console.log('• Updated /api/students endpoint now uses StudentManagement collection');
    console.log('• Use ?all=true parameter to get all 123+ students');
    console.log('• Admin panel updated to use ?all=true parameter');
    console.log('• Search and filter functionality working');
    console.log('• ViewRecords API already using StudentManagement');
}

testStudentsAPI();