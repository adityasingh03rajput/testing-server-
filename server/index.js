const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = 'mongodb://localhost:27017/attendance_app';
mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.log('⚠️  MongoDB not connected, using in-memory storage');
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

// In-memory storage as fallback
let studentsMemory = [];
let timetableMemory = {};
let studentManagementMemory = [];
let teachersMemory = [];
let classroomsMemory = [];

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
        const { studentId, timerValue, isRunning, status, studentName } = data;

        try {
            // Check if it's an offline ID (starts with "offline_")
            const isOfflineId = studentId && studentId.toString().startsWith('offline_');

            if (mongoose.connection.readyState === 1 && !isOfflineId) {
                await Student.findByIdAndUpdate(studentId, {
                    timerValue,
                    isRunning,
                    status,
                    lastUpdated: new Date()
                });
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
            console.error('Error updating timer:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('📴 Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 Attendance SDUI Server Running');
    console.log('========================================');
    console.log(`📡 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`📊 Config API: http://localhost:${PORT}/api/config`);
    console.log(`👥 Students API: http://localhost:${PORT}/api/students`);
    console.log('========================================');
});


// ==================== ADMIN PANEL API ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

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
                console.log('Student logged in:', user.name);
                return res.json({
                    success: true,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        enrollmentNo: user.enrollmentNo,
                        course: user.course,
                        semester: user.semester,
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
    dob: { type: Date, required: true },
    phone: String,
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
