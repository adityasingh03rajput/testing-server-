const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

// Connect to MongoDB
mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ Connected to MongoDB');
    clearAllData();
}).catch(err => {
    console.log('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Schemas
const studentManagementSchema = new mongoose.Schema({
    enrollmentNo: String,
    name: String,
    email: String,
    password: String,
    course: String,
    semester: String,
    dob: Date,
    phone: String,
    createdAt: Date
});

const teacherSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    email: String,
    password: String,
    department: String,
    subject: String,
    dob: Date,
    phone: String,
    semester: String,
    canEditTimetable: Boolean,
    createdAt: Date
});

const attendanceRecordSchema = new mongoose.Schema({
    studentId: String,
    studentName: String,
    enrollmentNumber: String,
    date: Date,
    status: String,
    timerValue: Number,
    checkInTime: Date,
    checkOutTime: Date,
    semester: String,
    branch: String,
    createdAt: Date
});

const timetableSchema = new mongoose.Schema({
    semester: String,
    branch: String,
    periods: Array,
    timetable: Object,
    lastUpdated: Date
});

const studentSchema = new mongoose.Schema({
    name: String,
    status: String,
    timerValue: Number,
    isRunning: Boolean,
    lastUpdated: Date,
    sessionDate: Date
});

const classroomSchema = new mongoose.Schema({
    roomNumber: String,
    building: String,
    capacity: Number,
    facilities: Array,
    createdAt: Date
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);
const Student = mongoose.model('Student', studentSchema);
const Classroom = mongoose.model('Classroom', classroomSchema);

async function clearAllData() {
    try {
        console.log('\n========================================');
        console.log('🗑️  CLEARING ALL DATA FROM DATABASE');
        console.log('========================================\n');
        
        // Delete all collections
        console.log('Deleting students...');
        const studentsDeleted = await StudentManagement.deleteMany({});
        console.log(`✅ Deleted ${studentsDeleted.deletedCount} student records`);
        
        console.log('Deleting teachers...');
        const teachersDeleted = await Teacher.deleteMany({});
        console.log(`✅ Deleted ${teachersDeleted.deletedCount} teacher records`);
        
        console.log('Deleting attendance records...');
        const attendanceDeleted = await AttendanceRecord.deleteMany({});
        console.log(`✅ Deleted ${attendanceDeleted.deletedCount} attendance records`);
        
        console.log('Deleting timetables...');
        const timetablesDeleted = await Timetable.deleteMany({});
        console.log(`✅ Deleted ${timetablesDeleted.deletedCount} timetable records`);
        
        console.log('Deleting active sessions...');
        const sessionsDeleted = await Student.deleteMany({});
        console.log(`✅ Deleted ${sessionsDeleted.deletedCount} active session records`);
        
        console.log('Deleting classrooms...');
        const classroomsDeleted = await Classroom.deleteMany({});
        console.log(`✅ Deleted ${classroomsDeleted.deletedCount} classroom records`);
        
        console.log('\n========================================');
        console.log('✅ ALL DATA CLEARED SUCCESSFULLY!');
        console.log('========================================');
        console.log('\nDatabase is now empty and ready for fresh data.');
        console.log('Run "node seed-data.js" to add sample data.\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
}
