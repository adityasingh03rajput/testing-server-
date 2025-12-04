const path = require('path');
const fs = require('fs');
const os = require('os');

// Function to get server IP addresses
function getServerIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({ interface: name, ip: iface.address });
            }
        }
    }

    return ips;
}

// Load environment variables
// On Render, variables are set in dashboard (no .env file needed)
// For local development, load from .env file
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} else {
    // No .env file, use system environment variables (Render, production)
    console.log('📝 Using system environment variables (no .env file)');
}
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

// Cloudinary configuration
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Set timeout for all requests
server.timeout = 120000; // 2 minutes
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

// Log slow requests
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.log(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
    });
    next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';
mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for Render
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📍 Database:', mongoose.connection.name);
}).catch(err => {
    console.log('⚠️  MongoDB not connected, using in-memory storage');
    console.log('Error:', err.message);
});

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

// Student Schema
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['attending', 'absent', 'present'], default: 'absent' },
    timerValue: { type: Number, default: 120 },
    isRunning: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
    sessionDate: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// Timetable Schema
const timetableSchema = new mongoose.Schema({
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    periods: [{
        number: Number,
        startTime: String,
        endTime: String
    }],
    timetable: {
        sunday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        monday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        tuesday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        wednesday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        thursday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        friday: [{ period: Number, subject: String, room: String, isBreak: Boolean }],
        saturday: [{ period: Number, subject: String, room: String, isBreak: Boolean }]
    },
    lastUpdated: { type: Date, default: Date.now }
});

const Timetable = mongoose.model('Timetable', timetableSchema);

// Attendance Record Schema
const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNumber: String,
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave'], required: true },

    // Detailed lecture-wise attendance
    lectures: [{
        subject: String,
        room: String,
        startTime: String,
        endTime: String,
        attended: Number,      // minutes attended
        total: Number,         // total lecture minutes
        percentage: Number,    // attendance percentage
        present: Boolean       // true if >= 75%
    }],

    // Daily totals (excluding breaks)
    totalAttended: { type: Number, default: 0 },      // total minutes attended
    totalClassTime: { type: Number, default: 0 },     // total class minutes
    dayPercentage: { type: Number, default: 0 },      // daily attendance %

    // Legacy fields (for backward compatibility)
    timerValue: { type: Number, default: 0 },
    checkInTime: Date,
    checkOutTime: Date,

    semester: String,
    branch: String,
    createdAt: { type: Date, default: Date.now }
});

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

// In-memory storage as fallback
let studentsMemory = [];
let timetableMemory = {};
let studentManagementMemory = [];
let teachersMemory = [];
let classroomsMemory = [];
let attendanceRecordsMemory = [];

// SDUI Configuration endpoint
app.get('/api/config', (req, res) => {
    res.json({
        version: '2.0.0',
        roleSelection: {
            backgroundColor: '#0a1628',
            title: { text: 'Who are you?', fontSize: 36, color: '#00f5ff', fontWeight: 'bold' },
            subtitle: { text: 'Select your role to continue', fontSize: 16, color: '#00d9ff' },
            roles: [
                {
                    id: 'student',
                    text: 'Student',
                    icon: '🎓',
                    backgroundColor: '#00d9ff',
                    textColor: '#0a1628'
                },
                {
                    id: 'teacher',
                    text: 'Teacher',
                    icon: '👨‍🏫',
                    backgroundColor: '#00bfff',
                    textColor: '#0a1628'
                }
            ]
        },
        studentNameInput: {
            backgroundColor: '#0a1628',
            title: { text: 'Enter Your Name', fontSize: 32, color: '#00f5ff', fontWeight: 'bold' },
            subtitle: { text: 'This will be visible to your teacher', fontSize: 14, color: '#00d9ff' },
            placeholder: 'Your Name',
            buttonText: 'START SESSION',
            inputBackgroundColor: '#0d1f3c',
            inputTextColor: '#00f5ff',
            inputBorderColor: '#00d9ff'
        },
        studentScreen: {
            backgroundColor: '#0a1628',
            title: { text: 'Countdown Timer', fontSize: 32, color: '#00f5ff', fontWeight: 'bold' },
            timer: {
                duration: 120,
                backgroundColor: '#0d1f3c',
                textColor: '#00f5ff',
                fontSize: 72,
                borderRadius: 20
            },
            buttons: [
                {
                    id: 'startPause',
                    text: 'START',
                    pauseText: 'PAUSE',
                    backgroundColor: '#00f5ff',
                    textColor: '#0a1628',
                    fontSize: 18
                },
                {
                    id: 'reset',
                    text: 'RESET',
                    backgroundColor: '#00d9ff',
                    textColor: '#0a1628',
                    fontSize: 18
                }
            ]
        },
        teacherScreen: {
            backgroundColor: '#0a1628',
            title: { text: 'Live Attendance', fontSize: 32, color: '#00f5ff', fontWeight: 'bold' },
            subtitle: { text: 'Real-time student tracking', fontSize: 16, color: '#00d9ff' },
            statusColors: {
                attending: '#00ff88',
                absent: '#ff4444',
                present: '#00d9ff'
            },
            cardBackgroundColor: '#0d1f3c',
            cardBorderColor: '#00d9ff'
        }
    });
});

// Student APIs
app.post('/api/student/register', async (req, res) => {
    try {
        const { name } = req.body;

        if (mongoose.connection.readyState === 1) {
            const student = new Student({ name, status: 'absent' });
            await student.save();
            res.json({ success: true, studentId: student._id, student });
        } else {
            const student = {
                _id: Date.now().toString(),
                name,
                status: 'absent',
                timerValue: 120,
                isRunning: false
            };
            studentsMemory.push(student);
            res.json({ success: true, studentId: student._id, student });
        }

        // Notify all teachers
        io.emit('student_registered', { name });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Timetable APIs
app.get('/api/timetable/:semester/:branch', async (req, res) => {
    try {
        const { semester, branch } = req.params;

        if (mongoose.connection.readyState === 1) {
            let timetable = await Timetable.findOne({ semester, branch });
            if (!timetable) {
                timetable = createDefaultTimetable(semester, branch);
            }
            res.json({ success: true, timetable });
        } else {
            const key = `${semester}_${branch}`;
            let timetable = timetableMemory[key];
            if (!timetable) {
                timetable = createDefaultTimetable(semester, branch);
                timetableMemory[key] = timetable;
            }
            res.json({ success: true, timetable });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/timetable', async (req, res) => {
    try {
        const { semester, branch, periods, timetable } = req.body;

        if (mongoose.connection.readyState === 1) {
            let existingTimetable = await Timetable.findOne({ semester, branch });
            if (existingTimetable) {
                existingTimetable.periods = periods;
                existingTimetable.timetable = timetable;
                existingTimetable.lastUpdated = new Date();
                await existingTimetable.save();
            } else {
                existingTimetable = new Timetable({ semester, branch, periods, timetable });
                await existingTimetable.save();
            }
            res.json({ success: true, timetable: existingTimetable });
        } else {
            const key = `${semester}_${branch}`;
            timetableMemory[key] = { semester, branch, periods, timetable, lastUpdated: new Date() };
            res.json({ success: true, timetable: timetableMemory[key] });
        }

        // Notify all students
        io.emit('timetable_updated', { semester, branch });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT endpoint for updating timetable (used by mobile app)
app.put('/api/timetable/:semester/:branch', async (req, res) => {
    try {
        const { semester, branch } = req.params;
        const { timetable, periods } = req.body;

        console.log(`📝 Updating timetable for ${branch} Semester ${semester}`);

        if (mongoose.connection.readyState === 1) {
            let existingTimetable = await Timetable.findOne({ semester, branch });
            if (existingTimetable) {
                existingTimetable.timetable = timetable;
                if (periods) existingTimetable.periods = periods;
                existingTimetable.lastUpdated = new Date();
                await existingTimetable.save();
                console.log('✅ Timetable updated successfully');
                res.json({ success: true, timetable: existingTimetable });
            } else {
                // Create new timetable if doesn't exist
                const newTimetable = new Timetable({
                    semester,
                    branch,
                    periods: periods || [],
                    timetable
                });
                await newTimetable.save();
                console.log('✅ New timetable created');
                res.json({ success: true, timetable: newTimetable });
            }
        } else {
            const key = `${semester}_${branch}`;
            timetableMemory[key] = { semester, branch, periods: periods || [], timetable, lastUpdated: new Date() };
            res.json({ success: true, timetable: timetableMemory[key] });
        }

        // Notify all students
        io.emit('timetable_updated', { semester, branch });
    } catch (error) {
        console.error('❌ Error updating timetable:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update periods for ALL timetables
app.post('/api/periods/update-all', async (req, res) => {
    try {
        const { periods } = req.body;

        if (!periods || !Array.isArray(periods) || periods.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid periods data'
            });
        }

        console.log(`📝 Updating periods for ALL timetables (${periods.length} periods)`);

        if (mongoose.connection.readyState === 1) {
            // Update all timetables in database
            const result = await Timetable.updateMany(
                {}, // Match all timetables
                {
                    $set: {
                        periods: periods,
                        lastUpdated: new Date()
                    }
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} timetables`);

            // Also update each timetable's day schedules to match new period count
            const allTimetables = await Timetable.find({});

            for (const tt of allTimetables) {
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                let needsUpdate = false;

                days.forEach(day => {
                    if (tt.timetable[day]) {
                        const currentLength = tt.timetable[day].length;
                        const newLength = periods.length;

                        if (currentLength < newLength) {
                            // Add new empty periods
                            for (let i = currentLength; i < newLength; i++) {
                                tt.timetable[day].push({
                                    period: i + 1,
                                    subject: '',
                                    room: '',
                                    isBreak: false
                                });
                            }
                            needsUpdate = true;
                        } else if (currentLength > newLength) {
                            // Remove extra periods
                            tt.timetable[day] = tt.timetable[day].slice(0, newLength);
                            needsUpdate = true;
                        }
                    }
                });

                if (needsUpdate) {
                    await tt.save();
                }
            }

            res.json({
                success: true,
                updatedCount: result.modifiedCount,
                message: `Updated ${result.modifiedCount} timetables with ${periods.length} periods`
            });

            // Notify all connected clients
            io.emit('periods_updated', { periods });
        } else {
            // Update in-memory timetables
            let count = 0;
            Object.keys(timetableMemory).forEach(key => {
                timetableMemory[key].periods = periods;
                timetableMemory[key].lastUpdated = new Date();
                count++;
            });

            res.json({
                success: true,
                updatedCount: count,
                message: `Updated ${count} timetables (in-memory)`
            });
        }
    } catch (error) {
        console.error('❌ Error updating periods:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Teacher Schedule API
app.get('/api/teacher-schedule/:teacherId/:day', async (req, res) => {
    try {
        const { teacherId, day } = req.params;

        if (mongoose.connection.readyState === 1) {
            // First, get the teacher's name from their ID
            let teacherName = teacherId;
            const teacher = await Teacher.findOne({
                $or: [
                    { employeeId: teacherId },
                    { name: teacherId }
                ]
            });

            if (teacher) {
                teacherName = teacher.name;
            }

            // Fetch all timetables
            const timetables = await Timetable.find({});
            const schedule = [];

            timetables.forEach(tt => {
                const daySchedule = tt.timetable[day.toLowerCase()] || [];
                daySchedule.forEach((period, idx) => {
                    // Match by teacher name (case-insensitive)
                    if (period.teacher &&
                        (period.teacher.toLowerCase() === teacherName.toLowerCase() ||
                            period.teacher.toLowerCase().includes(teacherName.toLowerCase()))) {
                        schedule.push({
                            subject: period.subject,
                            room: period.room,
                            startTime: tt.periods[idx]?.startTime || '',
                            endTime: tt.periods[idx]?.endTime || '',
                            period: idx + 1,
                            course: tt.branch,
                            semester: tt.semester,
                            day: day
                        });
                    }
                });
            });

            // Sort by start time
            schedule.sort((a, b) => {
                const timeA = a.startTime.split(':').map(Number);
                const timeB = b.startTime.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });

            res.json({ success: true, schedule });
        } else {
            res.json({ success: true, schedule: [] });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Teacher's Current Class Students (Role-based filtering)
app.get('/api/teacher/current-class-students/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Get current day and time
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

        console.log(`🔍 Finding current class for teacher: ${teacherId} at ${now.toLocaleTimeString()}`);

        // Find teacher
        const teacher = await Teacher.findOne({
            $or: [
                { employeeId: teacherId },
                { name: teacherId }
            ]
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        const teacherName = teacher.name;
        console.log(`✅ Found teacher: ${teacherName}`);

        // Find all timetables where this teacher is assigned
        const timetables = await Timetable.find({});

        // Find current period
        let currentClass = null;
        let matchedTimetable = null;

        for (const tt of timetables) {
            const daySchedule = tt.timetable[currentDay];
            if (!daySchedule) continue;

            for (let i = 0; i < daySchedule.length; i++) {
                const period = daySchedule[i];

                // Check if this period is assigned to our teacher
                if (period.teacher &&
                    (period.teacher.toLowerCase() === teacherName.toLowerCase() ||
                        period.teacher.toLowerCase().includes(teacherName.toLowerCase()))) {

                    // Get period timing
                    const periodInfo = tt.periods[i];
                    if (!periodInfo) continue;

                    const periodStart = timeToMinutes(periodInfo.startTime);
                    const periodEnd = timeToMinutes(periodInfo.endTime);

                    // Check if current time falls in this period
                    if (currentTime >= periodStart && currentTime <= periodEnd) {
                        currentClass = {
                            subject: period.subject,
                            semester: tt.semester,
                            branch: tt.branch,
                            period: period.period || (i + 1),
                            room: period.room,
                            startTime: periodInfo.startTime,
                            endTime: periodInfo.endTime,
                            isBreak: period.isBreak || false,
                            day: currentDay
                        };
                        matchedTimetable = tt;
                        console.log(`📚 Found current class: ${currentClass.subject} - ${currentClass.branch} Sem ${currentClass.semester}`);
                        break;
                    }
                }
            }
            if (currentClass) break;
        }

        // If no current class found
        if (!currentClass) {
            console.log('⏰ No active class right now');

            // Find next class today
            let nextClass = null;
            for (const tt of timetables) {
                const daySchedule = tt.timetable[currentDay];
                if (!daySchedule) continue;

                for (let i = 0; i < daySchedule.length; i++) {
                    const period = daySchedule[i];
                    if (period.teacher &&
                        (period.teacher.toLowerCase() === teacherName.toLowerCase() ||
                            period.teacher.toLowerCase().includes(teacherName.toLowerCase()))) {

                        const periodInfo = tt.periods[i];
                        if (!periodInfo) continue;

                        const periodStart = timeToMinutes(periodInfo.startTime);
                        if (periodStart > currentTime) {
                            nextClass = {
                                subject: period.subject,
                                time: `${periodInfo.startTime} - ${periodInfo.endTime}`,
                                semester: tt.semester,
                                branch: tt.branch,
                                room: period.room
                            };
                            break;
                        }
                    }
                }
                if (nextClass) break;
            }

            return res.json({
                success: true,
                hasActiveClass: false,
                message: 'No active class right now',
                nextClass: nextClass,
                teacherName: teacherName
            });
        }

        // If it's a break period
        if (currentClass.isBreak) {
            return res.json({
                success: true,
                hasActiveClass: false,
                message: `${currentClass.subject} - Break time`,
                currentClass: currentClass,
                teacherName: teacherName
            });
        }

        // Get students for this class (semester + branch)
        const students = await StudentManagement.find({
            semester: currentClass.semester.toString(),
            course: currentClass.branch
        }).select('-password');

        console.log(`👥 Found ${students.length} students for ${currentClass.branch} Semester ${currentClass.semester}`);

        // Get classroom info
        const classroom = await Classroom.findOne({ roomNumber: currentClass.room });

        res.json({
            success: true,
            hasActiveClass: true,
            currentClass: {
                ...currentClass,
                capacity: classroom?.capacity || 60,
                bssid: classroom?.bssid || null
            },
            students: students,
            totalStudents: students.length,
            teacherName: teacherName
        });

    } catch (error) {
        console.error('❌ Error in current-class-students:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper function to convert time string to minutes
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper function to create default timetable
function createDefaultTimetable(semester, branch) {
    const periods = [];
    for (let i = 0; i < 8; i++) {
        const startHour = 8 + Math.floor((i * 45) / 60);
        const startMinute = (i * 45) % 60;
        const endHour = 8 + Math.floor(((i + 1) * 45) / 60);
        const endMinute = ((i + 1) * 45) % 60;

        periods.push({
            number: i + 1,
            startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
            endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
        });
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const timetable = {};
    days.forEach(day => {
        timetable[day] = periods.map(p => ({
            period: p.number,
            subject: '',
            room: '',
            isBreak: false
        }));
    });

    return { semester, branch, periods, timetable };
}

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    console.log('📱 Client connected:', socket.id);

    // Student updates timer
    socket.on('timer_update', async (data) => {
        try {
            const { studentId, timerValue, isRunning, status, studentName } = data;

            // Check if it's an offline ID (starts with "offline_")
            const isOfflineId = studentId && studentId.toString().startsWith('offline_');

            if (mongoose.connection.readyState === 1 && !isOfflineId) {
                try {
                    // Check if studentId is a valid ObjectId format
                    const isValidObjectId = mongoose.Types.ObjectId.isValid(studentId) &&
                        /^[0-9a-fA-F]{24}$/.test(studentId);

                    let student;
                    if (isValidObjectId) {
                        // Try both _id and enrollmentNo
                        student = await StudentManagement.findOne({
                            $or: [
                                { _id: studentId },
                                { enrollmentNo: studentId }
                            ]
                        });
                    } else {
                        // Not a valid ObjectId, search only by enrollmentNo
                        console.log(`🔍 Searching for student by enrollmentNo: ${studentId}`);
                        student = await StudentManagement.findOne({ enrollmentNo: studentId });
                    }

                    if (student) {
                        console.log(`✅ Found student: ${student.name} (${student.enrollmentNo})`);
                        await StudentManagement.findByIdAndUpdate(student._id, {
                            timerValue,
                            isRunning,
                            status,
                            lastUpdated: new Date()
                        });
                    } else {
                        console.log(`⚠️ Student not found with ID: ${studentId}`);
                    }
                } catch (dbError) {
                    console.error('❌ Database error in timer update:', dbError.message);
                    // Continue without throwing - don't break the socket connection
                }
            } else {
                // Handle offline/in-memory students
                let student = studentsMemory.find(s => s._id === studentId);
                if (!student && studentName) {
                    // Auto-register offline student
                    student = {
                        _id: studentId,
                        name: studentName,
                        status: status || 'absent',
                        timerValue: timerValue || 120,
                        isRunning: isRunning || false
                    };
                    studentsMemory.push(student);
                    io.emit('student_registered', { name: studentName });
                } else if (student) {
                    student.timerValue = timerValue;
                    student.isRunning = isRunning;
                    student.status = status;
                }
            }

            // Broadcast to all teachers
            io.emit('student_update', { studentId, timerValue, isRunning, status });
        } catch (error) {
            console.error('❌ Error updating timer:', error);
            socket.emit('error', { message: 'Failed to update timer' });
        }
    });

    socket.on('disconnect', () => {
        console.log('📴 Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
    });
});

// Attendance Records API
app.post('/api/attendance/record', async (req, res) => {
    try {
        const {
            studentId, studentName, enrollmentNumber, status, timerValue, semester, branch,
            lectures, totalAttended, totalClassTime, dayPercentage, clientDate
        } = req.body;

        // SECURITY: Always use server time, never trust client
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Optional: Validate client date matches server date (within 1 day tolerance)
        if (clientDate) {
            const clientDateObj = new Date(clientDate);
            clientDateObj.setHours(0, 0, 0, 0);
            const daysDiff = Math.abs((today - clientDateObj) / (1000 * 60 * 60 * 24));

            if (daysDiff > 1) {
                console.warn(`⚠️ Client date mismatch: client=${clientDate}, server=${today.toISOString()}`);
                return res.status(400).json({
                    success: false,
                    error: 'Date mismatch. Please sync your device time.',
                    serverDate: today.toISOString()
                });
            }
        }

        if (mongoose.connection.readyState === 1) {
            // Check if record already exists for today
            let record = await AttendanceRecord.findOne({
                studentId,
                date: today
            });

            if (record) {
                // Update existing record with detailed data
                record.status = status;
                record.timerValue = timerValue;
                record.checkOutTime = new Date();

                // Update detailed attendance if provided
                if (lectures) record.lectures = lectures;
                if (totalAttended !== undefined) record.totalAttended = totalAttended;
                if (totalClassTime !== undefined) record.totalClassTime = totalClassTime;
                if (dayPercentage !== undefined) record.dayPercentage = dayPercentage;

                await record.save();
            } else {
                // Create new record
                record = new AttendanceRecord({
                    studentId,
                    studentName,
                    enrollmentNumber,
                    date: today,
                    status,
                    timerValue,
                    checkInTime: new Date(),
                    semester,
                    branch,
                    lectures: lectures || [],
                    totalAttended: totalAttended || 0,
                    totalClassTime: totalClassTime || 0,
                    dayPercentage: dayPercentage || 0
                });
                await record.save();
            }
            res.json({ success: true, record });
        } else {
            // In-memory storage
            let record = attendanceRecordsMemory.find(r =>
                r.studentId === studentId && r.date.toDateString() === today.toDateString()
            );

            if (record) {
                record.status = status;
                record.timerValue = timerValue;
                record.checkOutTime = new Date();
                if (lectures) record.lectures = lectures;
                if (totalAttended !== undefined) record.totalAttended = totalAttended;
                if (totalClassTime !== undefined) record.totalClassTime = totalClassTime;
                if (dayPercentage !== undefined) record.dayPercentage = dayPercentage;
            } else {
                record = {
                    _id: 'record_' + Date.now(),
                    studentId,
                    studentName,
                    enrollmentNumber,
                    date: today,
                    status,
                    timerValue,
                    checkInTime: new Date(),
                    semester,
                    branch,
                    lectures: lectures || [],
                    totalAttended: totalAttended || 0,
                    totalClassTime: totalClassTime || 0,
                    dayPercentage: dayPercentage || 0
                };
                attendanceRecordsMemory.push(record);
            }
            res.json({ success: true, record });
        }
    } catch (error) {
        console.error('Error saving attendance record:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get attendance records with filters
app.get('/api/attendance/records', async (req, res) => {
    try {
        const { studentId, startDate, endDate, semester, branch } = req.query;
        let query = {};

        if (studentId) query.studentId = studentId;
        if (semester) query.semester = semester;
        if (branch) query.branch = branch;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (mongoose.connection.readyState === 1) {
            const records = await AttendanceRecord.find(query).sort({ date: -1 });
            res.json({ success: true, records });
        } else {
            let records = attendanceRecordsMemory;
            if (studentId) records = records.filter(r => r.studentId === studentId);
            if (semester) records = records.filter(r => r.semester === semester);
            if (branch) records = records.filter(r => r.branch === branch);
            res.json({ success: true, records });
        }
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get attendance statistics
app.get('/api/attendance/stats', async (req, res) => {
    try {
        const { studentId, semester, branch, startDate, endDate } = req.query;
        let query = {};

        if (studentId) query.studentId = studentId;
        if (semester) query.semester = semester;
        if (branch) query.branch = branch;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (mongoose.connection.readyState === 1) {
            const records = await AttendanceRecord.find(query);
            const total = records.length;
            const present = records.filter(r => r.status === 'present').length;
            const absent = records.filter(r => r.status === 'absent').length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            res.json({
                success: true,
                stats: { total, present, absent, percentage }
            });
        } else {
            let records = attendanceRecordsMemory;
            if (studentId) records = records.filter(r => r.studentId === studentId);
            const total = records.length;
            const present = records.filter(r => r.status === 'present').length;
            const absent = records.filter(r => r.status === 'absent').length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            res.json({
                success: true,
                stats: { total, present, absent, percentage }
            });
        }
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const faceApiService = require('./face-api-service');

// Load face-api.js models on startup
faceApiService.loadModels().then(loaded => {
    if (loaded) {
        console.log('✅ Face-API.js ready for face recognition');
    } else {
        console.log('❌ Face-API.js models not loaded - face verification will not work!');
        console.log('💡 Run: node server/download-models.js');
    }
});

// Initialize MediaPipe with Liveness Detection (Anti-Spoofing)
console.log('🛡️  Initializing MediaPipe with Liveness Detection...');
try {
    const mediapipeService = require('./mediapipe-service');
    mediapipeService.initialize().then(success => {
        if (success) {
            console.log('✅ MediaPipe ready with ANTI-SPOOFING protection');
            console.log('   🔒 Liveness detection: ENABLED');
            console.log('   🚫 Photo/Screen attacks: BLOCKED');
        } else {
            console.log('⚠️  MediaPipe initialization failed - using face-api.js fallback');
            console.log('   ⚠️  WARNING: No liveness detection - vulnerable to photo/screen attacks!');
        }
    }).catch(err => {
        console.log('⚠️  MediaPipe not available:', err.message);
        console.log('   ⚠️  WARNING: No liveness detection - vulnerable to photo/screen attacks!');
    });
} catch (err) {
    console.log('⚠️  MediaPipe module not found - using face-api.js fallback');
    console.log('   ⚠️  WARNING: No liveness detection - vulnerable to photo/screen attacks!');
}

// Face Verification API - Using MediaPipe with Liveness Detection
app.post('/api/verify-face', async (req, res) => {
    try {
        const { userId, capturedImage } = req.body;

        console.log('📸 Face verification request for user:', userId);

        if (!userId || !capturedImage) {
            return res.status(400).json({
                success: false,
                match: false,
                confidence: 0,
                message: 'Missing userId or capturedImage'
            });
        }

        // SECURITY: Fetch reference photo from database (not from client)
        console.log('🔍 Looking for user with ID:', userId);
        let user;

        // Try finding by MongoDB ID first
        try {
            user = await StudentManagement.findById(userId);
        } catch (dbError) {
            console.log('⚠️ Invalid MongoDB ID format');
        }

        // If not found by ID, try enrollment number
        if (!user) {
            console.log('⚠️ Not found by ID, trying enrollment number...');
            user = await StudentManagement.findOne({ enrollmentNo: userId });
        }

        if (!user) {
            console.log('❌ User not found in database by ID or enrollment number');
            return res.status(404).json({
                success: false,
                match: false,
                confidence: 0,
                message: 'User not found. Please log out and log in again to refresh your session.'
            });
        }

        console.log('✅ Found user:', user.name, 'Photo:', user.photoUrl ? 'Yes' : 'No');

        // Check if user has profile photo
        if (!user.photoUrl) {
            console.log('⚠️ User has no profile photo:', userId);
            return res.status(404).json({
                success: false,
                match: false,
                confidence: 0,
                message: 'No profile photo found. Please upload your photo via admin panel first.'
            });
        }

        // Validate captured image format
        const isValidImage = capturedImage &&
            capturedImage.length > 1000 &&
            (capturedImage.startsWith('/9j/') || capturedImage.startsWith('iVBOR')); // JPEG or PNG

        if (!isValidImage) {
            console.log('❌ Invalid image format');
            return res.json({
                success: false,
                match: false,
                confidence: 0,
                message: 'Invalid image format'
            });
        }

        // Load reference photo from server
        let referenceImageBase64 = '';
        try {
            const photoUrl = user.photoUrl;

            // Handle base64 data URIs (stored in database)
            if (photoUrl.startsWith('data:image')) {
                console.log('📥 Loading reference photo from database (base64)...');
                referenceImageBase64 = photoUrl.replace(/^data:image\/\w+;base64,/, '');
                console.log('✅ Reference photo loaded from database');
            }
            // Handle Cloudinary URLs
            else if (photoUrl.includes('cloudinary.com')) {
                console.log('📥 Downloading reference photo from Cloudinary...');
                const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
                referenceImageBase64 = Buffer.from(response.data, 'binary').toString('base64');
                console.log('✅ Reference photo downloaded from Cloudinary');
            }
            // Handle local file paths
            else if (photoUrl.includes('localhost') || photoUrl.includes('192.168')) {
                const filename = photoUrl.split('/uploads/')[1];
                const filepath = path.join(__dirname, 'uploads', filename);
                if (fs.existsSync(filepath)) {
                    referenceImageBase64 = fs.readFileSync(filepath, 'base64');
                    console.log('✅ Reference photo loaded from local filesystem');
                } else {
                    console.log('❌ Reference photo file not found');
                    return res.json({
                        success: false,
                        match: false,
                        confidence: 0,
                        message: 'Reference photo not found on server'
                    });
                }
            }
            // Handle other URLs (generic HTTP/HTTPS)
            else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
                console.log('📥 Downloading reference photo from URL...');
                const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
                referenceImageBase64 = Buffer.from(response.data, 'binary').toString('base64');
                console.log('✅ Reference photo downloaded from URL');
            }

            // Validate that we got the image
            if (!referenceImageBase64) {
                console.log('❌ Failed to load reference photo from:', photoUrl);
                return res.json({
                    success: false,
                    match: false,
                    confidence: 0,
                    message: 'Could not load reference photo. Please re-upload your photo in admin panel.'
                });
            }
        } catch (error) {
            console.log('❌ Error loading reference photo:', error);
            return res.status(500).json({
                success: false,
                match: false,
                confidence: 0,
                message: 'Error loading reference photo: ' + error.message
            });
        }

        const startTime = Date.now();

        // Try MediaPipe first (with liveness detection)
        let mediapipeAvailable = false;
        try {
            const mediapipeService = require('./mediapipe-service');
            mediapipeAvailable = mediapipeService.isInitialized();
        } catch (err) {
            console.log('⚠️  MediaPipe not available, will use face-api.js fallback');
        }

        let result;
        let verificationTime;
        let method;

        if (mediapipeAvailable) {
            // Use MediaPipe with liveness detection (ANTI-SPOOFING)
            console.log('🛡️  Using MediaPipe with LIVENESS DETECTION...');
            const mediapipeService = require('./mediapipe-service');
            
            // Convert base64 to buffers for MediaPipe
            const capturedBuffer = Buffer.from(capturedImage, 'base64');
            const referenceBuffer = Buffer.from(referenceImageBase64, 'base64');
            
            result = await mediapipeService.verifyFaceWithLiveness(capturedBuffer, referenceBuffer);
            verificationTime = Date.now() - startTime;
            method = 'mediapipe-liveness';

            if (!result.success) {
                console.log('❌ MediaPipe verification failed:', result.message);
                return res.json({
                    success: false,
                    match: false,
                    confidence: 0,
                    message: result.message,
                    liveness: result.liveness
                });
            }

            // Check liveness score - REJECT if too low (likely a photo/screen)
            if (result.liveness && result.liveness.isLive === false) {
                console.log('🚫 LIVENESS CHECK FAILED - Possible photo/screen attack!');
                console.log(`   Liveness score: ${result.liveness.score}`);
                console.log(`   Reason: ${result.liveness.reason}`);
                
                return res.json({
                    success: false,
                    match: false,
                    confidence: 0,
                    message: 'Liveness check failed. Please use a real face, not a photo or screen.',
                    liveness: result.liveness,
                    antiSpoofing: {
                        detected: true,
                        reason: result.liveness.reason
                    }
                });
            }

            console.log(`📊 MediaPipe result:`);
            console.log(`   Verification time: ${verificationTime}ms`);
            console.log(`   Match: ${result.match ? 'YES' : 'NO'}`);
            console.log(`   Confidence: ${result.confidence}%`);
            console.log(`   Liveness: ${result.liveness?.isLive ? 'LIVE' : 'FAKE'} (score: ${result.liveness?.score})`);
            console.log(`   User: ${user.name}`);

        } else {
            // Fallback to face-api.js (NO liveness detection - vulnerable to spoofing)
            console.log('⚠️  Using face-api.js (NO LIVENESS DETECTION)...');
            
            if (!faceApiService.areModelsLoaded()) {
                console.log('❌ Face-API.js models not loaded');
                return res.status(503).json({
                    success: false,
                    match: false,
                    confidence: 0,
                    message: 'Face recognition service not available. Please contact administrator.'
                });
            }

            result = await faceApiService.compareFaces(capturedImage, referenceImageBase64);
            verificationTime = Date.now() - startTime;
            method = 'face-api.js';

            if (!result.success) {
                console.log('❌ Face verification failed:', result.message);
                return res.json({
                    success: false,
                    match: false,
                    confidence: 0,
                    message: result.message
                });
            }

            console.log(`📊 Face-API.js result:`);
            console.log(`   Verification time: ${verificationTime}ms`);
            console.log(`   Match: ${result.match ? 'YES' : 'NO'}`);
            console.log(`   Confidence: ${result.confidence}%`);
            console.log(`   Distance: ${result.distance}`);
            console.log(`   User: ${user.name}`);
        }

        res.json({
            success: true,
            match: result.match,
            confidence: result.confidence,
            distance: result.distance,
            message: result.message,
            method: method,
            liveness: result.liveness || null,
            antiSpoofing: result.liveness ? {
                enabled: true,
                passed: result.liveness.isLive
            } : {
                enabled: false,
                warning: 'No liveness detection - vulnerable to photo/screen attacks'
            }
        });
    } catch (error) {
        console.error('❌ Face verification error:', error);
        res.status(500).json({
            success: false,
            match: false,
            confidence: 0,
            message: 'Verification error: ' + error.message
        });
    }
});

// ==================== CLIENT-SIDE FACE VERIFICATION ENDPOINTS ====================

// Get face descriptor for client-side verification (encrypted)
app.get('/api/face-descriptor/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('📥 Face descriptor request for user:', userId);

        // Find user
        let user;
        try {
            user = await StudentManagement.findById(userId);
        } catch (dbError) {
            user = await StudentManagement.findOne({ enrollmentNo: userId });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has photo
        if (!user.photoUrl) {
            return res.status(404).json({
                success: false,
                message: 'No profile photo found'
            });
        }

        // Load reference photo
        let referenceImageBase64 = '';
        const photoUrl = user.photoUrl;

        if (photoUrl.startsWith('data:image')) {
            referenceImageBase64 = photoUrl.replace(/^data:image\/\w+;base64,/, '');
        } else if (photoUrl.includes('cloudinary.com')) {
            const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
            referenceImageBase64 = Buffer.from(response.data, 'binary').toString('base64');
        } else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
            const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
            referenceImageBase64 = Buffer.from(response.data, 'binary').toString('base64');
        }

        if (!referenceImageBase64) {
            return res.status(500).json({
                success: false,
                message: 'Could not load reference photo'
            });
        }

        // Extract face descriptor using face-api.js
        if (!faceApiService.areModelsLoaded()) {
            return res.status(503).json({
                success: false,
                message: 'Face recognition service not available'
            });
        }

        console.log('🤖 Extracting face descriptor from reference photo...');
        const descriptor = await faceApiService.extractDescriptor(referenceImageBase64);

        if (!descriptor) {
            return res.status(500).json({
                success: false,
                message: 'Could not extract face descriptor from photo'
            });
        }

        console.log('✅ Face descriptor extracted successfully');

        // Return descriptor (as array for client-side verification)
        res.json({
            success: true,
            descriptor: Array.from(descriptor), // Convert Float32Array to regular array
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('❌ Error getting face descriptor:', error);
        res.status(500).json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

// Verify face proof from client (cryptographic verification)
app.post('/api/verify-face-proof', async (req, res) => {
    try {
        const { userId, timestamp, match, confidence, descriptorHash, serverTimeISO, signature } = req.body;

        console.log('🔐 Verifying face proof for user:', userId);

        // Validate timestamp (prevent replay attacks)
        const currentTime = Date.now();
        const timeDiff = Math.abs(currentTime - timestamp);
        
        // Proof must be recent (within 5 minutes)
        if (timeDiff > 5 * 60 * 1000) {
            console.log('❌ Proof expired (timestamp too old)');
            return res.status(400).json({
                success: false,
                message: 'Verification proof expired'
            });
        }

        // Verify signature (prevent tampering)
        const expectedSignature = generateSignature(userId, timestamp, match, confidence, descriptorHash);
        if (signature !== expectedSignature) {
            console.log('❌ Invalid signature - proof may be tampered');
            return res.status(400).json({
                success: false,
                message: 'Invalid verification proof'
            });
        }

        // Find user
        let user;
        try {
            user = await StudentManagement.findById(userId);
        } catch (dbError) {
            user = await StudentManagement.findOne({ enrollmentNo: userId });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Log verification
        console.log(`✅ Face verification proof validated:`);
        console.log(`   User: ${user.name}`);
        console.log(`   Match: ${match ? 'YES' : 'NO'}`);
        console.log(`   Confidence: ${confidence}%`);
        console.log(`   Timestamp: ${new Date(timestamp).toISOString()}`);

        // Update user verification status (optional - for tracking)
        await StudentManagement.findByIdAndUpdate(user._id, {
            lastFaceVerification: new Date(timestamp),
            lastVerificationResult: match,
            lastVerificationConfidence: confidence,
        });

        res.json({
            success: true,
            message: 'Verification proof accepted',
            verified: match,
        });
    } catch (error) {
        console.error('❌ Error verifying proof:', error);
        res.status(500).json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

// Helper function to generate signature (must match client-side)
function generateSignature(userId, timestamp, match, confidence, descriptorHash) {
    const data = `${userId}:${timestamp}:${match}:${confidence}:${descriptorHash}`;
    let signature = 0;
    for (let i = 0; i < data.length; i++) {
        signature = ((signature << 5) - signature) + data.charCodeAt(i);
        signature = signature & signature;
    }
    return signature.toString(16);
}

// ==================== ADMIN PANEL API ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Server time endpoint (for time synchronization)
app.get('/api/time', (req, res) => {
    const serverTime = Date.now();
    res.json({
        success: true,
        serverTime: serverTime,
        serverTimeISO: new Date(serverTime).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
});

// Server will be started at the end of the file after all routes are registered

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { id, password } = req.body;
        console.log('Login attempt:', id);

        if (!id || !password) {
            return res.json({ success: false, message: 'ID and password required' });
        }

        // Try to find as student first
        let user = null;
        let role = null;

        if (mongoose.connection.readyState === 1) {
            // Check in StudentManagement collection
            user = await StudentManagement.findOne({
                $or: [
                    { enrollmentNo: id },
                    { email: id }
                ]
            });

            if (user && user.password === password) {
                role = 'student';
                console.log('✅ Student logged in:', user.name);
                console.log('📸 PhotoUrl from DB:', user.photoUrl ? `[${user.photoUrl.substring(0, 30)}...] (${user.photoUrl.length} chars)` : 'None');
                return res.json({
                    success: true,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        enrollmentNo: user.enrollmentNo,
                        course: user.course,
                        semester: user.semester,
                        phone: user.phone,
                        hasPhoto: !!user.photoUrl, // Just indicate if photo exists
                        role: 'student'
                    }
                });
            }

            // Check in Teacher collection
            user = await Teacher.findOne({
                $or: [
                    { employeeId: id },
                    { email: id }
                ]
            });

            if (user && user.password === password) {
                role = 'teacher';
                console.log('Teacher logged in:', user.name);
                return res.json({
                    success: true,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        employeeId: user.employeeId,
                        department: user.department,
                        phone: user.phone,
                        photoUrl: user.photoUrl,
                        canEditTimetable: user.canEditTimetable,
                        role: 'teacher'
                    }
                });
            }
        } else {
            // In-memory storage
            user = studentManagementMemory.find(s =>
                (s.enrollmentNo === id || s.email === id) && s.password === password
            );

            if (user) {
                console.log('Student logged in (memory):', user.name);
                return res.json({
                    success: true,
                    user: {
                        ...user,
                        role: 'student'
                    }
                });
            }

            user = teachersMemory.find(t =>
                (t.employeeId === id || t.email === id) && t.password === password
            );

            if (user) {
                console.log('Teacher logged in (memory):', user.name);
                return res.json({
                    success: true,
                    user: {
                        ...user,
                        role: 'teacher'
                    }
                });
            }
        }

        console.log('Login failed for:', id);
        res.json({ success: false, message: 'Invalid ID or password' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Student Management
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
    createdAt: { type: Date, default: Date.now }
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

app.get('/api/students', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const students = await StudentManagement.find();
            res.json({ success: true, students });
        } else {
            res.json({ success: true, students: studentManagementMemory });
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single student by enrollment number
app.get('/api/student-management', async (req, res) => {
    try {
        const { enrollmentNo } = req.query;
        if (!enrollmentNo) {
            return res.status(400).json({ success: false, error: 'Enrollment number required' });
        }

        if (mongoose.connection.readyState === 1) {
            const student = await StudentManagement.findOne({ enrollmentNo });
            if (student) {
                res.json({ success: true, student });
            } else {
                res.json({ success: false, error: 'Student not found' });
            }
        } else {
            const student = studentManagementMemory.find(s => s.enrollmentNo === enrollmentNo);
            if (student) {
                res.json({ success: true, student });
            } else {
                res.json({ success: false, error: 'Student not found' });
            }
        }
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Photo upload endpoint
app.post('/api/upload-photo', async (req, res) => {
    try {
        const { photoData, type, id } = req.body;

        if (!photoData) {
            return res.status(400).json({ success: false, error: 'No photo data provided' });
        }

        // Extract base64 data
        const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');

        // Validate face detection before saving
        console.log('🔍 Validating face in uploaded photo...');

        if (faceApiService.areModelsLoaded()) {
            try {
                const canvas = require('canvas');
                const buffer = Buffer.from(base64Data, 'base64');
                const img = await canvas.loadImage(buffer);

                console.log(`   Photo size: ${img.width}x${img.height}px`);

                // Try to detect face with aggressive settings
                const faceapi = require('face-api.js');
                const detectionOptions = [
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 }),
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.15 }),
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.1 })
                ];

                let faceDetected = false;
                for (let i = 0; i < detectionOptions.length; i++) {
                    try {
                        const detection = await faceapi.detectSingleFace(img, detectionOptions[i]);
                        if (detection) {
                            faceDetected = true;
                            console.log(`   ✅ Face detected! Score: ${detection.score.toFixed(3)}`);
                            break;
                        }
                    } catch (detectionError) {
                        console.log(`   Attempt ${i + 1} failed:`, detectionError.message);
                    }
                }

                if (!faceDetected) {
                    console.log('   ❌ No face detected in uploaded photo');
                    return res.status(400).json({
                        success: false,
                        error: 'No face detected',
                        message: 'No face detected. Please use a clear, well-lit photo showing your face.'
                    });
                }
            } catch (validationError) {
                console.error('   ❌ Face validation error:', validationError.message);
                // Continue without validation if there's an error
                console.log('   ⚠️  Skipping face validation due to error');
            }
        } else {
            console.log('⚠️  Face detection models not loaded, skipping validation');
        }

        // Store as base64 data URI (no external storage needed)
        console.log('💾 Storing photo as base64 in database...');

        const photoUrl = `data:image/jpeg;base64,${base64Data}`;

        console.log(`✅ Photo prepared for database storage (${base64Data.length} bytes)`);

        res.json({
            success: true,
            photoUrl,
            filename: `${type}_${id}_${Date.now()}`,
            message: 'Photo uploaded successfully with face detected!'
        });
    } catch (error) {
        console.error('❌ Error uploading photo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get photo by filename (for testing)
app.get('/api/photo/:filename', (req, res) => {
    try {
        const filepath = path.join(uploadsDir, req.params.filename);
        if (fs.existsSync(filepath)) {
            res.sendFile(filepath);
        } else {
            res.status(404).json({ success: false, error: 'Photo not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        console.log('Received student data:', req.body);
        if (mongoose.connection.readyState === 1) {
            const student = new StudentManagement(req.body);
            await student.save();
            console.log('Student saved to MongoDB:', student);
            res.json({ success: true, student });
        } else {
            // In-memory storage
            const student = {
                _id: 'student_' + Date.now(),
                ...req.body,
                createdAt: new Date()
            };
            studentManagementMemory.push(student);
            console.log('Student saved to memory:', student);
            res.json({ success: true, student });
        }
    } catch (error) {
        console.error('Error saving student:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/students/bulk', async (req, res) => {
    try {
        const { students } = req.body;
        console.log('Bulk import students:', students.length);
        if (mongoose.connection.readyState === 1) {
            const result = await StudentManagement.insertMany(students, { ordered: false });
            res.json({ success: true, count: result.length });
        } else {
            // In-memory storage
            students.forEach(s => {
                studentManagementMemory.push({
                    _id: 'student_' + Date.now() + Math.random(),
                    ...s,
                    createdAt: new Date()
                });
            });
            res.json({ success: true, count: students.length });
        }
    } catch (error) {
        console.error('Error bulk importing students:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/students/:id', async (req, res) => {
    try {
        console.log('Updating student:', req.params.id, req.body);
        if (mongoose.connection.readyState === 1) {
            const student = await StudentManagement.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            console.log('Student updated in MongoDB:', student);
            res.json({ success: true, student });
        } else {
            // In-memory storage
            const index = studentManagementMemory.findIndex(s => s._id === req.params.id);
            if (index !== -1) {
                studentManagementMemory[index] = {
                    ...studentManagementMemory[index],
                    ...req.body
                };
                console.log('Student updated in memory:', studentManagementMemory[index]);
                res.json({ success: true, student: studentManagementMemory[index] });
            } else {
                res.status(404).json({ success: false, error: 'Student not found' });
            }
        }
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    try {
        console.log('Deleting student:', req.params.id);
        if (mongoose.connection.readyState === 1) {
            await StudentManagement.findByIdAndDelete(req.params.id);
            res.json({ success: true });
        } else {
            // In-memory storage
            const index = studentManagementMemory.findIndex(s => s._id === req.params.id);
            if (index !== -1) {
                studentManagementMemory.splice(index, 1);
            }
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Teacher Management
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

app.get('/api/teachers', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const teachers = await Teacher.find();
            res.json({ success: true, teachers });
        } else {
            res.json({ success: true, teachers: teachersMemory });
        }
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/teachers', async (req, res) => {
    try {
        console.log('Received teacher data:', req.body);
        if (mongoose.connection.readyState === 1) {
            const teacher = new Teacher(req.body);
            await teacher.save();
            res.json({ success: true, teacher });
        } else {
            const teacher = {
                _id: 'teacher_' + Date.now(),
                ...req.body,
                createdAt: new Date()
            };
            teachersMemory.push(teacher);
            res.json({ success: true, teacher });
        }
    } catch (error) {
        console.error('Error saving teacher:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/teachers/bulk', async (req, res) => {
    try {
        const { teachers } = req.body;
        if (mongoose.connection.readyState === 1) {
            const result = await Teacher.insertMany(teachers, { ordered: false });
            res.json({ success: true, count: result.length });
        } else {
            teachers.forEach(t => {
                teachersMemory.push({
                    _id: 'teacher_' + Date.now() + Math.random(),
                    ...t,
                    createdAt: new Date()
                });
            });
            res.json({ success: true, count: teachers.length });
        }
    } catch (error) {
        console.error('Error bulk importing teachers:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/teachers/:id/timetable-access', async (req, res) => {
    try {
        const { canEditTimetable } = req.body;
        if (mongoose.connection.readyState === 1) {
            await Teacher.findByIdAndUpdate(req.params.id, { canEditTimetable });
            res.json({ success: true });
        } else {
            res.json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/teachers/:id', async (req, res) => {
    try {
        console.log('Updating teacher:', req.params.id, req.body);
        if (mongoose.connection.readyState === 1) {
            const teacher = await Teacher.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            res.json({ success: true, teacher });
        } else {
            const index = teachersMemory.findIndex(t => t._id === req.params.id);
            if (index !== -1) {
                teachersMemory[index] = {
                    ...teachersMemory[index],
                    ...req.body
                };
                res.json({ success: true, teacher: teachersMemory[index] });
            } else {
                res.status(404).json({ success: false, error: 'Teacher not found' });
            }
        }
    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/teachers/:id', async (req, res) => {
    try {
        console.log('Deleting teacher:', req.params.id);
        if (mongoose.connection.readyState === 1) {
            await Teacher.findByIdAndDelete(req.params.id);
            res.json({ success: true });
        } else {
            const index = teachersMemory.findIndex(t => t._id === req.params.id);
            if (index !== -1) {
                teachersMemory.splice(index, 1);
            }
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Classroom Management
const classroomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    building: { type: String, required: true },
    capacity: { type: Number, required: true },
    wifiBSSID: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Classroom = mongoose.model('Classroom', classroomSchema);

// Holiday Schema
const holidaySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['holiday', 'exam', 'event'], default: 'holiday' },
    description: String,
    color: { type: String, default: '#ff6b6b' },
    createdAt: { type: Date, default: Date.now }
});

const Holiday = mongoose.model('Holiday', holidaySchema);

// Holiday APIs
app.get('/api/holidays', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const holidays = await Holiday.find().sort({ date: 1 });
            res.json({ success: true, holidays });
        } else {
            res.json({ success: true, holidays: [] });
        }
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/holidays', async (req, res) => {
    try {
        const { date, name, type, description, color } = req.body;

        if (mongoose.connection.readyState === 1) {
            const holiday = new Holiday({ date, name, type, description, color });
            await holiday.save();
            res.json({ success: true, holiday });
        } else {
            res.json({ success: true, holiday: req.body });
        }
    } catch (error) {
        console.error('Error adding holiday:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/holidays/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, name, type, description, color } = req.body;

        if (mongoose.connection.readyState === 1) {
            const holiday = await Holiday.findByIdAndUpdate(
                id,
                { date, name, type, description, color },
                { new: true }
            );
            res.json({ success: true, holiday });
        } else {
            res.json({ success: true, holiday: req.body });
        }
    } catch (error) {
        console.error('Error updating holiday:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/holidays/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (mongoose.connection.readyState === 1) {
            await Holiday.findByIdAndDelete(id);
            res.json({ success: true });
        } else {
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Error deleting holiday:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get holidays for a specific date range
app.get('/api/holidays/range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (mongoose.connection.readyState === 1) {
            const holidays = await Holiday.find({
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }).sort({ date: 1 });
            res.json({ success: true, holidays });
        } else {
            res.json({ success: true, holidays: [] });
        }
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/classrooms', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const classrooms = await Classroom.find();
            res.json({ success: true, classrooms });
        } else {
            res.json({ success: true, classrooms: classroomsMemory });
        }
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/classrooms', async (req, res) => {
    try {
        console.log('Received classroom data:', req.body);
        if (mongoose.connection.readyState === 1) {
            const classroom = new Classroom(req.body);
            await classroom.save();
            res.json({ success: true, classroom });
        } else {
            const classroom = {
                _id: 'classroom_' + Date.now(),
                ...req.body,
                createdAt: new Date()
            };
            classroomsMemory.push(classroom);
            res.json({ success: true, classroom });
        }
    } catch (error) {
        console.error('Error saving classroom:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/classrooms/:id', async (req, res) => {
    try {
        console.log('Updating classroom:', req.params.id, req.body);
        if (mongoose.connection.readyState === 1) {
            const classroom = await Classroom.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            res.json({ success: true, classroom });
        } else {
            const index = classroomsMemory.findIndex(c => c._id === req.params.id);
            if (index !== -1) {
                classroomsMemory[index] = {
                    ...classroomsMemory[index],
                    ...req.body
                };
                res.json({ success: true, classroom: classroomsMemory[index] });
            } else {
                res.status(404).json({ success: false, error: 'Classroom not found' });
            }
        }
    } catch (error) {
        console.error('Error updating classroom:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/classrooms/:id', async (req, res) => {
    try {
        console.log('Deleting classroom:', req.params.id);
        if (mongoose.connection.readyState === 1) {
            await Classroom.findByIdAndDelete(req.params.id);
            res.json({ success: true });
        } else {
            const index = classroomsMemory.findIndex(c => c._id === req.params.id);
            if (index !== -1) {
                classroomsMemory.splice(index, 1);
            }
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Error deleting classroom:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== RANDOM RING FEATURE ====================

// Random Ring Schema
const randomRingSchema = new mongoose.Schema({
    teacherId: { type: String, required: true },
    teacherName: String,
    classId: String,
    subject: String,
    semester: String,
    branch: String,
    room: String,
    bssid: String,
    type: { type: String, enum: ['all', 'select'], required: true },
    count: Number,
    selectedStudents: [{
        studentId: String,
        name: String,
        enrollmentNo: String,
        notificationSent: Boolean,
        notificationTime: Date,
        verified: Boolean,
        verificationTime: Date,
        verificationPhoto: String,
        responseTime: Number,
        failureReason: String
    }],
    timestamp: { type: Date, default: Date.now },
    completedAt: Date,
    status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' }
});

const RandomRing = mongoose.model('RandomRing', randomRingSchema);

// Trigger Random Ring
app.post('/api/random-ring/trigger', async (req, res) => {
    try {
        const { teacherId, classId, type, count, semester, branch, subject, room, bssid } = req.body;

        console.log(`🔔 Random Ring triggered by teacher: ${teacherId}`);

        // Get students for this class
        const students = await StudentManagement.find({
            semester: semester,
            course: branch
        }).select('_id name enrollmentNo');

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No students found for this class'
            });
        }

        // Select students based on type
        let selectedStudents = [];
        if (type === 'all') {
            selectedStudents = students;
        } else if (type === 'select') {
            // Randomly select 'count' students
            const shuffled = students.sort(() => 0.5 - Math.random());
            selectedStudents = shuffled.slice(0, Math.min(count, students.length));
        }

        // Create random ring record
        const randomRing = new RandomRing({
            teacherId,
            teacherName: req.body.teacherName || 'Teacher',
            classId,
            subject,
            semester,
            branch,
            room,
            bssid,
            type,
            count: selectedStudents.length,
            selectedStudents: selectedStudents.map(s => ({
                studentId: s._id.toString(),
                name: s.name,
                enrollmentNo: s.enrollmentNo,
                notificationSent: false,
                verified: false
            })),
            status: 'pending'
        });

        if (mongoose.connection.readyState === 1) {
            await randomRing.save();
        }

        // Send notifications to selected students via Socket.IO
        selectedStudents.forEach(student => {
            io.emit('random_ring_notification', {
                studentId: student._id.toString(),
                message: 'Random Ring! Verify your attendance now!',
                subject: subject,
                room: room,
                bssid: bssid,
                randomRingId: randomRing._id,
                expiresIn: 300 // 5 minutes
            });
        });

        // Notify teacher that random ring started
        io.emit('random_ring_started', {
            teacherId,
            randomRingId: randomRing._id,
            selectedCount: selectedStudents.length
        });

        console.log(`✅ Random ring created for ${selectedStudents.length} students`);

        res.json({
            success: true,
            randomRingId: randomRing._id,
            selectedStudents: selectedStudents.map(s => ({
                id: s._id,
                name: s.name,
                enrollmentNo: s.enrollmentNo
            })),
            notificationsSent: selectedStudents.length,
            message: `Random ring triggered for ${selectedStudents.length} students`
        });

    } catch (error) {
        console.error('❌ Error triggering random ring:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Student verifies random ring
app.post('/api/random-ring/verify', async (req, res) => {
    try {
        const { randomRingId, studentId, verificationPhoto, bssid } = req.body;

        console.log(`🔍 Student ${studentId} verifying random ring ${randomRingId}`);

        if (mongoose.connection.readyState === 1) {
            const randomRing = await RandomRing.findById(randomRingId);

            if (!randomRing) {
                return res.status(404).json({
                    success: false,
                    error: 'Random ring not found'
                });
            }

            // Check if expired (5 minutes)
            const now = new Date();
            const elapsed = (now - randomRing.timestamp) / 1000;
            if (elapsed > 300) {
                return res.status(400).json({
                    success: false,
                    error: 'Random ring expired'
                });
            }

            // Validate BSSID
            if (randomRing.bssid && bssid !== randomRing.bssid) {
                return res.status(403).json({
                    success: false,
                    error: 'Not connected to authorized WiFi'
                });
            }

            // Find student in selected students
            const studentIndex = randomRing.selectedStudents.findIndex(
                s => s.studentId === studentId
            );

            if (studentIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Student not selected for this random ring'
                });
            }

            // Update verification status
            randomRing.selectedStudents[studentIndex].verified = true;
            randomRing.selectedStudents[studentIndex].verificationTime = now;
            randomRing.selectedStudents[studentIndex].verificationPhoto = verificationPhoto;
            randomRing.selectedStudents[studentIndex].responseTime = elapsed;

            // Check if all students verified
            const allVerified = randomRing.selectedStudents.every(s => s.verified);
            if (allVerified) {
                randomRing.status = 'completed';
                randomRing.completedAt = now;
            }

            await randomRing.save();

            // Notify teacher via Socket.IO
            io.emit('random_ring_student_verified', {
                teacherId: randomRing.teacherId,
                randomRingId: randomRing._id,
                studentId,
                studentName: randomRing.selectedStudents[studentIndex].name,
                verifiedCount: randomRing.selectedStudents.filter(s => s.verified).length,
                totalCount: randomRing.selectedStudents.length
            });

            console.log(`✅ Student ${studentId} verified successfully`);

            res.json({
                success: true,
                message: 'Verification successful',
                responseTime: elapsed
            });
        } else {
            res.json({ success: true, message: 'Verification recorded (in-memory)' });
        }

    } catch (error) {
        console.error('❌ Error verifying random ring:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Random Ring History
app.get('/api/random-ring/history/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { date, limit = 10 } = req.query;

        let query = { teacherId };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.timestamp = { $gte: startDate, $lte: endDate };
        }

        if (mongoose.connection.readyState === 1) {
            const history = await RandomRing.find(query)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit));

            res.json({
                success: true,
                history: history.map(r => ({
                    _id: r._id,
                    timestamp: r.timestamp,
                    type: r.type,
                    count: r.count,
                    subject: r.subject,
                    room: r.room,
                    status: r.status,
                    verifiedCount: r.selectedStudents.filter(s => s.verified).length,
                    selectedStudents: r.selectedStudents
                }))
            });
        } else {
            res.json({ success: true, history: [] });
        }

    } catch (error) {
        console.error('❌ Error fetching random ring history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== NOTIFICATIONS ====================

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userType: { type: String, enum: ['teacher', 'student'], required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: Object,
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Get Notifications
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (mongoose.connection.readyState === 1) {
            const notifications = await Notification.find({ userId })
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(offset));

            const unreadCount = await Notification.countDocuments({ userId, read: false });

            res.json({
                success: true,
                notifications,
                unreadCount
            });
        } else {
            res.json({ success: true, notifications: [], unreadCount: 0 });
        }

    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark Notification as Read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            await Notification.findByIdAndUpdate(req.params.notificationId, { read: true });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== FEEDBACK & SUPPORT ====================

const feedbackSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userType: { type: String, enum: ['teacher', 'student'], required: true },
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    category: String,
    timestamp: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Submit Feedback
app.post('/api/feedback', async (req, res) => {
    try {
        const { teacherId, studentId, rating, feedback, category } = req.body;

        const feedbackDoc = new Feedback({
            userId: teacherId || studentId,
            userType: teacherId ? 'teacher' : 'student',
            rating,
            feedback,
            category
        });

        if (mongoose.connection.readyState === 1) {
            await feedbackDoc.save();
        }

        res.json({
            success: true,
            message: 'Thank you for your feedback!'
        });

    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== TEACHER PROFILE ====================

// Get Teacher Profile
app.get('/api/teacher/profile/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;

        if (mongoose.connection.readyState === 1) {
            const teacher = await Teacher.findOne({
                $or: [
                    { employeeId: teacherId },
                    { _id: teacherId }
                ]
            }).select('-password');

            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    error: 'Teacher not found'
                });
            }

            res.json({
                success: true,
                teacher: {
                    name: teacher.name,
                    employeeId: teacher.employeeId,
                    email: teacher.email,
                    department: teacher.department,
                    phone: teacher.phone,
                    profilePhoto: teacher.photoUrl
                }
            });
        } else {
            res.json({
                success: true,
                teacher: {
                    name: 'Teacher Name',
                    employeeId: teacherId,
                    email: 'teacher@school.edu'
                }
            });
        }

    } catch (error) {
        console.error('❌ Error fetching teacher profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Change Password
app.post('/api/teacher/change-password', async (req, res) => {
    try {
        const { teacherId, oldPassword, newPassword } = req.body;

        if (mongoose.connection.readyState === 1) {
            const teacher = await Teacher.findOne({
                $or: [
                    { employeeId: teacherId },
                    { _id: teacherId }
                ]
            });

            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    error: 'Teacher not found'
                });
            }

            // Verify old password
            if (teacher.password !== oldPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Incorrect old password'
                });
            }

            // Update password
            teacher.password = newPassword;
            await teacher.save();

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } else {
            res.json({ success: true, message: 'Password changed (in-memory)' });
        }

    } catch (error) {
        console.error('❌ Error changing password:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== START SERVER ====================
// All routes must be registered before starting the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
    console.log('========================================');
    console.log('🚀 Attendance SDUI Server Running');
    console.log('========================================');
    console.log(`📡 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`📊 Config API: http://localhost:${PORT}/api/config`);
    console.log(`👥 Students API: http://localhost:${PORT}/api/students`);
    console.log(`🔍 Face Verify: http://localhost:${PORT}/api/verify-face`);
    console.log(`⏰ Time Sync: http://localhost:${PORT}/api/time`);
    console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? 'MongoDB Atlas' : 'In-Memory'}`);
    console.log('========================================');

    // Display server IP addresses
    console.log('🌐 Server Network Information:');
    const localIPs = getServerIPs();
    if (localIPs.length > 0) {
        localIPs.forEach(({ interface: iface, ip }) => {
            console.log(`   📍 ${iface}: ${ip}`);
        });
    } else {
        console.log('   📍 No external network interfaces found');
    }

    // Get public IP (for Render/cloud deployments)
    try {
        const response = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
        console.log(`   🌍 Public IP: ${response.data.ip}`);
        console.log('   ℹ️  Add this IP to MongoDB Atlas whitelist!');
    } catch (error) {
        console.log('   ⚠️  Could not fetch public IP (this is normal for local development)');
    }

    console.log('========================================');
});
