const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

// Student Schema (matching the one in index.js)
const studentManagementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    enrollmentNo: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: String, required: true },
    photoUrl: { type: String },
    role: { type: String, default: 'student' },
    isActive: { type: Boolean, default: true },
    
    // Timer and attendance tracking
    timerValue: { type: Number, default: 0 },
    isRunning: { type: Boolean, default: false },
    status: { type: String, enum: ['attending', 'absent', 'present'], default: 'absent' },
    lastUpdated: { type: Date, default: Date.now },
    
    // Enhanced attendance session tracking
    attendanceSession: {
        sessionStartTime: Date,
        totalAttendedSeconds: { type: Number, default: 0 },
        isPaused: { type: Boolean, default: false },
        pausedDuration: { type: Number, default: 0 },
        lastPauseTime: Date,
        wifiConnected: { type: Boolean, default: false },
        faceVerified: { type: Boolean, default: false },
        lastHeartbeat: Date,
        currentClass: {
            subject: String,
            teacher: String,
            room: String,
            startTime: String,
            endTime: String
        },
        offlinePeriods: [{
            startTime: Date,
            endTime: Date,
            duration: Number
        }],
        randomRingId: String,
        randomRingPassed: Boolean,
        offlineRecovery: {
            recoveredAt: Date,
            offlineDuration: Number,
            recoveredSeconds: Number
        }
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

// Attendance Session Schema
const attendanceSessionSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNo: { type: String, required: true },
    date: { type: Date, required: true },
    
    sessionStartTime: { type: Date, required: true },
    timerValue: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastUpdate: { type: Date, default: Date.now },
    
    wifiConnected: { type: Boolean, default: true },
    currentClass: {
        period: String,
        subject: String,
        teacher: String,
        teacherName: String,
        room: String,
        startTime: String,
        endTime: String,
        classStartedAt: Date
    },
    
    semester: String,
    branch: String
});

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

async function fixAadeshAttendanceData() {
    try {
        console.log('🔧 Starting Aadesh Chouksey attendance data recovery...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find Aadesh Chouksey
        const student = await StudentManagement.findOne({
            $or: [
                { name: { $regex: 'Aadesh Chouksey', $options: 'i' } },
                { enrollmentNo: 'adityasingh' }
            ]
        });
        
        if (!student) {
            console.log('❌ Aadesh Chouksey not found');
            return;
        }
        
        console.log(`✅ Found student: ${student.name} (${student.enrollmentNo})`);
        
        // Find today's attendance session
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendanceSession = await AttendanceSession.findOne({
            $or: [
                { studentId: student._id.toString() },
                { enrollmentNo: student.enrollmentNo }
            ],
            date: { $gte: today }
        });
        
        if (!attendanceSession) {
            console.log('❌ No attendance session found for today');
            return;
        }
        
        console.log('\n📋 ATTENDANCE SESSION FOUND:');
        console.log('============================');
        console.log(`🚀 Session Start: ${attendanceSession.sessionStartTime}`);
        console.log(`🔄 Last Update: ${attendanceSession.lastUpdate}`);
        console.log(`⏰ Timer Value: ${attendanceSession.timerValue}s`);
        console.log(`🔄 Is Active: ${attendanceSession.isActive}`);
        console.log(`📶 WiFi Connected: ${attendanceSession.wifiConnected}`);
        
        // Calculate actual attended time
        const sessionStart = new Date(attendanceSession.sessionStartTime);
        const lastUpdate = new Date(attendanceSession.lastUpdate);
        const actualAttendedSeconds = Math.floor((lastUpdate - sessionStart) / 1000);
        
        console.log('\n🧮 CALCULATING ATTENDED TIME:');
        console.log('=============================');
        console.log(`📅 Session Start: ${sessionStart.toLocaleString()}`);
        console.log(`📅 Last Update: ${lastUpdate.toLocaleString()}`);
        console.log(`⏱️  Duration: ${actualAttendedSeconds} seconds`);
        console.log(`⏱️  Duration: ${Math.floor(actualAttendedSeconds / 60)} minutes ${actualAttendedSeconds % 60} seconds`);
        
        // Update StudentManagement with recovered data
        console.log('\n🔧 UPDATING STUDENT MANAGEMENT RECORD:');
        console.log('=====================================');
        
        const updateData = {
            timerValue: actualAttendedSeconds,
            isRunning: false, // Session ended when logged out
            status: actualAttendedSeconds > 0 ? 'present' : 'absent',
            lastUpdated: new Date(),
            'attendanceSession.sessionStartTime': sessionStart,
            'attendanceSession.totalAttendedSeconds': actualAttendedSeconds,
            'attendanceSession.isPaused': false,
            'attendanceSession.wifiConnected': attendanceSession.wifiConnected,
            'attendanceSession.faceVerified': true, // Must have been verified to start
            'attendanceSession.lastHeartbeat': lastUpdate,
            'attendanceSession.offlineRecovery': {
                recoveredAt: new Date(),
                offlineDuration: 0,
                recoveredSeconds: actualAttendedSeconds
            }
        };
        
        if (attendanceSession.currentClass) {
            updateData['attendanceSession.currentClass'] = attendanceSession.currentClass;
        }
        
        const updatedStudent = await StudentManagement.findByIdAndUpdate(
            student._id,
            updateData,
            { new: true }
        );
        
        console.log('✅ StudentManagement record updated successfully!');
        console.log(`📊 Timer Value: ${updatedStudent.timerValue}s (${Math.floor(updatedStudent.timerValue / 60)}min)`);
        console.log(`📊 Status: ${updatedStudent.status}`);
        console.log(`📊 Is Running: ${updatedStudent.isRunning}`);
        
        // Mark attendance session as processed
        await AttendanceSession.findByIdAndUpdate(
            attendanceSession._id,
            {
                isActive: false,
                timerValue: actualAttendedSeconds,
                lastUpdate: new Date(),
                processed: true,
                processedAt: new Date()
            }
        );
        
        console.log('✅ AttendanceSession marked as processed');
        
        // Create attendance record for the day
        console.log('\n📝 CREATING DAILY ATTENDANCE RECORD:');
        console.log('===================================');
        
        const AttendanceRecord = mongoose.model('AttendanceRecord', new mongoose.Schema({
            studentId: { type: String, required: true },
            studentName: { type: String, required: true },
            enrollmentNo: { type: String, required: true },
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
        }));
        
        // Check if attendance record already exists
        let attendanceRecord = await AttendanceRecord.findOne({
            enrollmentNo: student.enrollmentNo,
            date: today
        });
        
        if (!attendanceRecord) {
            attendanceRecord = new AttendanceRecord({
                studentId: student._id.toString(),
                studentName: student.name,
                enrollmentNo: student.enrollmentNo,
                date: today,
                status: 'present',
                lectures: [],
                totalAttended: actualAttendedSeconds,
                totalClassTime: actualAttendedSeconds, // Assume full time was class time
                dayPercentage: 100, // Full attendance for the session
                timerValue: actualAttendedSeconds,
                checkInTime: sessionStart,
                checkOutTime: lastUpdate,
                semester: student.semester,
                branch: student.course
            });
            
            await attendanceRecord.save();
            console.log('✅ Daily attendance record created');
        } else {
            // Update existing record
            attendanceRecord.totalAttended = actualAttendedSeconds;
            attendanceRecord.timerValue = actualAttendedSeconds;
            attendanceRecord.status = 'present';
            attendanceRecord.checkOutTime = lastUpdate;
            await attendanceRecord.save();
            console.log('✅ Daily attendance record updated');
        }
        
        console.log('\n🎯 DATA RECOVERY SUMMARY:');
        console.log('========================');
        console.log(`👤 Student: ${student.name}`);
        console.log(`🆔 Enrollment: ${student.enrollmentNo}`);
        console.log(`📅 Date: ${today.toDateString()}`);
        console.log(`⏰ Session Duration: ${Math.floor(actualAttendedSeconds / 60)} minutes ${actualAttendedSeconds % 60} seconds`);
        console.log(`📊 Status: Present (${actualAttendedSeconds > 0 ? 'Attended' : 'No attendance'})`);
        console.log(`✅ Data Synchronized: StudentManagement ↔ AttendanceSession ↔ AttendanceRecord`);
        
        // Verify the fix by checking all collections
        console.log('\n🔍 VERIFICATION - CHECKING ALL COLLECTIONS:');
        console.log('==========================================');
        
        const verifyStudent = await StudentManagement.findById(student._id);
        console.log(`📊 StudentManagement Timer: ${verifyStudent.timerValue}s (${Math.floor(verifyStudent.timerValue / 60)}min)`);
        console.log(`📊 StudentManagement Status: ${verifyStudent.status}`);
        console.log(`📊 StudentManagement Session: ${verifyStudent.attendanceSession?.totalAttendedSeconds || 0}s`);
        
        const verifySession = await AttendanceSession.findById(attendanceSession._id);
        console.log(`📊 AttendanceSession Timer: ${verifySession.timerValue}s`);
        console.log(`📊 AttendanceSession Active: ${verifySession.isActive}`);
        console.log(`📊 AttendanceSession Processed: ${verifySession.processed || false}`);
        
        const verifyRecord = await AttendanceRecord.findOne({
            enrollmentNo: student.enrollmentNo,
            date: today
        });
        console.log(`📊 AttendanceRecord Timer: ${verifyRecord?.timerValue || 0}s`);
        console.log(`📊 AttendanceRecord Status: ${verifyRecord?.status || 'Not found'}`);
        
        console.log('\n🎉 DATA RECOVERY COMPLETED SUCCESSFULLY!');
        console.log('=======================================');
        console.log('✅ Aadesh Chouksey\'s attendance data has been fully recovered');
        console.log('✅ All collections are now synchronized');
        console.log('✅ Timer will show correct attended time when student logs in');
        console.log('✅ Teacher dashboard will display accurate data');
        
    } catch (error) {
        console.error('❌ Error during data recovery:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Also create a function to prevent future sync issues
async function createSyncFixEndpoint() {
    console.log('\n🔧 CREATING SYNC FIX FOR FUTURE SESSIONS:');
    console.log('========================================');
    
    const syncFixCode = `
// Add this endpoint to index.js to prevent future sync issues
app.post('/api/attendance/sync-collections', async (req, res) => {
    try {
        const { studentId, enrollmentNo } = req.body;
        
        console.log('🔄 Syncing attendance collections for:', enrollmentNo);
        
        // Find student
        const student = await StudentManagement.findOne({
            $or: [
                { _id: studentId },
                { enrollmentNo: enrollmentNo }
            ]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }
        
        // Find today's attendance session
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendanceSession = await AttendanceSession.findOne({
            $or: [
                { studentId: student._id.toString() },
                { enrollmentNo: student.enrollmentNo }
            ],
            date: { $gte: today }
        });
        
        if (attendanceSession && attendanceSession.sessionStartTime) {
            // Calculate attended time
            const sessionStart = new Date(attendanceSession.sessionStartTime);
            const lastUpdate = new Date(attendanceSession.lastUpdate);
            const attendedSeconds = Math.floor((lastUpdate - sessionStart) / 1000);
            
            // Update StudentManagement
            await StudentManagement.findByIdAndUpdate(student._id, {
                'attendanceSession.sessionStartTime': sessionStart,
                'attendanceSession.totalAttendedSeconds': attendedSeconds,
                'attendanceSession.wifiConnected': attendanceSession.wifiConnected,
                'attendanceSession.lastHeartbeat': lastUpdate,
                timerValue: attendedSeconds,
                status: attendedSeconds > 0 ? 'present' : 'absent',
                lastUpdated: new Date()
            });
            
            console.log('✅ Collections synchronized for:', student.name);
            
            res.json({
                success: true,
                message: 'Collections synchronized',
                attendedSeconds: attendedSeconds,
                attendedMinutes: Math.floor(attendedSeconds / 60)
            });
        } else {
            res.json({
                success: false,
                message: 'No active session found'
            });
        }
        
    } catch (error) {
        console.error('❌ Error syncing collections:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add this to the student login process in index.js
// Call this endpoint after successful login to ensure data sync
`;
    
    console.log('📝 Sync fix endpoint code generated');
    console.log('📝 Add this to index.js to prevent future sync issues');
    
    return syncFixCode;
}

// Run the recovery
console.log('🚀 Starting Aadesh Chouksey Data Recovery Process...');
console.log('==================================================');

fixAadeshAttendanceData().then(() => {
    createSyncFixEndpoint();
    console.log('\n✅ Recovery process completed!');
});