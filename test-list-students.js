// List all students to see what enrollment numbers exist
require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = 'https://google-8j5x.onrender.com';

async function listStudents() {
    console.log('🧪 Listing All Students\n');
    
    try {
        const response = await fetch(`${SOCKET_URL}/api/students`);
        const data = await response.json();
        
        if (data.success && data.students) {
            console.log(`✅ Found ${data.students.length} students:\n`);
            
            data.students.forEach((student, i) => {
                console.log(`${i + 1}. ${student.name || 'No name'}`);
                console.log(`   Enrollment: ${student.enrollmentNo || 'N/A'}`);
                console.log(`   ID: ${student._id}`);
                console.log(`   Has Photo: ${student.photoUrl ? 'YES ✅' : 'NO ❌'}`);
                if (student.photoUrl) {
                    const photoType = student.photoUrl.startsWith('data:image') ? 'Base64' :
                                    student.photoUrl.includes('cloudinary') ? 'Cloudinary' : 'Other';
                    console.log(`   Photo Type: ${photoType}`);
                }
                console.log('');
            });
        } else {
            console.log('❌ No students found or error');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

listStudents().catch(console.error);
