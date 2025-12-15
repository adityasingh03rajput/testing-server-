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

// Sample teachers data
const sampleTeachers = [
    {
        employeeId: 'EMP001',
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@college.edu',
        password: 'password123', // In real app, this should be hashed
        department: 'CSE',
        subject: 'Data Structures',
        dob: new Date('1980-05-15'),
        phone: '+91-9876543210',
        semester: '3',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP002',
        name: 'Prof. Priya Sharma',
        email: 'priya.sharma@college.edu',
        password: 'password123',
        department: 'CSE',
        subject: 'Database Management',
        dob: new Date('1985-08-22'),
        phone: '+91-9876543211',
        semester: '4',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP003',
        name: 'Dr. Amit Patel',
        email: 'amit.patel@college.edu',
        password: 'password123',
        department: 'ECE',
        subject: 'Digital Electronics',
        dob: new Date('1978-12-10'),
        phone: '+91-9876543212',
        semester: '2',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP004',
        name: 'Prof. Sunita Verma',
        email: 'sunita.verma@college.edu',
        password: 'password123',
        department: 'ECE',
        subject: 'Communication Systems',
        dob: new Date('1982-03-18'),
        phone: '+91-9876543213',
        semester: '5',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP005',
        name: 'Dr. Vikram Singh',
        email: 'vikram.singh@college.edu',
        password: 'password123',
        department: 'ME',
        subject: 'Thermodynamics',
        dob: new Date('1975-09-25'),
        phone: '+91-9876543214',
        semester: '3',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP006',
        name: 'Prof. Kavita Joshi',
        email: 'kavita.joshi@college.edu',
        password: 'password123',
        department: 'ME',
        subject: 'Machine Design',
        dob: new Date('1983-07-12'),
        phone: '+91-9876543215',
        semester: '6',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP007',
        name: 'Dr. Ravi Gupta',
        email: 'ravi.gupta@college.edu',
        password: 'password123',
        department: 'CE',
        subject: 'Structural Engineering',
        dob: new Date('1979-11-08'),
        phone: '+91-9876543216',
        semester: '4',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP008',
        name: 'Prof. Neha Agarwal',
        email: 'neha.agarwal@college.edu',
        password: 'password123',
        department: 'CE',
        subject: 'Environmental Engineering',
        dob: new Date('1986-04-30'),
        phone: '+91-9876543217',
        semester: '7',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP009',
        name: 'Dr. Sanjay Mishra',
        email: 'sanjay.mishra@college.edu',
        password: 'password123',
        department: 'DS',
        subject: 'Machine Learning',
        dob: new Date('1981-01-20'),
        phone: '+91-9876543218',
        semester: '5',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP010',
        name: 'Prof. Anita Rao',
        email: 'anita.rao@college.edu',
        password: 'password123',
        department: 'DS',
        subject: 'Data Analytics',
        dob: new Date('1984-06-14'),
        phone: '+91-9876543219',
        semester: '6',
        canEditTimetable: false
    }
];

async function addSampleTeachers() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Check if teachers already exist
        const existingCount = await Teacher.countDocuments();
        console.log(`📊 Current teachers in database: ${existingCount}`);

        if (existingCount > 0) {
            console.log('⚠️  Teachers already exist. Do you want to add more? (This will skip duplicates)');
        }

        console.log('\n📝 Adding sample teachers...');
        let addedCount = 0;
        let skippedCount = 0;

        for (const teacherData of sampleTeachers) {
            try {
                const teacher = new Teacher(teacherData);
                await teacher.save();
                console.log(`✅ Added: ${teacherData.name} (${teacherData.employeeId}) - ${teacherData.department}`);
                addedCount++;
            } catch (error) {
                if (error.code === 11000) {
                    console.log(`⏭️  Skipped: ${teacherData.name} (${teacherData.employeeId}) - Already exists`);
                    skippedCount++;
                } else {
                    console.error(`❌ Error adding ${teacherData.name}:`, error.message);
                }
            }
        }

        console.log('\n📈 Summary:');
        console.log(`• Teachers added: ${addedCount}`);
        console.log(`• Teachers skipped: ${skippedCount}`);
        console.log(`• Total teachers now: ${await Teacher.countDocuments()}`);

        // Show departments created
        const departments = await Teacher.distinct('department');
        console.log('\n🏢 Departments in database:');
        for (const dept of departments) {
            const count = await Teacher.countDocuments({ department: dept });
            console.log(`• ${dept}: ${count} teacher${count !== 1 ? 's' : ''}`);
        }

        console.log('\n🎉 Sample teachers added successfully!');
        console.log('💡 You can now test the department filter in the admin panel');

    } catch (error) {
        console.error('❌ Error adding sample teachers:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
addSampleTeachers();