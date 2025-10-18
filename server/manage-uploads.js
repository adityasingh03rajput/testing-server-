const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/attendance_app';
const uploadsDir = path.join(__dirname, 'uploads');

// Student Schema
const studentSchema = new mongoose.Schema({
    enrollmentNo: String,
    name: String,
    email: String,
    password: String,
    role: String,
    course: String,
    semester: String,
    dob: Date,
    phone: String,
    photoUrl: String,
    createdAt: Date
});

// Teacher Schema
const teacherSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    email: String,
    password: String,
    role: String,
    department: String,
    phone: String,
    photoUrl: String,
    canEditTimetable: Boolean,
    createdAt: Date
});

const StudentManagement = mongoose.model('StudentManagement', studentSchema);
const TeacherManagement = mongoose.model('TeacherManagement', teacherSchema);

async function listUploads() {
    console.log('\n📁 Listing all uploaded photos...\n');
    
    if (!fs.existsSync(uploadsDir)) {
        console.log('❌ Uploads directory does not exist');
        return;
    }

    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
        console.log('📭 No photos uploaded yet');
        return;
    }

    console.log(`Found ${files.length} photo(s):\n`);
    files.forEach((file, index) => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`${index + 1}. ${file} (${sizeMB} MB)`);
    });
}

async function cleanOrphanedPhotos() {
    console.log('\n🧹 Cleaning orphaned photos...\n');
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        if (!fs.existsSync(uploadsDir)) {
            console.log('❌ Uploads directory does not exist');
            return;
        }

        const files = fs.readdirSync(uploadsDir);
        const students = await StudentManagement.find({});
        const teachers = await TeacherManagement.find({});

        const usedPhotos = new Set();
        students.forEach(s => {
            if (s.photoUrl) {
                const filename = s.photoUrl.split('/').pop();
                usedPhotos.add(filename);
            }
        });
        teachers.forEach(t => {
            if (t.photoUrl) {
                const filename = t.photoUrl.split('/').pop();
                usedPhotos.add(filename);
            }
        });

        let deletedCount = 0;
        files.forEach(file => {
            if (!usedPhotos.has(file)) {
                fs.unlinkSync(path.join(uploadsDir, file));
                console.log(`🗑️  Deleted: ${file}`);
                deletedCount++;
            }
        });

        if (deletedCount === 0) {
            console.log('✅ No orphaned photos found');
        } else {
            console.log(`\n✅ Deleted ${deletedCount} orphaned photo(s)`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function getStats() {
    console.log('\n📊 Upload Statistics\n');
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const students = await StudentManagement.find({});
        const teachers = await TeacherManagement.find({});

        const studentsWithPhotos = students.filter(s => s.photoUrl).length;
        const teachersWithPhotos = teachers.filter(t => t.photoUrl).length;

        console.log(`Total Students: ${students.length}`);
        console.log(`Students with Photos: ${studentsWithPhotos}`);
        console.log(`\nTotal Teachers: ${teachers.length}`);
        console.log(`Teachers with Photos: ${teachersWithPhotos}`);

        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            let totalSize = 0;
            files.forEach(file => {
                const stats = fs.statSync(path.join(uploadsDir, file));
                totalSize += stats.size;
            });
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            console.log(`\nTotal Photos on Disk: ${files.length}`);
            console.log(`Total Storage Used: ${totalSizeMB} MB`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'list':
        listUploads();
        break;
    case 'clean':
        cleanOrphanedPhotos();
        break;
    case 'stats':
        getStats();
        break;
    default:
        console.log(`
📸 Upload Management Tool

Usage:
  node manage-uploads.js <command>

Commands:
  list   - List all uploaded photos
  clean  - Remove orphaned photos (not linked to any user)
  stats  - Show upload statistics

Examples:
  node manage-uploads.js list
  node manage-uploads.js clean
  node manage-uploads.js stats
        `);
}
