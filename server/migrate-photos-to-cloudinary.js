const path = require('path');
const fs = require('fs');

// Load environment variables
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Define schemas
const StudentSchema = new mongoose.Schema({
    enrollmentNo: String,
    name: String,
    email: String,
    password: String,
    course: String,
    semester: String,
    dob: Date,
    phone: String,
    photoUrl: String,
    createdAt: Date
});

const TeacherSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    email: String,
    password: String,
    department: String,
    subject: String,
    dob: Date,
    phone: String,
    photoUrl: String,
    canEditTimetable: Boolean,
    createdAt: Date
});

const Student = mongoose.model('Student', StudentSchema);
const Teacher = mongoose.model('Teacher', TeacherSchema);

async function migratePhotosToCloudinary() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!\n');

        console.log('🔍 Checking for students with local photo URLs...\n');

        // Find students with local/Render photo URLs
        const studentsWithLocalPhotos = await Student.find({
            photoUrl: {
                $exists: true,
                $ne: null,
                $ne: '',
                $not: /cloudinary\.com/
            }
        });

        console.log(`📊 Found ${studentsWithLocalPhotos.length} students with local photo URLs\n`);

        if (studentsWithLocalPhotos.length === 0) {
            console.log('✅ All students already using Cloudinary or have no photos!');
            return;
        }

        let migrated = 0;
        let failed = 0;
        let skipped = 0;

        for (const student of studentsWithLocalPhotos) {
            console.log(`\n📸 Processing: ${student.name} (${student.enrollmentNo})`);
            console.log(`   Current URL: ${student.photoUrl}`);

            // Check if photo file exists locally
            const filename = student.photoUrl.split('/uploads/').pop();
            const localPath = path.join(__dirname, 'uploads', filename);

            if (fs.existsSync(localPath)) {
                try {
                    console.log('   ✅ Found local file, uploading to Cloudinary...');

                    // Upload to Cloudinary
                    const sanitizedId = student.enrollmentNo.replace(/[^a-zA-Z0-9]/g, '_');
                    const publicId = `attendance/student_${sanitizedId}_${Date.now()}`;

                    const uploadResult = await cloudinary.uploader.upload(localPath, {
                        public_id: publicId,
                        folder: 'attendance',
                        resource_type: 'image'
                    });

                    // Update student record
                    student.photoUrl = uploadResult.secure_url;
                    await student.save();

                    console.log(`   ✅ Migrated to: ${uploadResult.secure_url}`);
                    migrated++;

                } catch (error) {
                    console.log(`   ❌ Failed to migrate: ${error.message}`);
                    failed++;
                }
            } else {
                console.log('   ⚠️  Local file not found - marking for re-upload');
                console.log('   💡 Student needs to re-upload photo via admin panel');
                
                // Option 1: Clear the photoUrl so they can re-upload
                // student.photoUrl = null;
                // await student.save();
                
                // Option 2: Leave as-is and let them know
                skipped++;
            }
        }

        console.log('\n\n📊 MIGRATION SUMMARY');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Successfully migrated: ${migrated}`);
        console.log(`❌ Failed to migrate:     ${failed}`);
        console.log(`⚠️  Skipped (no file):    ${skipped}`);
        console.log('═══════════════════════════════════════');

        if (skipped > 0) {
            console.log('\n💡 NEXT STEPS:');
            console.log('Students with skipped photos need to:');
            console.log('1. Contact admin to re-upload their photo');
            console.log('2. Or upload via admin panel');
            console.log('\nTo clear invalid photo URLs, run:');
            console.log('node server/clear-invalid-photos.js');
        }

        // Check teachers too
        console.log('\n\n🔍 Checking teachers...');
        const teachersWithLocalPhotos = await Teacher.find({
            photoUrl: {
                $exists: true,
                $ne: null,
                $ne: '',
                $not: /cloudinary\.com/
            }
        });

        console.log(`📊 Found ${teachersWithLocalPhotos.length} teachers with local photo URLs`);

        if (teachersWithLocalPhotos.length > 0) {
            console.log('\n💡 Teachers with local photos:');
            teachersWithLocalPhotos.forEach(t => {
                console.log(`   - ${t.name} (${t.employeeId})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
    }
}

// Run the script
migratePhotosToCloudinary();
