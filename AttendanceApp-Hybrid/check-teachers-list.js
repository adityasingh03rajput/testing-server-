const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

// Teacher Schema (matching server.js)
const teacherSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    subject: { type: String, required: true },
    dob: { type: Date, required: true },
    phone: String,
    photoUrl: String,
    semester: String,
    canEditTimetable: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Teacher = mongoose.model('Teacher', teacherSchema);

async function checkTeachersList() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Get all teachers
        console.log('\n📋 Fetching all teachers...');
        const teachers = await Teacher.find({}).sort({ createdAt: -1 });
        
        console.log(`\n👥 Total Teachers Found: ${teachers.length}`);
        
        if (teachers.length === 0) {
            console.log('❌ No teachers found in the database');
            return;
        }

        // Display teacher details
        console.log('\n📊 Teacher List:');
        console.log('='.repeat(120));
        console.log('| Employee ID | Name                 | Email                    | Department | Subject              | Phone        | Can Edit TT |');
        console.log('='.repeat(120));
        
        teachers.forEach((teacher, index) => {
            const employeeId = (teacher.employeeId || '').padEnd(11);
            const name = (teacher.name || '').substring(0, 18).padEnd(18);
            const email = (teacher.email || '').substring(0, 22).padEnd(22);
            const department = (teacher.department || '').padEnd(10);
            const subject = (teacher.subject || '').substring(0, 18).padEnd(18);
            const phone = (teacher.phone || '').padEnd(12);
            const canEdit = teacher.canEditTimetable ? 'Yes' : 'No';
            
            console.log(`| ${employeeId} | ${name} | ${email} | ${department} | ${subject} | ${phone} | ${canEdit.padEnd(11)} |`);
        });
        console.log('='.repeat(120));

        // Get unique departments
        console.log('\n🏢 Unique Departments:');
        const departments = await Teacher.distinct('department');
        departments.forEach((dept, index) => {
            const count = teachers.filter(t => t.department === dept).length;
            console.log(`${index + 1}. ${dept} (${count} teacher${count !== 1 ? 's' : ''})`);
        });

        // Get unique subjects
        console.log('\n📚 Unique Subjects:');
        const subjects = await Teacher.distinct('subject');
        subjects.forEach((subject, index) => {
            const count = teachers.filter(t => t.subject === subject).length;
            console.log(`${index + 1}. ${subject} (${count} teacher${count !== 1 ? 's' : ''})`);
        });

        // Recent additions
        console.log('\n🕒 Recent Additions (Last 5):');
        const recentTeachers = teachers.slice(0, 5);
        recentTeachers.forEach((teacher, index) => {
            const createdDate = teacher.createdAt ? teacher.createdAt.toISOString().split('T')[0] : 'Unknown';
            console.log(`${index + 1}. ${teacher.name} (${teacher.employeeId}) - Added: ${createdDate}`);
        });

        // Statistics
        console.log('\n📈 Statistics:');
        console.log(`• Total Teachers: ${teachers.length}`);
        console.log(`• Unique Departments: ${departments.length}`);
        console.log(`• Unique Subjects: ${subjects.length}`);
        console.log(`• Teachers with Timetable Edit Access: ${teachers.filter(t => t.canEditTimetable).length}`);
        console.log(`• Teachers with Phone Numbers: ${teachers.filter(t => t.phone).length}`);
        console.log(`• Teachers with Photos: ${teachers.filter(t => t.photoUrl).length}`);

    } catch (error) {
        console.error('❌ Error checking teachers list:', error);
        
        if (error.code === 8000) {
            console.log('💡 Authentication failed. Please check your MongoDB credentials in .env file');
        } else if (error.code === 'ENOTFOUND') {
            console.log('💡 Network error. Please check your internet connection');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkTeachersList();