// Test script to check student photo data
const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testStudentPhotos() {
    try {
        console.log('🧪 Testing Student Photo Data\n');
        
        // Test 1: Get students from view-records endpoint
        console.log('1️⃣ Testing view-records/students endpoint:');
        const response1 = await fetch(`${SERVER_URL}/api/view-records/students?semester=3&branch=Computer Science`);
        const data1 = await response1.json();
        
        if (data1.success && data1.students) {
            console.log(`   ✅ Found ${data1.students.length} students`);
            
            // Check first few students for photo data
            const studentsWithPhotos = data1.students.filter(s => s.photoUrl);
            console.log(`   📸 Students with photos: ${studentsWithPhotos.length}/${data1.students.length}`);
            
            if (data1.students.length > 0) {
                const firstStudent = data1.students[0];
                console.log(`   📋 Sample student data:`, {
                    name: firstStudent.name,
                    enrollmentNo: firstStudent.enrollmentNo,
                    photoUrl: firstStudent.photoUrl ? 'YES' : 'NO',
                    photoUrlLength: firstStudent.photoUrl ? firstStudent.photoUrl.length : 0,
                    allFields: Object.keys(firstStudent)
                });
                
                if (firstStudent.photoUrl) {
                    console.log(`   📸 Photo URL preview: ${firstStudent.photoUrl.substring(0, 100)}...`);
                }
            }
        } else {
            console.log('   ❌ Failed to get students:', data1.error);
        }
        
        // Test 2: Get students from current-class endpoint (if teacher ID available)
        console.log('\n2️⃣ Testing current-class-students endpoint:');
        try {
            // Try with a common teacher ID
            const response2 = await fetch(`${SERVER_URL}/api/teacher/current-class-students/TEACHER001`);
            const data2 = await response2.json();
            
            if (data2.success && data2.students) {
                console.log(`   ✅ Found ${data2.students.length} students in current class`);
                
                const studentsWithPhotos2 = data2.students.filter(s => s.photoUrl);
                console.log(`   📸 Students with photos: ${studentsWithPhotos2.length}/${data2.students.length}`);
                
                if (data2.students.length > 0) {
                    const firstStudent = data2.students[0];
                    console.log(`   📋 Sample student data:`, {
                        name: firstStudent.name,
                        enrollmentNo: firstStudent.enrollmentNo,
                        photoUrl: firstStudent.photoUrl ? 'YES' : 'NO',
                        photoUrlLength: firstStudent.photoUrl ? firstStudent.photoUrl.length : 0
                    });
                }
            } else {
                console.log('   ⏰ No active class or error:', data2.message || data2.error);
            }
        } catch (error) {
            console.log('   ❌ Error testing current-class endpoint:', error.message);
        }
        
        // Test 3: Check specific student
        console.log('\n3️⃣ Testing specific student lookup:');
        try {
            const response3 = await fetch(`${SERVER_URL}/api/student-management?enrollmentNo=0246CD241001`);
            const data3 = await response3.json();
            
            if (data3.success && data3.student) {
                console.log(`   ✅ Found student: ${data3.student.name}`);
                console.log(`   📸 Has photo: ${data3.student.photoUrl ? 'YES' : 'NO'}`);
                if (data3.student.photoUrl) {
                    console.log(`   📸 Photo URL type: ${data3.student.photoUrl.startsWith('data:') ? 'Base64' : 'URL'}`);
                    console.log(`   📸 Photo URL preview: ${data3.student.photoUrl.substring(0, 100)}...`);
                }
            } else {
                console.log('   ❌ Student not found or error:', data3.error);
            }
        } catch (error) {
            console.log('   ❌ Error testing specific student:', error.message);
        }
        
        console.log('\n═'.repeat(80));
        console.log('✅ Photo data test completed!');
        console.log('═'.repeat(80));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testStudentPhotos();