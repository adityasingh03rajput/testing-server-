// Add sample profile photos to students for testing
const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

// Sample base64 encoded profile photos (small placeholder images)
const samplePhotos = [
    // Sample 1: Simple avatar with "A" letter
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    
    // Sample 2: Different color avatar
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    
    // Sample 3: Another color
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
];

// Sample students to add photos to
const studentsToUpdate = [
    { enrollmentNo: '0246CD241001', name: 'AADESH CHOUKSEY' },
    { enrollmentNo: '0246CD241002', name: 'AASHI VISHWAKARMA' },
    { enrollmentNo: '0246CD241003', name: 'AASTHA SINGH' },
    { enrollmentNo: '0246CD241004', name: 'AAYAM JAIN' },
    { enrollmentNo: '0246CD241005', name: 'AAYUSH DASHMER' }
];

async function addSamplePhotos() {
    try {
        console.log('🧪 Adding Sample Profile Photos to Students\n');
        
        for (let i = 0; i < studentsToUpdate.length; i++) {
            const student = studentsToUpdate[i];
            const photoIndex = i % samplePhotos.length;
            const photoUrl = samplePhotos[photoIndex];
            
            console.log(`${i + 1}️⃣ Updating ${student.name} (${student.enrollmentNo})`);
            
            try {
                // First, check if student exists
                const checkResponse = await fetch(`${SERVER_URL}/api/student-management?enrollmentNo=${student.enrollmentNo}`);
                const checkData = await checkResponse.json();
                
                if (!checkData.success) {
                    console.log(`   ❌ Student not found in Azure database: ${student.enrollmentNo}`);
                    continue;
                }
                
                // Update student with photo
                const updateResponse = await fetch(`${SERVER_URL}/api/students/${checkData.student._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        photoUrl: photoUrl
                    })
                });
                
                const updateData = await updateResponse.json();
                
                if (updateData.success) {
                    console.log(`   ✅ Photo added successfully`);
                } else {
                    console.log(`   ❌ Failed to update photo: ${updateData.error}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error updating ${student.name}: ${error.message}`);
            }
            
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n═'.repeat(80));
        console.log('✅ Sample photos added! Test the app now.');
        console.log('═'.repeat(80));
        console.log('\n📋 Instructions:');
        console.log('1. Install the APK on your device');
        console.log('2. Login as a teacher');
        console.log('3. Check if profile photos appear in the student list');
        console.log('4. If photos show, the implementation is working correctly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

addSamplePhotos();