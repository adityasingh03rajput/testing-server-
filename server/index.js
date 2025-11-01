const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

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
const MONGO_URI = 'mongodb://localhost:27017/attendance_app';
mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ Connected to MongoDB');
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

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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

        // Find user's profile photo - use StudentManagement model (not Student)
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
            if (photoUrl.includes('localhost') || photoUrl.includes('192.168')) {
                const filename = photoUrl.split('/uploads/')[1];
                const filepath = path.join(__dirname, 'uploads', filename);
                if (fs.existsSync(filepath)) {
                    referenceImageBase64 = fs.readFileSync(filepath, 'base64');
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
        } catch (error) {
            console.log('❌ Error loading reference photo:', error);
            return res.status(500).json({
                success: false,
                match: false,
                confidence: 0,
                message: 'Error loading reference photo'
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

        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename with sanitized id (limit length)
        const sanitizedId = String(id).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const timestamp = Date.now();
        const filename = `${type}_${sanitizedId}_${timestamp}.jpg`;
        const filepath = path.join(uploadsDir, filename);

        // Save file to disk
        fs.writeFileSync(filepath, buffer);
        console.log(`✅ Photo saved: ${filename}`);

        // Use full URL with IP address so mobile app can access it
        const photoUrl = `http://192.168.9.31:3000/uploads/${filename}`;
        res.json({ success: true, photoUrl, filename, message: 'Photo uploaded successfully with face detected!' });
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

// ==================== START SERVER ====================
// All routes must be registered before starting the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 Attendance SDUI Server Running');
    console.log('========================================');
    console.log(`📡 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`📊 Config API: http://localhost:${PORT}/api/config`);
    console.log(`👥 Students API: http://localhost:${PORT}/api/students`);
    console.log(`🔍 Face Verify: http://localhost:${PORT}/api/verify-face`);
    console.log(`⏰ Time Sync: http://localhost:${PORT}/api/time`);
    console.log('========================================');
});
