// Test student photo endpoint
require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = 'https://google-8j5x.onrender.com';

async function testStudentPhoto() {
    console.log('🧪 Testing Student Photo Endpoint\n');
    
    // Test with the enrollment number from the screenshot
    const enrollmentNo = '024DCS241001';
    
    console.log('📡 Fetching student data for:', enrollmentNo);
    console.log('URL:', `${SOCKET_URL}/api/student-management?enrollmentNo=${enrollmentNo}`);
    
    try {
        const response = await fetch(`${SOCKET_URL}/api/student-management?enrollmentNo=${enrollmentNo}`);
        console.log('✅ Response status:', response.status);
        
        const data = await response.json();
        console.log('\n📥 Response data:');
        console.log('  Success:', data.success);
        
        if (data.success && data.student) {
            console.log('  Student found:', data.student.name);
            console.log('  Has photoUrl:', !!data.student.photoUrl);
            
            if (data.student.photoUrl) {
                const photoUrl = data.student.photoUrl;
                console.log('\n📸 Photo URL details:');
                console.log('  Type:', photoUrl.startsWith('data:image') ? 'Base64 Data URI' : 
                           photoUrl.includes('cloudinary') ? 'Cloudinary URL' : 'Other URL');
                console.log('  Length:', photoUrl.length);
                
                if (photoUrl.startsWith('data:image')) {
                    console.log('  Format:', photoUrl.substring(0, 30) + '...');
                    console.log('  ✅ Base64 data URI - should work in React Native Image');
                } else if (photoUrl.includes('cloudinary')) {
                    console.log('  URL:', photoUrl);
                    console.log('  ✅ Cloudinary URL - should work in React Native Image');
                    
                    // Test if Cloudinary URL is accessible
                    try {
                        const imgResponse = await fetch(photoUrl, { method: 'HEAD' });
                        console.log('  Cloudinary accessible:', imgResponse.ok);
                    } catch (err) {
                        console.log('  ❌ Cloudinary URL not accessible:', err.message);
                    }
                } else {
                    console.log('  URL:', photoUrl);
                    console.log('  ⚠️ Unknown URL type');
                }
            } else {
                console.log('  ❌ No photoUrl found');
            }
        } else {
            console.log('  ❌ Student not found or error:', data.error || 'Unknown error');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testStudentPhoto().catch(console.error);
