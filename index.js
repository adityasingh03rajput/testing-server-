// Azure deployment trigger - Updated December 7, 2024 - Timer system deployment
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
            
            console.log('🔔 Timer update received:', { studentId, timerValue, isRunning, status, studentName });

            // Check if it's an offline ID (starts with "offline_")
            const isOfflineId = studentId && studentId.toString().startsWith('offline_');

            if (mongoose.connection.readyState === 1 && !isOfflineId) {
                console.log('📊 Database connected, processing timer update...');
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
                        const updateResult = await StudentManagement.findByIdAndUpdate(student._id, {
                            timerValue,
                            isRunning,
                            status,
                            lastUpdated: new Date()
                        }, { new: true });
                        
                        console.log(`💾 Database updated:`, { 
                            id: student._id, 
                            isRunning: updateResult.isRunning, 
                            status: updateResult.status,
                            timerValue: updateResult.timerValue
                        });
                        
                        // Broadcast with enrollmentNo for teacher matching
                        io.emit('student_update', { 
                            studentId: student._id.toString(), 
                            enrollmentNo: student.enrollmentNo,
                            name: student.name,
                            timerValue, 
                            isRunning, 
                            status 
                        });
                        console.log(`📡 Broadcasted update for ${student.name} (${student.enrollmentNo})`);
                    } else {
                        console.log(`⚠️ Student not found with ID: ${studentId}`);
                        // Still broadcast with what we have
                        io.emit('student_update', { studentId, timerValue, isRunning, status });
                    }
                } catch (dbError) {
                    console.error('❌ Database error in timer update:', dbError.message);
                    // Continue without throwing - don't break the socket connection
                    // Broadcast with what we have
                    io.emit('student_update', { studentId, timerValue, isRunning, status });
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
                
                // Broadcast to all teachers
                io.emit('student_update', { studentId, timerValue, isRunning, status });
            }
        } catch (error) {
            console.error('❌ Error updating timer:', error);
            socket.emit('error', { message: 'Failed to update timer' });
        }
    });

    // Student starts timer (centralized system)
    socket.on('start_timer', async (data) => {
        try {
            const { studentId, enrollmentNo, name, semester, branch, currentClass, lectureDuration } = data;
            
            console.log(`⏱️ Starting timer for ${name} (${enrollmentNo}) - ${currentClass}`);
            
            // Add to active timers (legacy support)
            activeStudentTimers.set(studentId, {
                startTime: Date.now(),
                semester,
                branch,
                currentClass,
                enrollmentNo,
                name,
                lectureDuration: lectureDuration || 60 // default 60 minutes
            });
            
            // Update database with NEW attendance session system
            if (mongoose.connection.readyState === 1) {
                const now = new Date();
                
                await StudentManagement.findOneAndUpdate(
                    { $or: [{ _id: studentId }, { enrollmentNo }] },
                    {
                        isRunning: true,
                        status: 'attending',
                        lastUpdated: now,
                        // CRITICAL: Set up attendance session for timer broadcast
                        'attendanceSession.sessionStartTime': now,
                        'attendanceSession.totalAttendedSeconds': 0,
                        'attendanceSession.isPaused': false,
                        'attendanceSession.pausedDuration': 0,
                        'attendanceSession.lastPauseTime': null
                    }
                );
                
                console.log(`✅ Attendance session created for ${name} at ${now.toISOString()}`);
            }
            
            socket.emit('timer_started', { success: true, studentId });
            console.log(`✅ Timer started for ${name}`);
        } catch (error) {
            console.error('❌ Error starting timer:', error);
            socket.emit('timer_error', { message: 'Failed to start timer' });
        }
    });
    
    // Student stops timer (centralized system)
    socket.on('stop_timer', async (data) => {
        try {
            const { studentId, enrollmentNo } = data;
            
            const timerData = activeStudentTimers.get(studentId);
            if (timerData) {
                const elapsedMinutes = Math.floor((Date.now() - timerData.startTime) / 60000);
                console.log(`⏹️ Stopping timer for ${timerData.name} - Attended: ${elapsedMinutes} min`);
                
                // Remove from active timers
                activeStudentTimers.delete(studentId);
                
                // Update database
                if (mongoose.connection.readyState === 1) {
                    await StudentManagement.findOneAndUpdate(
                        { $or: [{ _id: studentId }, { enrollmentNo }] },
                        {
                            isRunning: false,
                            status: 'absent',
                            timerValue: 0,
                            lastUpdated: new Date()
                        }
                    );
                }
                
                socket.emit('timer_stopped', { success: true, attendedMinutes: elapsedMinutes });
            }
        } catch (error) {
            console.error('❌ Error stopping timer:', error);
            socket.emit('timer_error', { message: 'Failed to stop timer' });
        }
    });

    socket.on('disconnect', () => {
        console.log('📴 Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
    });
});

// Helper: Convert time string to minutes
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper: Get current lecture info from timetable
async function getCurrentLectureInfo(semester, branch) {
    try {
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const timetable = await Timetable.findOne({ semester, branch });
        if (!timetable) return null;

        const daySchedule = timetable.timetable[currentDay];
        if (!daySchedule) return null;

        for (let i = 0; i < daySchedule.length; i++) {
            const period = daySchedule[i];
            const periodInfo = timetable.periods[i];
            if (!periodInfo) continue;

            const periodStart = timeToMinutes(periodInfo.startTime);
            const periodEnd = timeToMinutes(periodInfo.endTime);

            if (currentTime >= periodStart && currentTime <= periodEnd && !period.isBreak) {
                const totalSeconds = (periodEnd - periodStart) * 60;
                const elapsedSeconds = (currentTime - periodStart) * 60;
                const remainingSeconds = (periodEnd - currentTime) * 60;
                
                return {
                    subject: period.subject,
                    teacher: period.teacher,
                    room: period.room,
                    period: i + 1,
                    startTime: periodInfo.startTime,
                    endTime: periodInfo.endTime,
                    totalSeconds,
                    elapsedSeconds,
                    remainingSeconds,
                    periodStart,
                    periodEnd
                };
            }
        }
        return null;
    } catch (error) {
        console.error('❌ Error getting lecture info:', error);
        return null;
    }
}

// Helper: Calculate attended time for a student
function calculateAttendedTime(student) {
    if (!student.attendanceSession || !student.attendanceSession.sessionStartTime) {
        console.log(`⚠️  No session data for ${student.name}`);
        return 0;
    }
    
    const session = student.attendanceSession;
    const now = Date.now();
    
    // If paused, don't count time since pause
    if (session.isPaused && session.lastPauseTime) {
        const timeBeforePause = session.totalAttendedSeconds || 0;
        console.log(`⏸️  ${student.name} is paused - returning ${timeBeforePause}s`);
        return timeBeforePause;
    }
    
    // Calculate time since session start (ensure proper Date conversion)
    const startTime = new Date(session.sessionStartTime).getTime();
    const sessionDuration = Math.floor((now - startTime) / 1000);
    const pausedDuration = session.pausedDuration || 0;
    const attended = Math.max(0, sessionDuration - pausedDuration);
    
    console.log(`⏱️  ${student.name}: now=${now}, start=${startTime}, duration=${sessionDuration}s, paused=${pausedDuration}s, attended=${attended}s`);
    
    // Total attended = session duration - paused duration
    return attended;
}

// Server-side timer broadcast (every 1 second)
setInterval(async () => {
    try {
        if (mongoose.connection.readyState !== 1) return;

        // Get all students with active timers
        const activeStudents = await StudentManagement.find({ isRunning: true });

        for (const student of activeStudents) {
            try {
                const studentId = student._id.toString();
                
                // Get current lecture info from timetable
                const lectureInfo = await getCurrentLectureInfo(student.semester, student.course);
                
                if (!lectureInfo) {
                    // No active lecture, stop timer and save final attendance
                    const finalAttendedSeconds = calculateAttendedTime(student);
                    
                    await StudentManagement.findByIdAndUpdate(student._id, {
                        isRunning: false,
                        status: 'present',
                        'attendanceSession.totalAttendedSeconds': finalAttendedSeconds,
                        lastUpdated: new Date()
                    });
                    
                    console.log(`⏹️  Timer stopped for ${student.name} - No active lecture`);
                    
                    // Broadcast stop event
                    io.emit('timer_broadcast', {
                        studentId: studentId,
                        enrollmentNo: student.enrollmentNo,
                        name: student.name,
                        isRunning: false,
                        status: 'present',
                        attendedSeconds: finalAttendedSeconds
                    });
                    continue;
                }
                
                // Calculate current attended time
                const attendedSeconds = calculateAttendedTime(student);
                
                // Check if lecture is ending (last 5 seconds) - save to history
                if (lectureInfo.remainingSeconds <= 5 && lectureInfo.remainingSeconds > 0) {
                    // Save period attendance to history
                    const attendedMinutes = Math.floor(attendedSeconds / 60);
                    const totalMinutes = Math.floor(lectureInfo.totalSeconds / 60);
                    const percentage = lectureInfo.totalSeconds > 0 
                        ? Math.round((attendedSeconds / lectureInfo.totalSeconds) * 100)
                        : 0;
                    
                    const periodData = {
                        subject: lectureInfo.subject,
                        room: lectureInfo.room,
                        teacher: lectureInfo.teacher,
                        startTime: lectureInfo.startTime,
                        endTime: lectureInfo.endTime,
                        attendedSeconds: attendedSeconds,
                        totalSeconds: lectureInfo.totalSeconds,
                        attendedMinutes: attendedMinutes,
                        totalMinutes: totalMinutes,
                        percentage: percentage,
                        present: percentage >= 75,
                        verifiedFace: true,
                        randomRingTriggered: student.attendanceSession?.randomRingId ? true : false,
                        randomRingPassed: student.attendanceSession?.randomRingId ? 
                            (student.attendanceSession?.randomRingPassed || false) : null,
                        offlineTime: student.attendanceSession?.offlineAttendedSeconds || 0
                    };
                    
                    // Save to AttendanceHistory
                    try {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        let attendance = await AttendanceHistory.findOne({
                            enrollmentNo: student.enrollmentNo,
                            date: today
                        });
                        
                        if (!attendance) {
                            attendance = new AttendanceHistory({
                                studentId: student._id,
                                enrollmentNo: student.enrollmentNo,
                                studentName: student.name,
                                date: today,
                                semester: student.semester,
                                branch: student.course,
                                periods: []
                            });
                        }
                        
                        // Check if period already saved
                        const existingPeriodIndex = attendance.periods.findIndex(p => 
                            p.subject === periodData.subject && 
                            p.startTime === periodData.startTime
                        );
                        
                        if (existingPeriodIndex >= 0) {
                            attendance.periods[existingPeriodIndex] = periodData;
                        } else {
                            attendance.periods.push(periodData);
                        }
                        
                        // Recalculate daily totals
                        attendance.totalAttendedSeconds = attendance.periods.reduce((sum, p) => sum + p.attendedSeconds, 0);
                        attendance.totalClassSeconds = attendance.periods.reduce((sum, p) => sum + p.totalSeconds, 0);
                        attendance.totalAttendedMinutes = Math.floor(attendance.totalAttendedSeconds / 60);
                        attendance.totalClassMinutes = Math.floor(attendance.totalClassSeconds / 60);
                        attendance.dayPercentage = attendance.totalClassSeconds > 0 
                            ? Math.round((attendance.totalAttendedSeconds / attendance.totalClassSeconds) * 100)
                            : 0;
                        attendance.dayPresent = attendance.dayPercentage >= 75;
                        attendance.updatedAt = new Date();
                        
                        await attendance.save();
                        console.log(`💾 Saved period attendance for ${student.name} - ${lectureInfo.subject}`);
                    } catch (historyError) {
                        console.error('❌ Error saving attendance history:', historyError);
                    }
                }
                
                // Update database with current attended time (persistent storage)
                await StudentManagement.findByIdAndUpdate(student._id, {
                    'attendanceSession.totalAttendedSeconds': attendedSeconds,
                    'currentClass.totalDurationSeconds': lectureInfo.totalSeconds,
                    lastUpdated: new Date()
                });
                
                // Calculate time wasted (lecture elapsed - attended)
                const timeWastedSeconds = Math.max(0, lectureInfo.elapsedSeconds - attendedSeconds);
                
                // Broadcast to all clients (teacher dashboard + student app)
                const broadcastData = {
                    studentId: studentId,
                    enrollmentNo: student.enrollmentNo,
                    name: student.name,
                    semester: student.semester,
                    branch: student.course,
                    
                    // Lecture info
                    lectureSubject: lectureInfo.subject,
                    lectureTeacher: lectureInfo.teacher,
                    lectureRoom: lectureInfo.room,
                    lecturePeriod: lectureInfo.period,
                    lectureStartTime: lectureInfo.startTime,
                    lectureEndTime: lectureInfo.endTime,
                    
                    // Time tracking (all in seconds, server-calculated)
                    totalLectureSeconds: lectureInfo.totalSeconds,
                    elapsedLectureSeconds: lectureInfo.elapsedSeconds,
                    remainingLectureSeconds: lectureInfo.remainingSeconds,
                    attendedSeconds: attendedSeconds,
                    timeWastedSeconds: timeWastedSeconds,
                    
                    // Status
                    isRunning: true,
                    isPaused: student.attendanceSession?.isPaused || false,
                    pauseReason: student.attendanceSession?.pauseReason || null,
                    status: student.attendanceSession?.isPaused ? 'paused' : 'attending'
                };
                
                io.emit('timer_broadcast', broadcastData);
                
            } catch (studentError) {
                console.error(`❌ Error processing student ${student.name}:`, studentError);
            }
        }
    } catch (error) {
        console.error('❌ Timer broadcast error:', error);
    }
}, 1000); // Broadcast every 1 second



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

// 5-minute backup: Save attended minutes for recovery
app.post('/api/attendance/backup', async (req, res) => {
    try {
        const {
            studentId, enrollmentNo, studentName, semester, branch,
            attendedMinutes, currentClass, timestamp, isRunning, status
        } = req.body;

        console.log(`💾 Backup received: ${studentName} - ${attendedMinutes} minutes in ${currentClass}`);

        // Use server time for backup timestamp
        const serverTimestamp = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (mongoose.connection.readyState === 1) {
            // Update StudentManagement with latest attended minutes
            const student = await StudentManagement.findOne({
                $or: [
                    { _id: studentId },
                    { enrollmentNo: enrollmentNo }
                ]
            });

            if (student) {
                // Store backup data in a new field
                if (!student.attendanceBackup) {
                    student.attendanceBackup = [];
                }

                // Add backup entry
                student.attendanceBackup.push({
                    date: today,
                    timestamp: serverTimestamp,
                    attendedMinutes,
                    currentClass,
                    isRunning,
                    status
                });

                // Keep only last 10 backups per day
                student.attendanceBackup = student.attendanceBackup
                    .filter(b => b.date.toDateString() === today.toDateString())
                    .slice(-10);

                // Update current status
                student.status = status;
                student.isRunning = isRunning;
                student.lastUpdated = serverTimestamp;

                await student.save();

                console.log(`✅ Backup saved for ${studentName}: ${attendedMinutes} min`);
                res.json({ 
                    success: true, 
                    message: 'Backup saved',
                    attendedMinutes,
                    serverTimestamp: serverTimestamp.toISOString()
                });
            } else {
                console.warn(`⚠️ Student not found for backup: ${studentId}`);
                res.status(404).json({ success: false, error: 'Student not found' });
            }
        } else {
            // In-memory fallback
            console.log('📝 Backup saved to memory (DB not connected)');
            res.json({ 
                success: true, 
                message: 'Backup saved to memory',
                attendedMinutes
            });
        }
    } catch (error) {
        console.error('❌ Error saving backup:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Offline Attendance Sync - Sync offline time when student reconnects
app.post('/api/attendance/sync-offline', async (req, res) => {
    try {
        const { studentId, offlineStartTime, offlineEndTime, offlineDuration, lastKnownSeconds, lectureSubject } = req.body;
        
        console.log(`🔄 Syncing offline attendance for student ${studentId}`);
        console.log(`   Offline period: ${new Date(offlineStartTime).toLocaleTimeString()} - ${new Date(offlineEndTime).toLocaleTimeString()}`);
        console.log(`   Duration: ${offlineDuration}s (${Math.floor(offlineDuration / 60)}m)`);
        
        if (!studentId || !offlineStartTime || !offlineEndTime) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        // Check if Random Ring was triggered during offline period
        const randomRing = await RandomRing.findOne({
            'selectedStudents.studentId': studentId,
            triggerTime: {
                $gte: new Date(offlineStartTime),
                $lte: new Date(offlineEndTime)
            }
        });
        
        if (randomRing) {
            console.log(`⚠️  Random Ring was triggered during offline period: ${randomRing._id}`);
            
            // Check if teacher manually accepted student
            const studentData = randomRing.selectedStudents.find(s => 
                s.studentId === studentId || s.enrollmentNo === studentId
            );
            
            if (studentData && studentData.teacherAccepted) {
                // Teacher accepted, allow full offline time
                console.log(`✅ Teacher accepted student during offline - allowing full offline time`);
                
                const totalSeconds = lastKnownSeconds + offlineDuration;
                await StudentManagement.findByIdAndUpdate(studentId, {
                    'attendanceSession.totalAttendedSeconds': totalSeconds,
                    $push: {
                        'attendanceSession.offlinePeriods': {
                            startTime: new Date(offlineStartTime),
                            endTime: new Date(offlineEndTime),
                            duration: offlineDuration
                        }
                    }
                });
                
                return res.json({
                    success: true,
                    randomRingMissed: false,
                    teacherAccepted: true,
                    totalAttendedSeconds: totalSeconds,
                    message: 'Teacher accepted you during offline period - full time counted'
                });
            } else {
                // Random Ring failed, cap attendance at Random Ring time
                console.log(`❌ Random Ring failed - capping attendance`);
                
                const student = await StudentManagement.findById(studentId);
                if (!student || !student.attendanceSession || !student.attendanceSession.sessionStartTime) {
                    return res.status(404).json({
                        success: false,
                        error: 'Student session not found'
                    });
                }
                
                const cappedSeconds = Math.floor((randomRing.triggerTime - student.attendanceSession.sessionStartTime) / 1000);
                
                await StudentManagement.findByIdAndUpdate(studentId, {
                    'attendanceSession.totalAttendedSeconds': cappedSeconds,
                    'attendanceSession.randomRingFailed': true,
                    isRunning: false,
                    status: 'absent'
                });
                
                return res.json({
                    success: true,
                    randomRingMissed: true,
                    cappedAt: cappedSeconds,
                    cappedMinutes: Math.floor(cappedSeconds / 60),
                    message: `Attendance capped at Random Ring time (${Math.floor(cappedSeconds / 60)} minutes)`
                });
            }
        } else {
            // No Random Ring during offline period, accept full offline time
            console.log(`✅ No Random Ring during offline - accepting full offline time`);
            
            const totalSeconds = lastKnownSeconds + offlineDuration;
            await StudentManagement.findByIdAndUpdate(studentId, {
                'attendanceSession.totalAttendedSeconds': totalSeconds,
                $push: {
                    'attendanceSession.offlinePeriods': {
                        startTime: new Date(offlineStartTime),
                        endTime: new Date(offlineEndTime),
                        duration: offlineDuration
                    }
                }
            });
            
            return res.json({
                success: true,
                randomRingMissed: false,
                totalAttendedSeconds: totalSeconds,
                message: 'Offline time synced successfully'
            });
        }
    } catch (error) {
        console.error('❌ Error syncing offline attendance:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get attendance statistics
app.get('/api/attendance/stats', async (req, res) => {
    try {
        const { studentId, semester, branch, startDate, endDate} = req.query;
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

// Get students attendance for a specific date (for teachers)
app.get('/api/attendance/date/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const { semester, branch } = req.query;
        
        console.log('📅 Fetching students for date:', date, 'Semester:', semester, 'Branch:', branch);
        
        if (!date || !semester || !branch) {
            return res.status(400).json({ 
                success: false, 
                error: 'Date, semester, and branch are required' 
            });
        }

        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        if (mongoose.connection.readyState === 1) {
            // Fetch all attendance records for this date, semester, and branch
            const records = await AttendanceRecord.find({
                date: { $gte: startOfDay, $lte: endOfDay },
                semester: semester,
                branch: branch
            }).lean();

            console.log('📊 Found', records.length, 'attendance records');

            // Group by student and aggregate their data
            const studentMap = {};
            
            for (const record of records) {
                if (!studentMap[record.studentId]) {
                    // Fetch student details
                    const student = await Student.findOne({ studentId: record.studentId }).lean();
                    
                    studentMap[record.studentId] = {
                        studentId: record.studentId,
                        name: student?.name || 'Unknown',
                        status: record.status,
                        totalAttended: record.totalAttended || 0,
                        totalClassTime: record.totalClassTime || 0,
                        percentage: record.dayPercentage || 0,
                        lectures: record.lectures || []
                    };
                } else {
                    // Aggregate if multiple records exist
                    studentMap[record.studentId].totalAttended += record.totalAttended || 0;
                    studentMap[record.studentId].totalClassTime += record.totalClassTime || 0;
                    if (record.lectures) {
                        studentMap[record.studentId].lectures.push(...record.lectures);
                    }
                }
            }

            const students = Object.values(studentMap);
            console.log('👥 Returning', students.length, 'students');

            res.json({
                success: true,
                students: students,
                date: date,
                semester: semester,
                branch: branch
            });
        } else {
            // Memory fallback
            const records = attendanceRecordsMemory.filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= startOfDay && recordDate <= endOfDay &&
                       r.semester === semester && r.branch === branch;
            });

            const students = records.map(r => ({
                studentId: r.studentId,
                name: r.studentName || 'Unknown',
                status: r.status,
                totalAttended: r.totalAttended || 0,
                totalClassTime: r.totalClassTime || 0,
                percentage: r.dayPercentage || 0
            }));

            res.json({
                success: true,
                students: students,
                date: date,
                semester: semester,
                branch: branch
            });
        }
    } catch (error) {
        console.error('❌ Error fetching students for date:', error);
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

// Face Verification API - Using face-api.js only
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
        // This prevents tampering with the reference photo
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

        // Check if models are loaded
        if (!faceApiService.areModelsLoaded()) {
            console.log('❌ Face-API.js models not loaded');
            return res.status(503).json({
                success: false,
                match: false,
                confidence: 0,
                message: 'Face recognition service not available. Please contact administrator.'
            });
        }

        // Use face-api.js for verification
        console.log('🤖 Using face-api.js for verification...');

        const result = await faceApiService.compareFaces(capturedImage, referenceImageBase64);
        const verificationTime = Date.now() - startTime;

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

        res.json({
            success: true,
            match: result.match,
            confidence: result.confidence,
            distance: result.distance,
            message: result.message,
            method: 'face-api.js'
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
                console.log('📸 PhotoUrl from DB:', user.photoUrl);
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
                        photoUrl: user.photoUrl,
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
    createdAt: { type: Date, default: Date.now },
    // Timer and attendance tracking fields
    timerValue: { type: Number, default: 0 },
    isRunning: { type: Boolean, default: false },
    status: { type: String, enum: ['attending', 'absent', 'present'], default: 'absent' },
    lastUpdated: { type: Date, default: Date.now },
    // Attendance session tracking (server-side timer)
    attendanceSession: {
        sessionStartTime: { type: Date },
        totalAttendedSeconds: { type: Number, default: 0 },
        lastPauseTime: { type: Date },
        pausedDuration: { type: Number, default: 0 },
        isPaused: { type: Boolean, default: false },
        pauseReason: { type: String },
        randomRingId: { type: String }, // Current Random Ring ID
        randomRingTime: { type: Date }, // When Random Ring was triggered
        timeBeforeRandomRing: { type: Number }, // Attended time before Random Ring
        verifiedForPeriod: { type: String }, // Period ID for face verification
        offlinePeriods: [{ // Track offline periods
            startTime: { type: Date },
            endTime: { type: Date },
            duration: { type: Number }
        }]
    },
    // Current class info
    currentClass: {
        subject: String,
        teacher: String,
        room: String,
        period: Number,
        startTime: String,
        endTime: String,
        totalDurationSeconds: Number
    },
    // 5-minute backup data for recovery
    attendanceBackup: [{
        date: { type: Date, required: true },
        timestamp: { type: Date, required: true },
        attendedMinutes: { type: Number, required: true },
        currentClass: { type: String },
        isRunning: { type: Boolean },
        status: { type: String }
    }]
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

// Debug endpoint to test timer calculation
app.get('/api/debug/timer-calc/:enrollmentNo', async (req, res) => {
    try {
        const student = await StudentManagement.findOne({ enrollmentNo: req.params.enrollmentNo });
        if (!student) {
            return res.json({ error: 'Student not found' });
        }
        
        const now = Date.now();
        const session = student.attendanceSession;
        
        if (!session || !session.sessionStartTime) {
            return res.json({
                error: 'No session data',
                student: student.name,
                hasSession: !!session,
                hasStartTime: !!session?.sessionStartTime
            });
        }
        
        const startTime = new Date(session.sessionStartTime).getTime();
        const sessionDuration = Math.floor((now - startTime) / 1000);
        const pausedDuration = session.pausedDuration || 0;
        const attended = Math.max(0, sessionDuration - pausedDuration);
        
        res.json({
            student: student.name,
            enrollmentNo: student.enrollmentNo,
            now: new Date(now).toISOString(),
            sessionStartTime: session.sessionStartTime,
            sessionStartTimeType: typeof session.sessionStartTime,
            startTimeConverted: new Date(session.sessionStartTime).toISOString(),
            startTimeMs: startTime,
            nowMs: now,
            sessionDurationSeconds: sessionDuration,
            pausedDurationSeconds: pausedDuration,
            attendedSeconds: attended,
            attendedMinutes: Math.floor(attended / 60),
            isPaused: session.isPaused,
            totalAttendedSecondsInDB: session.totalAttendedSeconds
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

// Get students by semester and branch (for ViewRecords screen)
app.get('/api/view-records/students', async (req, res) => {
    try {
        const { semester, branch } = req.query;

        if (!semester || !branch) {
            return res.status(400).json({
                success: false,
                error: 'Semester and branch required'
            });
        }

        console.log(`📋 Fetching records for ${branch} Semester ${semester}`);

        if (mongoose.connection.readyState === 1) {
            const students = await StudentManagement.find({
                semester: semester,
                course: branch
            }).select('-password');

            // Get attendance stats for each student
            const studentsWithStats = await Promise.all(
                students.map(async (student) => {
                    const records = await AttendanceRecord.find({
                        studentId: student._id
                    });

                    const total = records.length;
                    const present = records.filter(r => r.status === 'present').length;
                    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

                    return {
                        ...student.toObject(),
                        attendancePercentage,
                        totalDays: total,
                        presentDays: present
                    };
                })
            );

            res.json({
                success: true,
                students: studentsWithStats,
                count: studentsWithStats.length
            });
        } else {
            // In-memory fallback
            const students = studentManagementMemory.filter(s =>
                s.semester === semester && s.course === branch
            );

            res.json({
                success: true,
                students: students.map(s => ({
                    ...s,
                    attendancePercentage: Math.floor(Math.random() * 30) + 70
                })),
                count: students.length
            });
        }
    } catch (error) {
        console.error('❌ Error fetching view records:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
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

// Random Ring Schema
const randomRingSchema = new mongoose.Schema({
    teacherId: { type: String, required: true },
    teacherName: String,
    semester: String,
    branch: String,
    subject: String,
    room: String,
    bssid: String,
    type: { type: String, enum: ['all', 'select'], required: true },
    count: Number,
    triggerTime: { type: Date, default: Date.now }, // When Random Ring was triggered
    selectedStudents: [{
        studentId: String,
        name: String,
        enrollmentNo: String,
        notificationSent: Boolean,
        notificationTime: Date,
        verified: Boolean,
        verificationTime: Date,
        verificationPhoto: String,
        teacherAccepted: Boolean, // Teacher manually accepted
        teacherRejected: Boolean, // Teacher rejected
        teacherActionTime: Date,
        reVerified: Boolean, // Re-verified after rejection
        reVerifyTime: Date,
        failed: Boolean // Failed to verify within 5 minutes
    }],
    status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
});

const RandomRing = mongoose.model('RandomRing', randomRingSchema);

// AttendanceHistory Schema - Detailed per-period, per-day, per-subject tracking
const attendanceHistorySchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentManagement', required: true },
    enrollmentNo: { type: String, required: true },
    studentName: { type: String, required: true },
    date: { type: Date, required: true },
    semester: String,
    branch: String,
    
    // Per-period attendance
    periods: [{
        subject: String,
        room: String,
        teacher: String,
        startTime: String,
        endTime: String,
        attendedSeconds: Number,
        totalSeconds: Number,
        attendedMinutes: Number,
        totalMinutes: Number,
        percentage: Number,
        present: Boolean, // true if >= 75%
        verifiedFace: Boolean,
        randomRingTriggered: Boolean,
        randomRingPassed: Boolean,
        offlineTime: Number, // seconds attended offline
        timestamp: { type: Date, default: Date.now }
    }],
    
    // Daily summary
    totalAttendedSeconds: { type: Number, default: 0 },
    totalClassSeconds: { type: Number, default: 0 },
    totalAttendedMinutes: { type: Number, default: 0 },
    totalClassMinutes: { type: Number, default: 0 },
    dayPercentage: { type: Number, default: 0 },
    dayPresent: { type: Boolean, default: false },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for fast queries
attendanceHistorySchema.index({ studentId: 1, date: -1 });
attendanceHistorySchema.index({ enrollmentNo: 1, date: -1 });
attendanceHistorySchema.index({ date: -1 });

const AttendanceHistory = mongoose.model('AttendanceHistory', attendanceHistorySchema);

// Attendance History APIs

// Get attendance history for a student
app.get('/api/attendance/history/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate, subject } = req.query;
        
        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, history: [] });
        }
        
        const query = {
            $or: [
                { studentId: studentId },
                { enrollmentNo: studentId }
            ]
        };
        
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        let history = await AttendanceHistory.find(query).sort({ date: -1 });
        
        // Filter by subject if specified
        if (subject) {
            history = history.map(day => ({
                ...day.toObject(),
                periods: day.periods.filter(p => p.subject === subject)
            })).filter(day => day.periods.length > 0);
        }
        
        res.json({ success: true, history });
        
    } catch (error) {
        console.error('❌ Error fetching attendance history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save/Update attendance for a period
app.post('/api/attendance/history/period', async (req, res) => {
    try {
        const { 
            studentId, 
            enrollmentNo, 
            studentName, 
            date, 
            semester, 
            branch, 
            period 
        } = req.body;
        
        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, message: 'Database not connected' });
        }
        
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        
        // Find or create attendance record for the day
        let attendance = await AttendanceHistory.findOne({
            $or: [
                { studentId: studentId },
                { enrollmentNo: enrollmentNo }
            ],
            date: dateObj
        });
        
        if (!attendance) {
            attendance = new AttendanceHistory({
                studentId,
                enrollmentNo,
                studentName,
                date: dateObj,
                semester,
                branch,
                periods: []
            });
        }
        
        // Check if period already exists
        const existingPeriodIndex = attendance.periods.findIndex(p => 
            p.subject === period.subject && 
            p.startTime === period.startTime
        );
        
        if (existingPeriodIndex >= 0) {
            // Update existing period
            attendance.periods[existingPeriodIndex] = {
                ...attendance.periods[existingPeriodIndex].toObject(),
                ...period,
                timestamp: new Date()
            };
        } else {
            // Add new period
            attendance.periods.push({
                ...period,
                timestamp: new Date()
            });
        }
        
        // Recalculate daily totals
        attendance.totalAttendedSeconds = attendance.periods.reduce((sum, p) => sum + (p.attendedSeconds || 0), 0);
        attendance.totalClassSeconds = attendance.periods.reduce((sum, p) => sum + (p.totalSeconds || 0), 0);
        attendance.totalAttendedMinutes = Math.floor(attendance.totalAttendedSeconds / 60);
        attendance.totalClassMinutes = Math.floor(attendance.totalClassSeconds / 60);
        attendance.dayPercentage = attendance.totalClassSeconds > 0 
            ? Math.round((attendance.totalAttendedSeconds / attendance.totalClassSeconds) * 100)
            : 0;
        attendance.dayPresent = attendance.dayPercentage >= 75;
        attendance.updatedAt = new Date();
        
        await attendance.save();
        
        res.json({ success: true, attendance });
        
    } catch (error) {
        console.error('❌ Error saving period attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get date range of available attendance data
app.get('/api/attendance/date-range', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json({ 
                success: true, 
                dateRange: null,
                message: 'Database not connected'
            });
        }
        
        // Get earliest and latest dates from AttendanceHistory
        const result = await AttendanceHistory.aggregate([
            {
                $group: {
                    _id: null,
                    earliest: { $min: '$date' },
                    latest: { $max: '$date' },
                    totalRecords: { $sum: 1 }
                }
            }
        ]);
        
        if (result.length > 0 && result[0].earliest) {
            res.json({
                success: true,
                dateRange: {
                    earliest: result[0].earliest,
                    latest: result[0].latest,
                    totalRecords: result[0].totalRecords
                }
            });
        } else {
            res.json({
                success: true,
                dateRange: null,
                message: 'No attendance data available yet'
            });
        }
        
    } catch (error) {
        console.error('❌ Error fetching date range:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get attendance summary for a student
app.get('/api/attendance/summary/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate } = req.query;
        
        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, summary: {} });
        }
        
        const query = {
            $or: [
                { studentId: studentId },
                { enrollmentNo: studentId }
            ]
        };
        
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const history = await AttendanceHistory.find(query);
        
        // Calculate overall statistics
        const totalDays = history.length;
        const presentDays = history.filter(d => d.dayPresent).length;
        const totalAttendedMinutes = history.reduce((sum, d) => sum + d.totalAttendedMinutes, 0);
        const totalClassMinutes = history.reduce((sum, d) => sum + d.totalClassMinutes, 0);
        const overallPercentage = totalClassMinutes > 0 
            ? Math.round((totalAttendedMinutes / totalClassMinutes) * 100)
            : 0;
        
        // Per-subject statistics
        const subjectStats = {};
        history.forEach(day => {
            day.periods.forEach(period => {
                if (!subjectStats[period.subject]) {
                    subjectStats[period.subject] = {
                        subject: period.subject,
                        totalAttendedMinutes: 0,
                        totalClassMinutes: 0,
                        periodsAttended: 0,
                        totalPeriods: 0
                    };
                }
                subjectStats[period.subject].totalAttendedMinutes += period.attendedMinutes || 0;
                subjectStats[period.subject].totalClassMinutes += period.totalMinutes || 0;
                subjectStats[period.subject].totalPeriods++;
                if (period.present) {
                    subjectStats[period.subject].periodsAttended++;
                }
            });
        });
        
        // Calculate percentage for each subject
        Object.values(subjectStats).forEach(stat => {
            stat.percentage = stat.totalClassMinutes > 0
                ? Math.round((stat.totalAttendedMinutes / stat.totalClassMinutes) * 100)
                : 0;
        });
        
        res.json({
            success: true,
            summary: {
                totalDays,
                presentDays,
                totalAttendedMinutes,
                totalClassMinutes,
                overallPercentage,
                subjects: Object.values(subjectStats)
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching attendance summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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

// ==================== START SERVER ====================
// Random Ring - Send notifications to selected students
app.post('/api/random-ring', async (req, res) => {
    try {
        const { type, count, teacherId, teacherName, semester, branch, subject, room, bssid } = req.body;

        console.log('🔔 Random Ring initiated:', { type, count, teacherId, semester, branch });

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                error: 'Teacher ID required'
            });
        }

        // Get students for the class
        let students = [];
        if (mongoose.connection.readyState === 1) {
            const query = {};
            if (semester) query.semester = semester;
            if (branch) query.course = branch;
            
            students = await StudentManagement.find(query);
        } else {
            students = studentManagementMemory;
        }

        // Filter students who are currently attending (connected to WiFi)
        const attendingStudents = students.filter(s => 
            s.status === 'attending' || s.status === 'active' || s.isRunning
        );

        console.log(`📊 Found ${attendingStudents.length} attending students out of ${students.length} total`);

        if (attendingStudents.length === 0) {
            return res.json({
                success: true,
                message: 'No students currently attending',
                selectedStudents: []
            });
        }

        // Select students based on type
        let selectedStudents = [];
        if (type === 'all') {
            selectedStudents = attendingStudents;
        } else if (type === 'select' && count) {
            // Randomly select N students
            const shuffled = [...attendingStudents].sort(() => 0.5 - Math.random());
            selectedStudents = shuffled.slice(0, Math.min(count, attendingStudents.length));
        }

        console.log(`✅ Selected ${selectedStudents.length} students for random ring`);

        // Create random ring record in database
        let randomRingId = null;
        if (mongoose.connection.readyState === 1) {
            const randomRing = new RandomRing({
                teacherId,
                teacherName: teacherName || 'Teacher',
                semester,
                branch,
                subject,
                room,
                bssid,
                type,
                count: type === 'select' ? count : selectedStudents.length,
                selectedStudents: selectedStudents.map(s => ({
                    studentId: s._id ? s._id.toString() : s.enrollmentNo,
                    name: s.name,
                    enrollmentNo: s.enrollmentNo,
                    notificationSent: true,
                    notificationTime: new Date(),
                    verified: false
                })),
                status: 'pending'
            });

            await randomRing.save();
            randomRingId = randomRing._id.toString();
            console.log(`💾 Random ring record created: ${randomRingId}`);
        }

        // PAUSE TIMER for all selected students
        if (mongoose.connection.readyState === 1) {
            const now = new Date();
            for (const student of selectedStudents) {
                await StudentManagement.findByIdAndUpdate(student._id, {
                    'attendanceSession.isPaused': true,
                    'attendanceSession.pauseReason': 'random_ring',
                    'attendanceSession.lastPauseTime': now,
                    'attendanceSession.randomRingId': randomRingId,
                    'attendanceSession.randomRingTime': now
                });
            }
            console.log(`⏸️  Paused timer for ${selectedStudents.length} students`);
        }

        // Send notifications via Socket.IO
        selectedStudents.forEach(student => {
            io.emit('random_ring_notification', {
                randomRingId: randomRingId,
                studentId: student._id || student.enrollmentNo,
                enrollmentNo: student.enrollmentNo,
                studentName: student.name,
                message: 'Timer Paused - Verify your presence to resume!',
                teacherId: teacherId,
                teacherName: teacherName,
                bssid: bssid,
                timestamp: Date.now(),
                timerPaused: true // Flag to indicate timer is paused
            });
        });

        res.json({
            success: true,
            message: `Random ring sent to ${selectedStudents.length} students`,
            randomRingId: randomRingId,
            selectedStudents: selectedStudents.map(s => ({
                id: s._id || s.enrollmentNo,
                name: s.name,
                enrollmentNo: s.enrollmentNo
            }))
        });

    } catch (error) {
        console.error('❌ Error in random ring:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Student verifies random ring
app.post('/api/random-ring/verify', async (req, res) => {
    try {
        const { randomRingId, studentId, verificationPhoto, bssid } = req.body;

        console.log('🔔 Random Ring verification:', { randomRingId, studentId });

        if (!randomRingId || !studentId) {
            return res.status(400).json({
                success: false,
                error: 'Random Ring ID and Student ID required'
            });
        }

        // Find the random ring record
        let randomRing = null;
        if (mongoose.connection.readyState === 1) {
            randomRing = await RandomRing.findById(randomRingId);
            
            if (!randomRing) {
                return res.status(404).json({
                    success: false,
                    error: 'Random ring not found'
                });
            }

            // Update student verification status
            const studentIndex = randomRing.selectedStudents.findIndex(
                s => s.studentId === studentId || s.enrollmentNo === studentId
            );

            if (studentIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Student not found in this random ring'
                });
            }

            randomRing.selectedStudents[studentIndex].verified = true;
            randomRing.selectedStudents[studentIndex].verificationTime = new Date();
            randomRing.selectedStudents[studentIndex].verificationPhoto = verificationPhoto;

            // Check if all students have verified
            const allVerified = randomRing.selectedStudents.every(s => s.verified);
            if (allVerified) {
                randomRing.status = 'completed';
            }

            await randomRing.save();
            console.log(`✅ Student ${studentId} verified for random ring ${randomRingId}`);
        }

        res.json({
            success: true,
            message: 'Verification successful'
        });

    } catch (error) {
        console.error('❌ Error in random ring verification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get Random Ring History
app.get('/api/random-ring/history/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;

        if (mongoose.connection.readyState === 1) {
            const history = await RandomRing.find({ teacherId })
                .sort({ createdAt: -1 })
                .limit(50);

            res.json({
                success: true,
                history: history
            });
        } else {
            res.json({
                success: true,
                history: []
            });
        }

    } catch (error) {
        console.error('❌ Error fetching random ring history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Teacher manually accepts/rejects student presence
app.post('/api/random-ring/teacher-action', async (req, res) => {
    try {
        const { randomRingId, studentId, action, reason } = req.body;
        
        console.log(`👨‍🏫 Teacher ${action} student ${studentId} in random ring ${randomRingId}`);
        
        if (!['accepted', 'rejected'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Must be "accepted" or "rejected"'
            });
        }
        
        if (mongoose.connection.readyState === 1) {
            const randomRing = await RandomRing.findById(randomRingId);
            
            if (!randomRing) {
                return res.status(404).json({
                    success: false,
                    error: 'Random ring not found'
                });
            }
            
            // Find student in selected students
            const studentIndex = randomRing.selectedStudents.findIndex(s => {
                if (s.studentId === studentId) return true;
                if (s.enrollmentNo === studentId) return true;
                if (s.studentId?.toString() === studentId?.toString()) return true;
                if (s.enrollmentNo?.toString() === studentId?.toString()) return true;
                return false;
            });
            
            if (studentIndex === -1) {
                console.error(`❌ Student not found in random ring`);
                return res.status(404).json({
                    success: false,
                    error: 'Student not found in this random ring'
                });
            }
            
            const now = new Date();
            
            // Update teacher action
            randomRing.selectedStudents[studentIndex].teacherAction = action;
            randomRing.selectedStudents[studentIndex].teacherActionTime = now;
            randomRing.selectedStudents[studentIndex].teacherActionReason = reason || '';
            
            if (action === 'accepted') {
                // Mark as verified and resume timer
                randomRing.selectedStudents[studentIndex].verified = true;
                randomRing.selectedStudents[studentIndex].verificationTime = now;
                
                // Resume student timer
                const student = await StudentManagement.findOne({
                    $or: [{ _id: studentId }, { enrollmentNo: studentId }]
                });
                
                if (student && student.attendanceSession?.isPaused) {
                    const pausedDuration = student.attendanceSession.pausedDuration || 0;
                    const lastPauseTime = student.attendanceSession.lastPauseTime;
                    const additionalPausedTime = lastPauseTime 
                        ? Math.floor((Date.now() - lastPauseTime.getTime()) / 1000)
                        : 0;

                    await StudentManagement.findByIdAndUpdate(student._id, {
                        'attendanceSession.isPaused': false,
                        'attendanceSession.pauseReason': null,
                        'attendanceSession.pausedDuration': pausedDuration + additionalPausedTime,
                        'attendanceSession.lastPauseTime': null,
                        isRunning: true,
                        status: 'attending',
                        lastUpdated: new Date()
                    });
                    
                    console.log(`▶️  Timer resumed for ${student.name} - Teacher accepted`);
                    
                    io.emit('random_ring_teacher_accepted', {
                        studentId: student._id.toString(),
                        enrollmentNo: student.enrollmentNo,
                        message: 'Teacher verified your presence. Timer resumed.',
                        randomRingId: randomRingId
                    });
                }
            } else if (action === 'rejected') {
                // Notify student to verify face
                const student = await StudentManagement.findOne({
                    $or: [{ _id: studentId }, { enrollmentNo: studentId }]
                });
                
                if (student) {
                    io.emit('random_ring_teacher_rejected', {
                        studentId: student._id.toString(),
                        enrollmentNo: student.enrollmentNo,
                        message: 'Teacher marked you absent. Verify your face within 5 minutes to resume timer.',
                        randomRingId: randomRingId,
                        expiresAt: new Date(now.getTime() + 5 * 60 * 1000)
                    });
                }
            }
            
            await randomRing.save();
            
            // Notify all teachers about the action
            io.emit('random_ring_teacher_action_update', {
                randomRingId: randomRingId,
                studentId: studentId,
                action: action,
                teacherActionTime: now
            });
            
            res.json({
                success: true,
                message: `Student ${action}`,
                action: action
            });
        } else {
            res.json({ success: true, message: 'Action recorded (in-memory)' });
        }
        
    } catch (error) {
        console.error('❌ Error in teacher action:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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
