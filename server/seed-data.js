const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ Connected to MongoDB');
    seedData();
}).catch(err => {
    console.log('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Schemas
const studentManagementSchema = new mongoose.Schema({
    enrollmentNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: String, required: true },
    dob: { type: Date, required: true },
    phone: String,
    createdAt: { type: Date, default: Date.now }
});

const teacherSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    subject: { type: String, required: true },
    semester: String,
    canEditTimetable: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNumber: String,
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    timerValue: { type: Number, default: 0 },
    checkInTime: Date,
    checkOutTime: Date,
    lecturesAttended: Number,
    totalLectures: Number,
    semester: String,
    branch: String,
    createdAt: { type: Date, default: Date.now }
});

const timetableSchema = new mongoose.Schema({
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    periods: [{
        number: Number,
        startTime: String,
        endTime: String
    }],
    timetable: {
        monday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        tuesday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        wednesday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        thursday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        friday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        saturday: [{ period: Number, subject: String, room: String, isBreak: Boolean }]
    },
    lastUpdated: { type: Date, default: Date.now }
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);

// Sample Data - Students from different semesters and courses
const students = [
    // CSE Semester 1
    { enrollmentNo: '0246CS241001', name: 'Aditya Singh', email: 'aditya.cs001@college.edu', password: 'aditya', course: 'CSE', semester: '1', dob: new Date('2006-01-15'), phone: '9876543201' },
    { enrollmentNo: '0246CS241002', name: 'Priya Sharma', email: 'priya.cs002@college.edu', password: 'aditya', course: 'CSE', semester: '1', dob: new Date('2006-02-20'), phone: '9876543202' },
    { enrollmentNo: '0246CS241003', name: 'Rahul Kumar', email: 'rahul.cs003@college.edu', password: 'aditya', course: 'CSE', semester: '1', dob: new Date('2006-03-10'), phone: '9876543203' },
    { enrollmentNo: '0246CS241004', name: 'Ankit Jain', email: 'ankit.cs004@college.edu', password: 'aditya', course: 'CSE', semester: '1', dob: new Date('2006-04-05'), phone: '9876543204' },
    // CSE Semester 3
    { enrollmentNo: '0246CS231001', name: 'Sneha Patel', email: 'sneha.cs005@college.edu', password: 'aditya', course: 'CSE', semester: '3', dob: new Date('2005-04-25'), phone: '9876543205' },
    { enrollmentNo: '0246CS231002', name: 'Vikram Reddy', email: 'vikram.cs006@college.edu', password: 'aditya', course: 'CSE', semester: '3', dob: new Date('2005-05-30'), phone: '9876543206' },
    { enrollmentNo: '0246CS231003', name: 'Amit Verma', email: 'amit.cs007@college.edu', password: 'aditya', course: 'CSE', semester: '3', dob: new Date('2005-06-15'), phone: '9876543207' },
    { enrollmentNo: '0246CS231004', name: 'Ritu Gupta', email: 'ritu.cs008@college.edu', password: 'aditya', course: 'CSE', semester: '3', dob: new Date('2005-07-10'), phone: '9876543208' },
    // CSE Semester 5
    { enrollmentNo: '0246CS221001', name: 'Ravi Shankar', email: 'ravi.cs009@college.edu', password: 'aditya', course: 'CSE', semester: '5', dob: new Date('2004-07-20'), phone: '9876543209' },
    { enrollmentNo: '0246CS221002', name: 'Kavya Nair', email: 'kavya.cs010@college.edu', password: 'aditya', course: 'CSE', semester: '5', dob: new Date('2004-08-12'), phone: '9876543210' },
    { enrollmentNo: '0246CS221003', name: 'Manish Tiwari', email: 'manish.cs011@college.edu', password: 'aditya', course: 'CSE', semester: '5', dob: new Date('2004-09-18'), phone: '9876543211' },
    // ECE Semester 1
    { enrollmentNo: '0246EC241001', name: 'Ananya Gupta', email: 'ananya.ec001@college.edu', password: 'aditya', course: 'ECE', semester: '1', dob: new Date('2006-06-12'), phone: '9876543212' },
    { enrollmentNo: '0246EC241002', name: 'Karan Mehta', email: 'karan.ec002@college.edu', password: 'aditya', course: 'ECE', semester: '1', dob: new Date('2006-07-18'), phone: '9876543213' },
    { enrollmentNo: '0246EC241003', name: 'Simran Kaur', email: 'simran.ec003@college.edu', password: 'aditya', course: 'ECE', semester: '1', dob: new Date('2006-08-22'), phone: '9876543214' },
    // ECE Semester 3
    { enrollmentNo: '0246EC231001', name: 'Divya Iyer', email: 'divya.ec004@college.edu', password: 'aditya', course: 'ECE', semester: '3', dob: new Date('2005-08-22'), phone: '9876543215' },
    { enrollmentNo: '0246EC231002', name: 'Sanjay Kumar', email: 'sanjay.ec005@college.edu', password: 'aditya', course: 'ECE', semester: '3', dob: new Date('2005-09-10'), phone: '9876543216' },
    { enrollmentNo: '0246EC231003', name: 'Pooja Deshmukh', email: 'pooja.ec006@college.edu', password: 'aditya', course: 'ECE', semester: '3', dob: new Date('2005-10-15'), phone: '9876543217' },
    // ECE Semester 5
    { enrollmentNo: '0246EC221001', name: 'Meera Reddy', email: 'meera.ec007@college.edu', password: 'aditya', course: 'ECE', semester: '5', dob: new Date('2004-10-05'), phone: '9876543218' },
    { enrollmentNo: '0246EC221002', name: 'Arjun Nambiar', email: 'arjun.ec008@college.edu', password: 'aditya', course: 'ECE', semester: '5', dob: new Date('2004-11-20'), phone: '9876543219' },
    // ME Semester 1
    { enrollmentNo: '0246ME241001', name: 'Arjun Nair', email: 'arjun.me001@college.edu', password: 'aditya', course: 'ME', semester: '1', dob: new Date('2006-09-05'), phone: '9876543220' },
    { enrollmentNo: '0246ME241002', name: 'Pooja Desai', email: 'pooja.me002@college.edu', password: 'aditya', course: 'ME', semester: '1', dob: new Date('2006-10-14'), phone: '9876543221' },
    { enrollmentNo: '0246ME241003', name: 'Nikhil Rao', email: 'nikhil.me003@college.edu', password: 'aditya', course: 'ME', semester: '1', dob: new Date('2006-11-08'), phone: '9876543222' },
    // ME Semester 3
    { enrollmentNo: '0246ME231001', name: 'Suresh Patel', email: 'suresh.me004@college.edu', password: 'aditya', course: 'ME', semester: '3', dob: new Date('2005-11-20'), phone: '9876543223' },
    { enrollmentNo: '0246ME231002', name: 'Lakshmi Iyer', email: 'lakshmi.me005@college.edu', password: 'aditya', course: 'ME', semester: '3', dob: new Date('2005-12-08'), phone: '9876543224' },
    { enrollmentNo: '0246ME231003', name: 'Rajesh Yadav', email: 'rajesh.me006@college.edu', password: 'aditya', course: 'ME', semester: '3', dob: new Date('2005-01-12'), phone: '9876543225' },
    // ME Semester 5
    { enrollmentNo: '0246ME221001', name: 'Deepika Singh', email: 'deepika.me007@college.edu', password: 'aditya', course: 'ME', semester: '5', dob: new Date('2004-02-18'), phone: '9876543226' },
    // Civil Semester 1
    { enrollmentNo: '0246CE241001', name: 'Rohit Verma', email: 'rohit.ce001@college.edu', password: 'aditya', course: 'Civil', semester: '1', dob: new Date('2006-11-20'), phone: '9876543227' },
    { enrollmentNo: '0246CE241002', name: 'Neha Joshi', email: 'neha.ce002@college.edu', password: 'aditya', course: 'Civil', semester: '1', dob: new Date('2006-12-08'), phone: '9876543228' },
    { enrollmentNo: '0246CE241003', name: 'Varun Malhotra', email: 'varun.ce003@college.edu', password: 'aditya', course: 'Civil', semester: '1', dob: new Date('2006-01-25'), phone: '9876543229' },
    // Civil Semester 3
    { enrollmentNo: '0246CE231001', name: 'Deepak Singh', email: 'deepak.ce004@college.edu', password: 'aditya', course: 'Civil', semester: '3', dob: new Date('2005-01-25'), phone: '9876543230' },
    { enrollmentNo: '0246CE231002', name: 'Anjali Sharma', email: 'anjali.ce005@college.edu', password: 'aditya', course: 'Civil', semester: '3', dob: new Date('2005-02-18'), phone: '9876543231' },
    { enrollmentNo: '0246CE231003', name: 'Karthik Menon', email: 'karthik.ce006@college.edu', password: 'aditya', course: 'Civil', semester: '3', dob: new Date('2005-03-22'), phone: '9876543232' },
    // Civil Semester 5
    { enrollmentNo: '0246CE221001', name: 'Priyanka Das', email: 'priyanka.ce007@college.edu', password: 'aditya', course: 'Civil', semester: '5', dob: new Date('2004-04-10'), phone: '9876543233' },
];

const teachers = [
    { employeeId: 'TEACH001', name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@college.edu', password: 'aditya', department: 'CSE', subject: 'Data Structures', semester: '3', canEditTimetable: true },
    { employeeId: 'TEACH002', name: 'Prof. Meera Singh', email: 'meera.singh@college.edu', password: 'aditya', department: 'CSE', subject: 'Database Management', semester: '3', canEditTimetable: true },
    { employeeId: 'TEACH003', name: 'Dr. Sunil Patil', email: 'sunil.patil@college.edu', password: 'aditya', department: 'CSE', subject: 'Programming in C', semester: '1', canEditTimetable: true },
    { employeeId: 'TEACH004', name: 'Prof. Anjali Desai', email: 'anjali.desai@college.edu', password: 'aditya', department: 'CSE', subject: 'Machine Learning', semester: '5', canEditTimetable: true },
    { employeeId: 'TEACH005', name: 'Dr. Amit Patel', email: 'amit.patel@college.edu', password: 'aditya', department: 'ECE', subject: 'Digital Electronics', semester: '3', canEditTimetable: false },
    { employeeId: 'TEACH006', name: 'Prof. Sunita Reddy', email: 'sunita.reddy@college.edu', password: 'aditya', department: 'ECE', subject: 'Signals & Systems', semester: '3', canEditTimetable: false },
    { employeeId: 'TEACH007', name: 'Dr. Ramesh Rao', email: 'ramesh.rao@college.edu', password: 'aditya', department: 'ME', subject: 'Thermodynamics', semester: '3', canEditTimetable: false },
    { employeeId: 'TEACH008', name: 'Prof. Kavita Nair', email: 'kavita.nair@college.edu', password: 'aditya', department: 'ME', subject: 'Fluid Mechanics', semester: '3', canEditTimetable: false },
    { employeeId: 'TEACH009', name: 'Dr. Prakash Joshi', email: 'prakash.joshi@college.edu', password: 'aditya', department: 'Civil', subject: 'Structural Analysis', semester: '3', canEditTimetable: false },
    { employeeId: 'TEACH010', name: 'Prof. Rekha Iyer', email: 'rekha.iyer@college.edu', password: 'aditya', department: 'Civil', subject: 'Surveying', semester: '1', canEditTimetable: false },
];

function generateAttendanceRecords(students) {
    const records = [];
    const startDate = new Date('2025-04-18');
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        students.forEach(student => {
            const attendanceRate = 0.7 + Math.random() * 0.2;
            const isPresent = Math.random() < attendanceRate;
            
            if (isPresent) {
                const lecturesAttended = 4 + Math.floor(Math.random() * 5);
                const checkInHour = 9;
                const checkInMinute = 30 + Math.floor(Math.random() * 30);
                const checkInTime = new Date(date);
                checkInTime.setHours(checkInHour, checkInMinute, 0, 0);
                
                const checkOutHour = 15 + Math.floor(Math.random() * 2);
                const checkOutMinute = Math.floor(Math.random() * 60);
                const checkOutTime = new Date(date);
                checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);
                
                records.push({
                    studentId: student.enrollmentNo,
                    studentName: student.name,
                    enrollmentNumber: student.enrollmentNo,
                    date: new Date(date),
                    status: 'present',
                    timerValue: 0,
                    lecturesAttended: lecturesAttended,
                    totalLectures: 8,
                    checkInTime: checkInTime,
                    checkOutTime: checkOutTime,
                    semester: student.semester,
                    branch: student.course
                });
            } else {
                records.push({
                    studentId: student.enrollmentNo,
                    studentName: student.name,
                    enrollmentNumber: student.enrollmentNo,
                    date: new Date(date),
                    status: 'absent',
                    timerValue: 120,
                    lecturesAttended: 0,
                    totalLectures: 8,
                    checkInTime: null,
                    checkOutTime: null,
                    semester: student.semester,
                    branch: student.course
                });
            }
        });
    }
    return records;
}

const standardPeriods = [
    { number: 1, startTime: '09:40', endTime: '10:40' },
    { number: 2, startTime: '10:40', endTime: '11:40' },
    { number: 3, startTime: '11:40', endTime: '12:10' },
    { number: 4, startTime: '12:10', endTime: '13:10' },
    { number: 5, startTime: '13:10', endTime: '14:10' },
    { number: 6, startTime: '14:10', endTime: '14:20' },
    { number: 7, startTime: '14:20', endTime: '15:30' },
    { number: 8, startTime: '15:30', endTime: '16:10' },
];

// Helper function to create a standard day schedule
function createDaySchedule(subjects) {
    return [
        { period: 1, subject: subjects[0], room: subjects[0].includes('Break') ? '' : `${subjects[0].substring(0,2)}-101`, isBreak: subjects[0].includes('Break') },
        { period: 2, subject: subjects[1], room: subjects[1].includes('Break') ? '' : `${subjects[1].substring(0,2)}-102`, isBreak: subjects[1].includes('Break') },
        { period: 3, subject: subjects[2], room: subjects[2].includes('Break') ? '' : `${subjects[2].substring(0,2)}-103`, isBreak: subjects[2].includes('Break') },
        { period: 4, subject: 'Lunch Break', room: '', isBreak: true },
        { period: 5, subject: subjects[3], room: subjects[3].includes('Break') ? '' : `${subjects[3].substring(0,2)}-104`, isBreak: subjects[3].includes('Break') },
        { period: 6, subject: 'Break', room: '', isBreak: true },
        { period: 7, subject: subjects[4], room: subjects[4].includes('Break') || subjects[4].includes('Lab') ? subjects[4].includes('Lab') ? 'Lab-1' : '' : `${subjects[4].substring(0,2)}-105`, isBreak: subjects[4].includes('Break') },
        { period: 8, subject: subjects[5], room: subjects[5].includes('Lab') || subjects[5].includes('Workshop') || subjects[5].includes('Project') ? 'Lab-2' : `${subjects[5].substring(0,2)}-106`, isBreak: false },
    ];
}

const timetables = [
    // CSE Semester 1
    {
        semester: '1',
        branch: 'CSE',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Mathematics-I', 'Physics', 'Chemistry', 'Programming in C', 'English', 'Lab']),
            tuesday: createDaySchedule(['Physics', 'Mathematics-I', 'Programming in C', 'Chemistry', 'Engineering Drawing', 'Workshop']),
            wednesday: createDaySchedule(['Chemistry', 'Programming in C', 'Mathematics-I', 'Physics', 'English', 'Lab']),
            thursday: createDaySchedule(['Programming in C', 'Chemistry', 'Physics', 'Mathematics-I', 'Engineering Drawing', 'Workshop']),
            friday: createDaySchedule(['English', 'Mathematics-I', 'Programming in C', 'Physics', 'Chemistry', 'Lab']),
        }
    },
    // CSE Semester 3
    {
        semester: '3',
        branch: 'CSE',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Lab']),
            tuesday: createDaySchedule(['DBMS', 'Data Structures', 'Computer Networks', 'Operating Systems', 'Software Engineering', 'Lab']),
            wednesday: createDaySchedule(['Operating Systems', 'Computer Networks', 'Data Structures', 'DBMS', 'Software Engineering', 'Lab']),
            thursday: createDaySchedule(['Computer Networks', 'Operating Systems', 'Software Engineering', 'Data Structures', 'DBMS', 'Project Work']),
            friday: createDaySchedule(['Software Engineering', 'Data Structures', 'DBMS', 'Computer Networks', 'Operating Systems', 'Project Work']),
        }
    },
    // CSE Semester 5
    {
        semester: '5',
        branch: 'CSE',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Machine Learning', 'Compiler Design', 'Web Technologies', 'Computer Graphics', 'Artificial Intelligence', 'Lab']),
            tuesday: createDaySchedule(['Compiler Design', 'Machine Learning', 'Computer Graphics', 'Web Technologies', 'Artificial Intelligence', 'Lab']),
            wednesday: createDaySchedule(['Web Technologies', 'Computer Graphics', 'Machine Learning', 'Compiler Design', 'Artificial Intelligence', 'Project Work']),
            thursday: createDaySchedule(['Computer Graphics', 'Web Technologies', 'Artificial Intelligence', 'Machine Learning', 'Compiler Design', 'Project Work']),
            friday: createDaySchedule(['Artificial Intelligence', 'Machine Learning', 'Compiler Design', 'Web Technologies', 'Computer Graphics', 'Project Work']),
        }
    },
    // ECE Semester 1
    {
        semester: '1',
        branch: 'ECE',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Mathematics-I', 'Physics', 'Chemistry', 'Basic Electronics', 'English', 'Lab']),
            tuesday: createDaySchedule(['Physics', 'Mathematics-I', 'Basic Electronics', 'Chemistry', 'Engineering Drawing', 'Workshop']),
            wednesday: createDaySchedule(['Chemistry', 'Basic Electronics', 'Mathematics-I', 'Physics', 'English', 'Lab']),
            thursday: createDaySchedule(['Basic Electronics', 'Chemistry', 'Physics', 'Mathematics-I', 'Engineering Drawing', 'Workshop']),
            friday: createDaySchedule(['English', 'Mathematics-I', 'Basic Electronics', 'Physics', 'Chemistry', 'Lab']),
        }
    },
    // ECE Semester 3
    {
        semester: '3',
        branch: 'ECE',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Digital Electronics', 'Signals & Systems', 'Analog Circuits', 'Microprocessors', 'Communication Systems', 'Lab']),
            tuesday: createDaySchedule(['Signals & Systems', 'Digital Electronics', 'Microprocessors', 'Analog Circuits', 'Communication Systems', 'Lab']),
            wednesday: createDaySchedule(['Analog Circuits', 'Microprocessors', 'Digital Electronics', 'Signals & Systems', 'Communication Systems', 'Lab']),
            thursday: createDaySchedule(['Microprocessors', 'Analog Circuits', 'Communication Systems', 'Digital Electronics', 'Signals & Systems', 'Project Work']),
            friday: createDaySchedule(['Communication Systems', 'Digital Electronics', 'Signals & Systems', 'Microprocessors', 'Analog Circuits', 'Project Work']),
        }
    },
    // ECE Semester 5
    {
        semester: '5',
        branch: 'ECE',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['VLSI Design', 'Digital Signal Processing', 'Microwave Engineering', 'Control Systems', 'Embedded Systems', 'Lab']),
            tuesday: createDaySchedule(['Digital Signal Processing', 'VLSI Design', 'Control Systems', 'Microwave Engineering', 'Embedded Systems', 'Lab']),
            wednesday: createDaySchedule(['Microwave Engineering', 'Control Systems', 'VLSI Design', 'Digital Signal Processing', 'Embedded Systems', 'Project Work']),
            thursday: createDaySchedule(['Control Systems', 'Microwave Engineering', 'Embedded Systems', 'VLSI Design', 'Digital Signal Processing', 'Project Work']),
            friday: createDaySchedule(['Embedded Systems', 'VLSI Design', 'Digital Signal Processing', 'Microwave Engineering', 'Control Systems', 'Project Work']),
        }
    },
    // ME Semester 1
    {
        semester: '1',
        branch: 'ME',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Mathematics-I', 'Physics', 'Chemistry', 'Engineering Mechanics', 'English', 'Lab']),
            tuesday: createDaySchedule(['Physics', 'Mathematics-I', 'Engineering Mechanics', 'Chemistry', 'Engineering Drawing', 'Workshop']),
            wednesday: createDaySchedule(['Chemistry', 'Engineering Mechanics', 'Mathematics-I', 'Physics', 'English', 'Lab']),
            thursday: createDaySchedule(['Engineering Mechanics', 'Chemistry', 'Physics', 'Mathematics-I', 'Engineering Drawing', 'Workshop']),
            friday: createDaySchedule(['English', 'Mathematics-I', 'Engineering Mechanics', 'Physics', 'Chemistry', 'Lab']),
        }
    },
    // ME Semester 3
    {
        semester: '3',
        branch: 'ME',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Thermodynamics', 'Fluid Mechanics', 'Manufacturing Processes', 'Strength of Materials', 'Machine Drawing', 'Lab']),
            tuesday: createDaySchedule(['Fluid Mechanics', 'Thermodynamics', 'Strength of Materials', 'Manufacturing Processes', 'Machine Drawing', 'Lab']),
            wednesday: createDaySchedule(['Manufacturing Processes', 'Strength of Materials', 'Thermodynamics', 'Fluid Mechanics', 'Machine Drawing', 'Lab']),
            thursday: createDaySchedule(['Strength of Materials', 'Manufacturing Processes', 'Machine Drawing', 'Thermodynamics', 'Fluid Mechanics', 'Project Work']),
            friday: createDaySchedule(['Machine Drawing', 'Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Manufacturing Processes', 'Project Work']),
        }
    },
    // ME Semester 5
    {
        semester: '5',
        branch: 'ME',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Heat Transfer', 'Machine Design', 'Dynamics of Machinery', 'Manufacturing Technology', 'Industrial Engineering', 'Lab']),
            tuesday: createDaySchedule(['Machine Design', 'Heat Transfer', 'Manufacturing Technology', 'Dynamics of Machinery', 'Industrial Engineering', 'Lab']),
            wednesday: createDaySchedule(['Dynamics of Machinery', 'Manufacturing Technology', 'Heat Transfer', 'Machine Design', 'Industrial Engineering', 'Project Work']),
            thursday: createDaySchedule(['Manufacturing Technology', 'Dynamics of Machinery', 'Industrial Engineering', 'Heat Transfer', 'Machine Design', 'Project Work']),
            friday: createDaySchedule(['Industrial Engineering', 'Heat Transfer', 'Machine Design', 'Manufacturing Technology', 'Dynamics of Machinery', 'Project Work']),
        }
    },
    // Civil Semester 1
    {
        semester: '1',
        branch: 'Civil',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Mathematics-I', 'Physics', 'Chemistry', 'Engineering Mechanics', 'English', 'Lab']),
            tuesday: createDaySchedule(['Physics', 'Mathematics-I', 'Engineering Mechanics', 'Chemistry', 'Engineering Drawing', 'Workshop']),
            wednesday: createDaySchedule(['Chemistry', 'Engineering Mechanics', 'Mathematics-I', 'Physics', 'English', 'Lab']),
            thursday: createDaySchedule(['Engineering Mechanics', 'Chemistry', 'Physics', 'Mathematics-I', 'Engineering Drawing', 'Workshop']),
            friday: createDaySchedule(['English', 'Mathematics-I', 'Engineering Mechanics', 'Physics', 'Chemistry', 'Lab']),
        }
    },
    // Civil Semester 3
    {
        semester: '3',
        branch: 'Civil',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Structural Analysis', 'Surveying', 'Concrete Technology', 'Fluid Mechanics', 'Geotechnical Engineering', 'Lab']),
            tuesday: createDaySchedule(['Surveying', 'Structural Analysis', 'Fluid Mechanics', 'Concrete Technology', 'Geotechnical Engineering', 'Lab']),
            wednesday: createDaySchedule(['Concrete Technology', 'Fluid Mechanics', 'Structural Analysis', 'Surveying', 'Geotechnical Engineering', 'Lab']),
            thursday: createDaySchedule(['Fluid Mechanics', 'Concrete Technology', 'Geotechnical Engineering', 'Structural Analysis', 'Surveying', 'Project Work']),
            friday: createDaySchedule(['Geotechnical Engineering', 'Structural Analysis', 'Surveying', 'Fluid Mechanics', 'Concrete Technology', 'Project Work']),
        }
    },
    // Civil Semester 5
    {
        semester: '5',
        branch: 'Civil',
        periods: standardPeriods,
        timetable: {
            monday: createDaySchedule(['Design of Structures', 'Transportation Engineering', 'Environmental Engineering', 'Water Resources', 'Construction Management', 'Lab']),
            tuesday: createDaySchedule(['Transportation Engineering', 'Design of Structures', 'Water Resources', 'Environmental Engineering', 'Construction Management', 'Lab']),
            wednesday: createDaySchedule(['Environmental Engineering', 'Water Resources', 'Design of Structures', 'Transportation Engineering', 'Construction Management', 'Project Work']),
            thursday: createDaySchedule(['Water Resources', 'Environmental Engineering', 'Construction Management', 'Design of Structures', 'Transportation Engineering', 'Project Work']),
            friday: createDaySchedule(['Construction Management', 'Design of Structures', 'Transportation Engineering', 'Water Resources', 'Environmental Engineering', 'Project Work']),
        }
    },
];

async function seedData() {
    try {
        console.log('🗑️  Clearing existing data...');
        await StudentManagement.deleteMany({});
        await Teacher.deleteMany({});
        await AttendanceRecord.deleteMany({});
        await Timetable.deleteMany({});
        
        console.log('👥 Adding students...');
        await StudentManagement.insertMany(students);
        console.log(`✅ Added ${students.length} students`);
        
        console.log('👨‍🏫 Adding teachers...');
        await Teacher.insertMany(teachers);
        console.log(`✅ Added ${teachers.length} teachers`);
        
        console.log('📊 Generating attendance records from April 18, 2025 to today...');
        const attendanceRecords = generateAttendanceRecords(students);
        await AttendanceRecord.insertMany(attendanceRecords);
        console.log(`✅ Added ${attendanceRecords.length} attendance records`);
        
        console.log('📅 Adding timetables...');
        await Timetable.insertMany(timetables);
        console.log(`✅ Added ${timetables.length} timetables`);
        
        console.log('\n========================================');
        console.log('✅ DATA SEEDING COMPLETED!');
        console.log('========================================\n');
        console.log('📝 Sample Login Credentials:');
        console.log('\n👨‍🎓 STUDENTS:');
        console.log('  ID: 0246CS241001 | Password: aditya | Aditya Singh (CSE Sem 1)');
        console.log('  ID: 0246CS231001 | Password: aditya | Sneha Patel (CSE Sem 3)');
        console.log('  ID: 0246CS221001 | Password: aditya | Ravi Shankar (CSE Sem 5)');
        console.log('  ID: 0246EC241001 | Password: aditya | Ananya Gupta (ECE Sem 1)');
        console.log('  ID: 0246ME241001 | Password: aditya | Arjun Nair (ME Sem 1)');
        console.log('  ID: 0246CE241001 | Password: aditya | Rohit Verma (Civil Sem 1)');
        console.log('\n👨‍🏫 TEACHERS:');
        console.log('  ID: TEACH001 | Password: aditya | Dr. Rajesh Kumar (CSE)');
        console.log('  ID: TEACH003 | Password: aditya | Dr. Sunil Patil (CSE)');
        console.log('  ID: TEACH005 | Password: aditya | Dr. Amit Patel (ECE)');
        console.log('\n📊 Attendance Data:');
        console.log(`  Generated from: April 18, 2025`);
        console.log(`  To: ${new Date().toLocaleDateString()}`);
        console.log(`  Total records: ${attendanceRecords.length}`);
        console.log('\n⏰ College Timings:');
        console.log('  Period 1: 09:40 - 10:40');
        console.log('  Period 2: 10:40 - 11:40');
        console.log('  Period 3: 11:40 - 12:10');
        console.log('  Lunch:    12:10 - 13:10');
        console.log('  Period 5: 13:10 - 14:10');
        console.log('  Break:    14:10 - 14:20');
        console.log('  Period 7: 14:20 - 15:30');
        console.log('  Period 8: 15:30 - 16:10');
        console.log('\n========================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}
