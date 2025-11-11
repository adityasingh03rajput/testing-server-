const path = require('path');
const fs = require('fs');

// Load environment variables
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const mongoose = require('mongoose');

// Define schemas
const StudentSchema = new mongoose.Schema({
    enrollmentNo: String,
    name: String,
    photoUrl: String
});

const Student = mongoose.model('Student', StudentSchema);

async function clearInvalidPhotos() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!\n');

        // Find students with non-Cloudinary photo URLs
        const studentsWithInvalidPhotos = await Student.find({
            photoUrl: {
                $exists: true,
                $ne: null,
                $ne: '',
                $not: /cloudinary\.com/
            }
        });

        console.log(`📊 Found ${studentsWithInvalidPhotos.length} students with invalid photo URLs\n`);

        if (studentsWithInvalidPhotos.length === 0) {
            console.log('✅ All photo URLs are valid!');
            return;
        }

        console.log('Students with invalid photos:');
        studentsWithInvalidPhotos.forEach((student, index) => {
            console.log(`${index + 1}. ${student.name} (${student.enrollmentNo})`);
            console.log(`   URL: ${student.photoUrl}\n`);
        });

        console.log('\n⚠️  WARNING: This will clear photo URLs for these students.');
        console.log('They will need to re-upload their photos via admin panel.\n');

        // In a real scenario, you'd want confirmation here
        // For now, we'll just update them

        const result = await Student.updateMany(
            {
                photoUrl: {
                    $exists: true,
                    $ne: null,
                    $ne: '',
                    $not: /cloudinary\.com/
                }
            },
            {
                $set: { photoUrl: null }
            }
        );

        console.log(`✅ Cleared ${result.modifiedCount} invalid photo URLs`);
        console.log('\n💡 Next steps:');
        console.log('1. Notify affected students');
        console.log('2. Have them re-upload photos via admin panel');
        console.log('3. New photos will be stored on Cloudinary');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
    }
}

// Run the script
clearInvalidPhotos();
