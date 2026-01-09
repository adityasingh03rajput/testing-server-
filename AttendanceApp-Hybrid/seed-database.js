// LetsBunk Database Seeder - Populate MongoDB with Demo Data
const mongoose = require('mongoose');
// Try to use bcrypt, fallback to bcryptjs for deployment compatibility
let bcrypt;
try {
    bcrypt = require('bcrypt');
} catch (error) {
    console.log('⚠️  bcrypt not available, using bcryptjs fallback');
    bcrypt = require('bcryptjs');
}

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

// Define Schemas (matching server.js)
const studentManagementSchema = new mongoose.Schema({
    enrollmentNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: String, required: true },
    dob: { type: Date, required: true },
    phone: String,
    photoUrl: String,
    faceDescriptor: [Number],
    faceDescriptorUpdatedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    timerValue: { type: Number, default: 0 },
    isRunning: { type: Boolean, default: false },
    status: { type: String, enum: ['attending', 'absent', 'present'], default: 'absent' },
    lastUpdated: { type: Date, default: Date.now },
    attendanceSession: {
        sessionStartTime: { type: Date },
        totalAttendedSeconds: { type: Number, default: 0 },
        lastPauseTime: { type: Date },
        pausedDuration: { type: Number, default: 0 },
        isPaused: { type: Boolean, default: false },
        pauseReason: { type: String },
        randomRingId: { type: String },
        randomRingTime: { type: Date },
        timeBeforeRandomRing: { type: Number },
        verifiedForPeriod: { type: String },
        offlinePeriods: [{
            startTime: { type: Date },
            endTime: { type: Date },
            duration: { type: Number }
        }],
        wifiEvents: [{
            timestamp: { type: Date },
            type: { type: String },
            bssid: { type: String },
            lecture: {
                subject: String,
                room: String,
                startTime: String,
                endTime: String
            },
            gracePeriod: { type: Boolean, default: false }
        }],
        pauseEvents: [{
            type: { type: String },
            reason: { type: String },
            timestamp: { type: Date }
        }]
    },
    currentClass: {
        subject: String,
        teacher: String,
        room: String,
        period: Number,
        startTime: String,
        endTime: String,
        totalDurationSeconds: Number
    },
    attendanceBackup: [{
        date: { type: Date, required: true },
        timestamp: { type: Date, required: true },
        attendedMinutes: { type: Number, required: true },
        currentClass: { type: String },
        isRunning: { type: Boolean },
        status: { type: String }
    }]
});

const teacherSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    subjects: [String],
    phone: String,
    photoUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const classroomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    building: { type: String, required: true },
    capacity: { type: Number, required: true },
    bssid: { type: String, required: true, unique: true },
    ssid: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const timetableSchema = new mongoose.Schema({
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    day: { type: String, required: true },
    periods: [{
        period: Number,
        subject: String,
        teacher: String,
        room: String,
        startTime: String,
        endTime: String
    }],
    createdAt: { type: Date, default: Date.now }
});

// Models
const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const Classroom = mongoose.model('Classroom', classroomSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);

// Sample Data
const courses = [
    'B.Tech Computer Science',
    'B.Tech Data Science', 
    'B.Tech Information Technology',
    'B.Tech Artificial Intelligence',
    'B.Tech Cyber Security'
];

const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

const subjects = [
    'Data Structures and Algorithms',
    'Database Management Systems',
    'Computer Networks',
    'Operating Systems',
    'Software Engineering',
    'Machine Learning',
    'Artificial Intelligence',
    'Web Development',
    'Mobile App Development',
    'Cyber Security Fundamentals',
    'Cloud Computing',
    'Internet of Things',
    'Blockchain Technology',
    'Computer Graphics',
    'Human Computer Interaction'
];

const departments = [
    'Computer Science',
    'Information Technology', 
    'Electronics',
    'Mathematics',
    'Physics'
];

const indianNames = [
    'Aarav Sharma', 'Priya Patel', 'Rohan Kumar', 'Ananya Singh', 'Vikram Desai',
    'Sneha Reddy', 'Kabir Malhotra', 'Diya Gupta', 'Arjun Verma', 'Meera Iyer',
    'Aditya Joshi', 'Ishita Nair', 'Siddharth Agarwal', 'Kavya Menon', 'Harsh Bansal',
    'Riya Chopra', 'Karan Sethi', 'Pooja Bhatt', 'Nikhil Rao', 'Tanya Kapoor',
    'Rahul Saxena', 'Shreya Pandey', 'Varun Khanna', 'Nisha Jain', 'Akash Tiwari',
    'Ritika Sinha', 'Gaurav Mishra', 'Priyanka Shah', 'Rohit Gupta', 'Sakshi Dubey',
    'Manish Kumar', 'Deepika Singh', 'Rajesh Patel', 'Neha Sharma', 'Suresh Reddy',
    'Kavita Desai', 'Amit Verma', 'Sunita Agarwal', 'Ravi Malhotra', 'Geeta Iyer',
    'Ashok Joshi', 'Rekha Nair', 'Vijay Bansal', 'Sushma Chopra', 'Manoj Sethi',
    'Lata Bhatt', 'Ramesh Rao', 'Usha Kapoor', 'Dinesh Saxena', 'Manju Pandey'
];

const teacherNames = [
    'Dr. Rajesh Kumar', 'Prof. Priya Sharma', 'Dr. Amit Patel', 'Prof. Sunita Verma',
    'Dr. Vikash Singh', 'Prof. Meera Gupta', 'Dr. Suresh Reddy', 'Prof. Kavita Joshi',
    'Dr. Ramesh Iyer', 'Prof. Geeta Malhotra', 'Dr. Ashok Desai', 'Prof. Rekha Nair',
    'Dr. Manoj Agarwal', 'Prof. Sushma Bansal', 'Dr. Dinesh Chopra', 'Prof. Usha Sethi'
];

// Utility Functions
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateEnrollmentNo(course, semester, index) {
    const year = '2024';
    const courseCode = course.includes('Computer Science') ? 'CS' : 
                     course.includes('Data Science') ? 'DS' :
                     course.includes('Information Technology') ? 'IT' :
                     course.includes('Artificial Intelligence') ? 'AI' : 'CY';
    return `${year}${courseCode}${semester.padStart(2, '0')}${(index + 1).toString().padStart(3, '0')}`;
}

function generateEmail(name, enrollmentNo) {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    return `${cleanName}.${enrollmentNo}@letsbunk.edu.in`;
}

function generatePhoneNumber() {
    return `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateAttendanceSession() {
    const isActive = Math.random() > 0.7; // 30% chance of active session
    const sessionStart = new Date(Date.now() - Math.random() * 7200000); // Within last 2 hours
    
    return {
        sessionStartTime: isActive ? sessionStart : null,
        totalAttendedSeconds: Math.floor(Math.random() * 7200), // 0-2 hours
        lastPauseTime: null,
        pausedDuration: 0,
        isPaused: false,
        pauseReason: null,
        randomRingId: isActive ? `ring_${Date.now()}` : null,
        randomRingTime: isActive ? new Date() : null,
        timeBeforeRandomRing: Math.floor(Math.random() * 3600),
        verifiedForPeriod: null,
        offlinePeriods: [],
        wifiEvents: isActive ? [{
            timestamp: sessionStart,
            type: 'connected',
            bssid: 'b4:86:18:6f:fb:ec',
            lecture: {
                subject: getRandomElement(subjects),
                room: `Room ${Math.floor(Math.random() * 50) + 101}`,
                startTime: '09:00',
                endTime: '10:00'
            },
            gracePeriod: false
        }] : [],
        pauseEvents: []
    };
}

// Seeding Functions
async function seedStudents() {
    console.log('🎓 Seeding Students...');
    
    const students = [];
    let enrollmentIndex = 1;
    
    for (const course of courses) {
        for (const semester of semesters) {
            const studentsPerSemester = Math.floor(Math.random() * 30) + 20; // 20-50 students per semester
            
            for (let i = 0; i < studentsPerSemester; i++) {
                const name = getRandomElement(indianNames);
                const enrollmentNo = generateEnrollmentNo(course, semester, enrollmentIndex++);
                const email = generateEmail(name, enrollmentNo);
                const hashedPassword = await bcrypt.hash('student123', 10);
                
                const student = {
                    enrollmentNo,
                    name,
                    email,
                    password: hashedPassword,
                    course,
                    semester,
                    dob: getRandomDate(new Date('2000-01-01'), new Date('2005-12-31')),
                    phone: generatePhoneNumber(),
                    photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                    faceDescriptor: Array.from({length: 128}, () => Math.random()),
                    faceDescriptorUpdatedAt: new Date(),
                    timerValue: Math.floor(Math.random() * 7200), // 0-2 hours in seconds
                    isRunning: Math.random() > 0.8, // 20% chance of running timer
                    status: getRandomElement(['attending', 'absent', 'present']),
                    lastUpdated: new Date(),
                    attendanceSession: generateAttendanceSession(),
                    currentClass: {
                        subject: getRandomElement(subjects),
                        teacher: getRandomElement(teacherNames),
                        room: `Room ${Math.floor(Math.random() * 50) + 101}`,
                        period: Math.floor(Math.random() * 8) + 1,
                        startTime: '09:00',
                        endTime: '10:00',
                        totalDurationSeconds: 3600
                    },
                    attendanceBackup: []
                };
                
                students.push(student);
            }
        }
    }
    
    await StudentManagement.deleteMany({});
    await StudentManagement.insertMany(students);
    console.log(`✅ Seeded ${students.length} students`);
}

async function seedTeachers() {
    console.log('👨‍🏫 Seeding Teachers...');
    
    const teachers = [];
    
    for (let i = 0; i < teacherNames.length; i++) {
        const name = teacherNames[i];
        const employeeId = `EMP${(i + 1).toString().padStart(4, '0')}`;
        const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}.${employeeId}@letsbunk.edu.in`;
        const hashedPassword = await bcrypt.hash('teacher123', 10);
        
        const teacher = {
            employeeId,
            name,
            email,
            password: hashedPassword,
            department: getRandomElement(departments),
            subjects: [getRandomElement(subjects), getRandomElement(subjects)],
            phone: generatePhoneNumber(),
            photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            createdAt: new Date()
        };
        
        teachers.push(teacher);
    }
    
    await Teacher.deleteMany({});
    await Teacher.insertMany(teachers);
    console.log(`✅ Seeded ${teachers.length} teachers`);
}

async function seedClassrooms() {
    console.log('🏫 Seeding Classrooms...');
    
    const classrooms = [];
    const buildings = ['A', 'B', 'C', 'D'];
    
    for (const building of buildings) {
        for (let floor = 1; floor <= 3; floor++) {
            for (let room = 1; room <= 10; room++) {
                const roomNumber = `${building}${floor}${room.toString().padStart(2, '0')}`;
                const bssid = `b4:86:18:6f:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`;
                
                const classroom = {
                    roomNumber,
                    building: `Building ${building}`,
                    capacity: Math.floor(Math.random() * 40) + 30, // 30-70 capacity
                    bssid,
                    ssid: `LetsBunk_${building}_${floor}`,
                    isActive: true,
                    createdAt: new Date()
                };
                
                classrooms.push(classroom);
            }
        }
    }
    
    await Classroom.deleteMany({});
    await Classroom.insertMany(classrooms);
    console.log(`✅ Seeded ${classrooms.length} classrooms`);
}

async function seedTimetables() {
    console.log('📅 Seeding Timetables...');
    
    const timetables = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const timeSlots = [
        { period: 1, startTime: '09:00', endTime: '10:00' },
        { period: 2, startTime: '10:00', endTime: '11:00' },
        { period: 3, startTime: '11:15', endTime: '12:15' },
        { period: 4, startTime: '12:15', endTime: '13:15' },
        { period: 5, startTime: '14:00', endTime: '15:00' },
        { period: 6, startTime: '15:00', endTime: '16:00' },
        { period: 7, startTime: '16:15', endTime: '17:15' },
        { period: 8, startTime: '17:15', endTime: '18:15' }
    ];
    
    for (const course of courses) {
        for (const semester of semesters) {
            for (const day of days) {
                const periods = [];
                
                for (const slot of timeSlots) {
                    if (Math.random() > 0.3) { // 70% chance of having a class
                        periods.push({
                            period: slot.period,
                            subject: getRandomElement(subjects),
                            teacher: getRandomElement(teacherNames),
                            room: `Room ${Math.floor(Math.random() * 50) + 101}`,
                            startTime: slot.startTime,
                            endTime: slot.endTime
                        });
                    }
                }
                
                if (periods.length > 0) {
                    timetables.push({
                        semester,
                        branch: course,
                        day,
                        periods,
                        createdAt: new Date()
                    });
                }
            }
        }
    }
    
    await Timetable.deleteMany({});
    await Timetable.insertMany(timetables);
    console.log(`✅ Seeded ${timetables.length} timetables`);
}

// Main Seeding Function
async function seedDatabase() {
    try {
        console.log('🌱 LETSBUNK DATABASE SEEDER');
        console.log('='.repeat(50));
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Connected to MongoDB Atlas');
        
        // Seed all collections
        await seedStudents();
        await seedTeachers();
        await seedClassrooms();
        await seedTimetables();
        
        // Get final counts
        const studentCount = await StudentManagement.countDocuments();
        const teacherCount = await Teacher.countDocuments();
        const classroomCount = await Classroom.countDocuments();
        const timetableCount = await Timetable.countDocuments();
        
        console.log('\n📊 SEEDING COMPLETE!');
        console.log('='.repeat(50));
        console.log(`🎓 Students: ${studentCount}`);
        console.log(`👨‍🏫 Teachers: ${teacherCount}`);
        console.log(`🏫 Classrooms: ${classroomCount}`);
        console.log(`📅 Timetables: ${timetableCount}`);
        
        console.log('\n🎯 DEMO READY FEATURES:');
        console.log('• Realistic Indian student names and data');
        console.log('• Multiple courses and semesters');
        console.log('• Active attendance sessions (20% of students)');
        console.log('• Face descriptors for biometric demo');
        console.log('• WiFi BSSID data for location tracking');
        console.log('• Complete timetable system');
        console.log('• Teacher and classroom management');
        
        console.log('\n🌐 API ENDPOINTS TO TEST:');
        console.log('• GET /api/students?all=true (All students)');
        console.log('• GET /api/students?semester=3 (Filter by semester)');
        console.log('• GET /api/teachers (All teachers)');
        console.log('• GET /api/classrooms (All classrooms)');
        console.log('• GET /api/timetable/3/B.Tech Data Science (Timetable)');
        
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run the seeder
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };