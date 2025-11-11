// Test the complete face verification flow
require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = 'https://google-8j5x.onrender.com';

async function testFaceVerificationFlow() {
    console.log('🧪 Testing Face Verification Flow\n');
    
    // Test with correct enrollment number
    const enrollmentNo = '0246CS241001';
    
    console.log('Step 1: Fetch student data');
    console.log('  Enrollment:', enrollmentNo);
    
    try {
        const response = await fetch(`${SOCKET_URL}/api/student-management?enrollmentNo=${enrollmentNo}`);
        const data = await response.json();
        
        console.log('\nStep 2: Check response');
        console.log('  Success:', data.success);
        
        if (data.success && data.student) {
            console.log('  ✅ Student found:', data.student.name);
            console.log('  Has photo:', !!data.student.photoUrl);
            
            if (data.student.photoUrl) {
                const photoUrl = data.student.photoUrl;
                console.log('\nStep 3: Photo details');
                console.log('  Type:', photoUrl.startsWith('data:image') ? 'Base64 Data URI' : 'URL');
                console.log('  Length:', photoUrl.length, 'characters');
                console.log('  Size:', Math.round(photoUrl.length * 0.75 / 1024), 'KB');
                console.log('  First 100 chars:', photoUrl.substring(0, 100));
                
                console.log('\n✅ Face verification should work!');
                console.log('The photo can be:');
                console.log('  1. Saved to file using FileSystem');
                console.log('  2. Used for face comparison');
            } else {
                console.log('\n❌ No photo found');
            }
        } else {
            console.log('  ❌ Student not found');
            console.log('  Error:', data.error);
        }
    } catch (error) {
        console.log('\n❌ Network error:', error.message);
    }
}

testFaceVerificationFlow().catch(console.error);
