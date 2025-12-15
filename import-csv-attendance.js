require('dotenv').config();
const mongoose = require('mongoose');

// Schemas
const studentManagementSchema = new mongoose.Schema({
    name: String,
    fatherName: String,
    enrollmentNumber: String,
    course: String,
    semester: String,
    email: String,
    phone: String,
    password: String,
    profilePhoto: String
});

const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNumber: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave'], required: true },
    lectures: [{
        period: String,
        subject: String,
        teacher: String,
        teacherName: String,
        room: String,
        startTime: String,
        endTime: String,
        lectureStartedAt: Date,
        lectureEndedAt: Date,
        studentCheckIn: Date,
        attended: Number,
        total: Number,
        percentage: Number,
        present: Boolean,
        verifications: [{
            time: Date,
            type: { type: String, enum: ['face', 'random_ring', 'manual'] },
            success: Boolean,
            event: String
        }]
    }],
    totalAttended: { type: Number, default: 0 },
    totalClassTime: { type: Number, default: 0 },
    dayPercentage: { type: Number, default: 0 },
    timerValue: { type: Number, default: 0 },
    checkInTime: Date,
    checkOutTime: Date,
    semester: String,
    branch: String,
    createdAt: { type: Date, default: Date.now }
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);
const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

// CSV Data - Student attendance mapping
const csvData = {
