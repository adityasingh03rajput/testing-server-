const path = require('path');
const fs = require('fs');

// Load environment variables
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    enrollmentNo: String,
    name: String,
    photoUrl: String
});

const Student = mongoose.model('Student', StudentSchema);

async function fixStudentPhoto() {
    const enrollmentNo = process.argv[2] || '0246CS241001';
    
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!\n');

        const student = await Student.findOne({ enrollmentNo });
        
        if (!student) {
            console.log(`❌ Student ${enrollmentNo} not found`);
            return;
        }

        console.log(`📋 Student: ${student.name}`);
        console.log(`📸 Current Photo URL: ${student.photoUrl || 'None'}\n`);

        if (!student.photoUrl) {
            console.log('✅ Student already has no photo URL');
            return;
        }

        if (student.photoUrl.includes('cloudinary.com')) {
            console.log('✅ Student already using Cloudinary');
            return;
        }

        // Clear the invalid photo URL
        student.photoUrl = null;
        await student.save();

        console.log('✅ Photo URL cleared!');
        console.log('\n💡 Next steps:');
        console.log('1. Open admin panel');
        console.log(`2. Find student: ${student.name} (${enrollmentNo})`);
        console.log('3. Edit and upload new photo');
        console.log('4. New photo will be stored on Cloudinary');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

fixStudentPhoto();
