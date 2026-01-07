const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';

// Student Management Schema (matching your server.js)
const studentManagementSchema = new mongoose.Schema({
    name: String,
    enrollmentNo: String,
    semester: String,
    course: String,
    isRunning: Boolean,
    status: String,
    attendanceSession: {
        sessionStartTime: Date,
        isPaused: Boolean,
        pauseReason: String,
        totalAttendedSeconds: Number,
        pausedDuration: Number,
        lastPauseTime: Date
    },
    lastUpdated: Date
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

async function stopStudentTimer() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find and stop AADESH CHOUKSEY's timer
        const result = await StudentManagement.findOneAndUpdate(
            { name: 'AADESH CHOUKSEY' },
            { 
                isRunning: false,
                status: 'present',
                lastUpdated: new Date()
            },
            { new: true }
        );

        if (result) {
            console.log('✅ Successfully stopped timer for AADESH CHOUKSEY');
            console.log('Updated record:', {
                name: result.name,
                enrollmentNo: result.enrollmentNo,
                isRunning: result.isRunning,
                status: result.status
            });
        } else {
            console.log('❌ Student AADESH CHOUKSEY not found');
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

stopStudentTimer();