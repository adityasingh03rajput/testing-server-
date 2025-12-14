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

// Teachers data from your CSV
const newTeachers = [
    {
        employeeId: 'EMP001',
        name: 'Prof. Zohaib Hasan',
        email: 'zohaib.cs@global.org.in',
        password: 'sirzohaib',
        department: 'DS',
        subject: 'Data Structure',
        dob: new Date('1980-01-01'),
        phone: '+91-9876543119',
        photoUrl: '',
        semester: '3',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP002',
        name: 'Prof. Zeba Vishwakarma',
        email: 'zeba.cs@global.org.in',
        password: 'mamzeba',
        department: 'DS',
        subject: 'Database Management Systems',
        dob: new Date('1980-01-01'),
        phone: '+91-9876543119',
        photoUrl: '',
        semester: '3',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP003',
        name: 'Prof. Pankaj Singhai',
        email: 'pankaj.cse@global.org.in',
        password: 'sirpankaj',
        department: 'DS',
        subject: 'Object Oriented Programming & Methodology',
        dob: new Date('1980-01-01'),
        phone: '+91-9876543119',
        photoUrl: '',
        semester: '3',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP004',
        name: 'Prof. Zoya Afreen',
        email: 'zoya.cs@global.org.in',
        password: 'mamzoya',
        department: 'DS',
        subject: 'Introduction to Probability and Statistics',
        dob: new Date('1980-01-01'),
        phone: '+91-9876543119',
        photoUrl: '',
        semester: '3',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP005',
        name: 'Prof. Sabiya Khan',
        email: 'sabiya.core@global.org.in',
        password: 'mamsabiya',
        department: 'DS',
        subject: 'Technical Communication',
        dob: new Date('1980-01-01'),
        phone: '+91-9876543119',
        photoUrl: '',
        semester: '3',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP006',
        name: 'Mr. Deepak Vishwakarma',
        email: 'deepak.trainer@global.org.in',
        password: 'sirdeepak',
        department: 'DS',
        subject: 'Computer Workshop - Introduction to Python',
        dob: new Date('1980-01-01'),
        phone: '+91-9876543119',
        photoUrl: '',
        semester: '3',
        canEditTimetable: false
    }
];

async function resetAndAddTeachers() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Step 1: Remove all existing teachers
        console.log('\n🗑️ Removing all existing teachers...');
        const deleteResult = await Teacher.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} existing teachers`);

        // Step 2: Add new teachers
        console.log('\n👥 Adding new teachers...');
        const insertResult = await Teacher.insertMany(newTeachers);
        console.log(`✅ Added ${insertResult.length} new teachers`);

        // Step 3: Verify the teachers
        console.log('\n📋 Verifying teachers in database...');
        const allTeachers = await Teacher.find({}).sort({ employeeId: 1 });
        
        console.log(`\n📊 Total Teachers: ${allTeachers.length}`);
        console.log('='.repeat(120));
        console.log('| Employee ID | Name                     | Email                        | Department | Subject                              | Timetable |');
        console.log('='.repeat(120));
        
        allTeachers.forEach(teacher => {
            const empId = teacher.employeeId.padEnd(11);
            const name = teacher.name.substring(0, 23).padEnd(23);
            const email = teacher.email.substring(0, 27).padEnd(27);
            const dept = teacher.department.padEnd(10);
            const subject = teacher.subject.substring(0, 35).padEnd(35);
            const canEdit = teacher.canEditTimetable ? 'Yes' : 'No';
            
            console.log(`| ${empId} | ${name} | ${email} | ${dept} | ${subject} | ${canEdit.padEnd(9)} |`);
        });
        console.log('='.repeat(120));

        // Step 4: Get unique departments and subjects
        console.log('\n🏢 Unique Departments:');
        const departments = await Teacher.distinct('department');
        departments.forEach((dept, index) => {
            const count = allTeachers.filter(t => t.department === dept).length;
            console.log(`${index + 1}. ${dept} (${count} teacher${count !== 1 ? 's' : ''})`);
        });

        console.log('\n📚 Subjects Taught:');
        const subjects = await Teacher.distinct('subject');
        subjects.forEach((subject, index) => {
            const teacher = allTeachers.find(t => t.subject === subject);
            console.log(`${index + 1}. ${subject} - ${teacher.name}`);
        });

        console.log('\n👑 Timetable Editors:');
        const editors = allTeachers.filter(t => t.canEditTimetable);
        editors.forEach((teacher, index) => {
            console.log(`${index + 1}. ${teacher.name} (${teacher.employeeId})`);
        });

        console.log('\n🎉 Teacher reset and addition completed successfully!');
        console.log('💡 All teachers are now from Data Science department');

    } catch (error) {
        console.error('❌ Error resetting and adding teachers:', error);
        
        if (error.code === 11000) {
            console.log('💡 Duplicate employee ID or email found. Please check for duplicates.');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
resetAndAddTeachers();