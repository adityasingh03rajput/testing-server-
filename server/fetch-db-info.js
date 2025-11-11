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

const TimetableSchema = new mongoose.Schema({
    semester: String,
    course: String,
    schedule: Object,
    createdAt: Date,
    updatedAt: Date
});

const AttendanceSchema = new mongoose.Schema({
    studentId: String,
    enrollmentNo: String,
    date: Date,
    status: String,
    timestamp: Date,
    location: Object,
    verificationMethod: String
});

// Create models
const Student = mongoose.model('Student', StudentSchema);
const Teacher = mongoose.model('Teacher', TeacherSchema);
const Timetable = mongoose.model('Timetable', TimetableSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);

async function fetchDatabaseInfo() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        console.log('📍 Database:', process.env.MONGODB_URI.split('@')[1].split('/')[1].split('?')[0]);
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!\n');

        // Fetch counts
        const studentCount = await Student.countDocuments();
        const teacherCount = await Teacher.countDocuments();
        const timetableCount = await Timetable.countDocuments();
        const attendanceCount = await Attendance.countDocuments();

        console.log('📊 DATABASE OVERVIEW');
        console.log('═══════════════════════════════════════');
        console.log(`👨‍🎓 Students:     ${studentCount}`);
        console.log(`👨‍🏫 Teachers:     ${teacherCount}`);
        console.log(`📅 Timetables:   ${timetableCount}`);
        console.log(`✓  Attendance:   ${attendanceCount}`);
        console.log('═══════════════════════════════════════\n');

        // Fetch students with photos
        console.log('👨‍🎓 STUDENTS');
        console.log('═══════════════════════════════════════');
        const students = await Student.find().select('enrollmentNo name email course semester photoUrl').limit(20);
        
        if (students.length === 0) {
            console.log('⚠️  No students found');
        } else {
            students.forEach((student, index) => {
                console.log(`\n${index + 1}. ${student.name}`);
                console.log(`   Enrollment: ${student.enrollmentNo}`);
                console.log(`   Email: ${student.email}`);
                console.log(`   Course: ${student.course} - Semester ${student.semester}`);
                console.log(`   Photo: ${student.photoUrl ? '✅ ' + (student.photoUrl.includes('cloudinary') ? 'Cloudinary' : 'Local') : '❌ No photo'}`);
                if (student.photoUrl) {
                    console.log(`   URL: ${student.photoUrl.substring(0, 80)}${student.photoUrl.length > 80 ? '...' : ''}`);
                }
            });
        }

        // Check photo statistics
        const studentsWithPhotos = await Student.countDocuments({ photoUrl: { $exists: true, $ne: null, $ne: '' } });
        const cloudinaryPhotos = await Student.countDocuments({ photoUrl: { $regex: 'cloudinary' } });
        const localPhotos = studentsWithPhotos - cloudinaryPhotos;

        console.log('\n\n📸 PHOTO STATISTICS');
        console.log('═══════════════════════════════════════');
        console.log(`Total Students:        ${studentCount}`);
        console.log(`With Photos:           ${studentsWithPhotos} (${((studentsWithPhotos/studentCount)*100).toFixed(1)}%)`);
        console.log(`  ☁️  Cloudinary:       ${cloudinaryPhotos}`);
        console.log(`  💾 Local:            ${localPhotos}`);
        console.log(`Without Photos:        ${studentCount - studentsWithPhotos}`);

        // Fetch teachers
        console.log('\n\n👨‍🏫 TEACHERS');
        console.log('═══════════════════════════════════════');
        const teachers = await Teacher.find().select('employeeId name email department subject canEditTimetable photoUrl').limit(10);
        
        if (teachers.length === 0) {
            console.log('⚠️  No teachers found');
        } else {
            teachers.forEach((teacher, index) => {
                console.log(`\n${index + 1}. ${teacher.name}`);
                console.log(`   Employee ID: ${teacher.employeeId}`);
                console.log(`   Email: ${teacher.email}`);
                console.log(`   Department: ${teacher.department}`);
                console.log(`   Subject: ${teacher.subject || 'N/A'}`);
                console.log(`   Timetable Access: ${teacher.canEditTimetable ? '✅ Enabled' : '❌ Disabled'}`);
                console.log(`   Photo: ${teacher.photoUrl ? '✅ Yes' : '❌ No'}`);
            });
        }

        // Fetch timetables
        console.log('\n\n📅 TIMETABLES');
        console.log('═══════════════════════════════════════');
        const timetables = await Timetable.find().select('course semester createdAt updatedAt');
        
        if (timetables.length === 0) {
            console.log('⚠️  No timetables found');
        } else {
            timetables.forEach((tt, index) => {
                console.log(`${index + 1}. ${tt.course} - Semester ${tt.semester}`);
                console.log(`   Created: ${tt.createdAt ? new Date(tt.createdAt).toLocaleDateString() : 'N/A'}`);
                console.log(`   Updated: ${tt.updatedAt ? new Date(tt.updatedAt).toLocaleDateString() : 'N/A'}`);
            });
        }

        // Fetch recent attendance
        console.log('\n\n✓  RECENT ATTENDANCE (Last 10)');
        console.log('═══════════════════════════════════════');
        const recentAttendance = await Attendance.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .select('enrollmentNo date status timestamp verificationMethod');
        
        if (recentAttendance.length === 0) {
            console.log('⚠️  No attendance records found');
        } else {
            recentAttendance.forEach((att, index) => {
                console.log(`${index + 1}. ${att.enrollmentNo} - ${att.status.toUpperCase()}`);
                console.log(`   Date: ${new Date(att.date).toLocaleDateString()}`);
                console.log(`   Time: ${new Date(att.timestamp).toLocaleTimeString()}`);
                console.log(`   Method: ${att.verificationMethod || 'N/A'}`);
            });
        }

        // Course distribution
        console.log('\n\n📊 COURSE DISTRIBUTION');
        console.log('═══════════════════════════════════════');
        const courseStats = await Student.aggregate([
            { $group: { _id: '$course', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        courseStats.forEach(stat => {
            const percentage = ((stat.count / studentCount) * 100).toFixed(1);
            console.log(`${stat._id || 'Unknown'}: ${stat.count} (${percentage}%)`);
        });

        // Semester distribution
        console.log('\n\n📚 SEMESTER DISTRIBUTION');
        console.log('═══════════════════════════════════════');
        const semesterStats = await Student.aggregate([
            { $group: { _id: '$semester', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        semesterStats.forEach(stat => {
            const percentage = ((stat.count / studentCount) * 100).toFixed(1);
            console.log(`Semester ${stat._id || 'Unknown'}: ${stat.count} (${percentage}%)`);
        });

        // Attendance statistics
        if (attendanceCount > 0) {
            console.log('\n\n📈 ATTENDANCE STATISTICS');
            console.log('═══════════════════════════════════════');
            
            const statusStats = await Attendance.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            
            statusStats.forEach(stat => {
                const percentage = ((stat.count / attendanceCount) * 100).toFixed(1);
                console.log(`${stat._id.toUpperCase()}: ${stat.count} (${percentage}%)`);
            });

            // Unique dates
            const uniqueDates = await Attendance.distinct('date');
            console.log(`\nTotal Days Tracked: ${uniqueDates.length}`);

            // Today's attendance
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayCount = await Attendance.countDocuments({
                date: { $gte: today }
            });
            console.log(`Today's Records: ${todayCount}`);
        }

        console.log('\n\n✅ Database fetch complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
    }
}

// Run the script
fetchDatabaseInfo();
