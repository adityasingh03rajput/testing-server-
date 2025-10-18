const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/attendance_app';
const OLD_URL = 'http://localhost:3000';
const NEW_URL = 'http://192.168.107.31:3000'; // Update this to your server IP

// Student Schema
const studentManagementSchema = new mongoose.Schema({
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

// Teacher Schema
const teacherSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    email: String,
    password: String,
    department: String,
    subject: String,
    dob: Date,
    phone: String,
    photoUrl: String,
    semester: String,
    canEditTimetable: Boolean,
    createdAt: Date
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);

async function fixPhotoUrls() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Fix student photos
        const students = await StudentManagement.find({ photoUrl: { $exists: true, $ne: null } });
        let studentCount = 0;
        
        for (const student of students) {
            if (student.photoUrl && student.photoUrl.includes(OLD_URL)) {
                const newUrl = student.photoUrl.replace(OLD_URL, NEW_URL);
                await StudentManagement.updateOne(
                    { _id: student._id },
                    { $set: { photoUrl: newUrl } }
                );
                console.log(`📸 Updated student: ${student.name}`);
                console.log(`   Old: ${student.photoUrl}`);
                console.log(`   New: ${newUrl}\n`);
                studentCount++;
            }
        }

        // Fix teacher photos
        const teachers = await Teacher.find({ photoUrl: { $exists: true, $ne: null } });
        let teacherCount = 0;
        
        for (const teacher of teachers) {
            if (teacher.photoUrl && teacher.photoUrl.includes(OLD_URL)) {
                const newUrl = teacher.photoUrl.replace(OLD_URL, NEW_URL);
                await Teacher.updateOne(
                    { _id: teacher._id },
                    { $set: { photoUrl: newUrl } }
                );
                console.log(`📸 Updated teacher: ${teacher.name}`);
                console.log(`   Old: ${teacher.photoUrl}`);
                console.log(`   New: ${newUrl}\n`);
                teacherCount++;
            }
        }

        console.log(`\n✅ Fixed ${studentCount} student photo(s)`);
        console.log(`✅ Fixed ${teacherCount} teacher photo(s)`);
        console.log(`\n🎉 Done! Now restart the mobile app and login again.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixPhotoUrls();
