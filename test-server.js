// Quick Server Test Script
// Run this to test if server APIs are working

const testStudent = {
    enrollmentNo: 'TEST001',
    name: 'Test Student',
    email: 'test@example.com',
    password: 'test123',
    course: 'CSE',
    semester: '3',
    dob: '2003-01-01',
    phone: '1234567890'
};

async function testServer() {
    const SERVER_URL = 'http://localhost:3000';
    
    console.log('🧪 Testing Server APIs...\n');
    
    // Test 1: Health Check
    console.log('1️⃣  Testing Health Check...');
    try {
        const response = await fetch(`${SERVER_URL}/api/health`);
        const data = await response.json();
        console.log('✅ Health Check:', data.status);
    } catch (error) {
        console.log('❌ Health Check Failed:', error.message);
        console.log('   Make sure server is running: cd server && node index.js');
        return;
    }
    
    // Test 2: Add Student
    console.log('\n2️⃣  Testing Add Student...');
    let studentId;
    try {
        const response = await fetch(`${SERVER_URL}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testStudent)
        });
        const data = await response.json();
        if (data.success) {
            studentId = data.student._id;
            console.log('✅ Student Added:', data.student.name, '(ID:', studentId, ')');
        } else {
            console.log('❌ Add Student Failed:', data.error);
        }
    } catch (error) {
        console.log('❌ Add Student Failed:', error.message);
    }
    
    // Test 3: Get Students
    console.log('\n3️⃣  Testing Get Students...');
    try {
        const response = await fetch(`${SERVER_URL}/api/students`);
        const data = await response.json();
        console.log('✅ Students Retrieved:', data.students.length, 'students');
    } catch (error) {
        console.log('❌ Get Students Failed:', error.message);
    }
    
    // Test 4: Update Student
    if (studentId) {
        console.log('\n4️⃣  Testing Update Student...');
        try {
            const response = await fetch(`${SERVER_URL}/api/students/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test Student Updated' })
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ Student Updated:', data.student.name);
            } else {
                console.log('❌ Update Student Failed:', data.error);
            }
        } catch (error) {
            console.log('❌ Update Student Failed:', error.message);
        }
    }
    
    // Test 5: Delete Student
    if (studentId) {
        console.log('\n5️⃣  Testing Delete Student...');
        try {
            const response = await fetch(`${SERVER_URL}/api/students/${studentId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ Student Deleted');
            } else {
                console.log('❌ Delete Student Failed:', data.error);
            }
        } catch (error) {
            console.log('❌ Delete Student Failed:', error.message);
        }
    }
    
    console.log('\n✅ All Tests Complete!\n');
    console.log('If all tests passed, your server is working correctly.');
    console.log('Now try the admin panel: cd admin-panel && npm start\n');
}

// Run tests
testServer().catch(console.error);
