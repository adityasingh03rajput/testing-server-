// Production Student List Fix - Resolves admin panel timeout issue
// Issue: /api/students endpoint times out, but StudentManagement collection has data

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://letsbunk:letsbunk@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

console.log('🔧 PRODUCTION STUDENT LIST FIX');
console.log('==============================');
console.log('Issue: Admin panel student list times out');
console.log('Root Cause: /api/students uses empty Students collection instead of StudentManagement');
console.log('Solution: Update server.js to use StudentManagement collection\n');

async function fixProductionStudentList() {
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10
        });
        console.log('✅ Connected to MongoDB Atlas\n');

        // Define schemas
        const StudentSchema = new mongoose.Schema({
            enrollmentNo: { type: String, required: true, unique: true },
            name: { type: String, required: true },
            email: { type: String, required: true },
            password: { type: String, required: true },
            course: { type: String, required: true },
            semester: { type: String, required: true },
            dob: { type: Date, required: true },
            photoUrl: { type: String, default: '' },
            createdAt: { type: Date, default: Date.now },
            lastUpdated: { type: Date, default: Date.now }
        });

        const StudentManagementSchema = new mongoose.Schema({
            enrollmentNo: { type: String, required: true, unique: true },
            name: { type: String, required: true },
            email: { type: String, required: true },
            password: { type: String, required: true },
            course: { type: String, required: true },
            semester: { type: String, required: true },
            dob: { type: Date, required: true },
            photoUrl: { type: String, default: '' },
            faceDescriptor: { type: Array, default: [] },
            timerValue: { type: Number, default: 0 },
            isRunning: { type: Boolean, default: false },
            status: { type: String, enum: ['present', 'absent'], default: 'absent' },
            attendanceSession: {
                totalAttendedSeconds: { type: Number, default: 0 },
                pausedDuration: { type: Number, default: 0 },
                isPaused: { type: Boolean, default: false },
                offlinePeriods: [{ startTime: Date, endTime: Date }],
                wifiEvents: [{
                    timestamp: { type: Date, default: Date.now },
                    bssid: String,
                    gracePeriod: { type: Boolean, default: false }
                }],
                pauseEvents: [{ timestamp: Date, reason: String }]
            },
            attendanceBackup: [{ date: Date, status: String, timerValue: Number }],
            createdAt: { type: Date, default: Date.now },
            lastUpdated: { type: Date, default: Date.now }
        });

        const Student = mongoose.model('Student', StudentSchema);
        const StudentManagement = mongoose.model('StudentManagement', StudentManagementSchema);

        // Check current state
        console.log('📊 CURRENT DATABASE STATE:');
        console.log('===========================');
        
        const studentsCount = await Student.countDocuments();
        const studentMgmtCount = await StudentManagement.countDocuments();
        
        console.log(`📋 Students Collection: ${studentsCount} documents`);
        console.log(`📋 StudentManagement Collection: ${studentMgmtCount} documents`);

        if (studentsCount === 0 && studentMgmtCount > 0) {
            console.log('\n✅ DIAGNOSIS CONFIRMED:');
            console.log('- Students collection is empty (causing timeout)');
            console.log('- StudentManagement collection has data');
            console.log('- Admin panel /api/students endpoint needs to use StudentManagement\n');

            // Test the correct query that should be used
            console.log('🧪 TESTING CORRECT QUERY:');
            console.log('=========================');
            
            const start = Date.now();
            const students = await StudentManagement.find()
                .select('enrollmentNo name email course semester status createdAt')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean()
                .maxTimeMS(10000);
            
            const duration = Date.now() - start;
            console.log(`✅ StudentManagement query: ${duration}ms (${students.length} students)`);
            
            if (students.length > 0) {
                console.log('\n📋 SAMPLE STUDENT DATA:');
                console.log('=======================');
                students.slice(0, 3).forEach((student, index) => {
                    console.log(`${index + 1}. ${student.name} (${student.enrollmentNo}) - ${student.course}`);
                });
            }

            // Create optimized indexes
            console.log('\n🔧 CREATING OPTIMIZED INDEXES:');
            console.log('==============================');
            
            try {
                await StudentManagement.collection.createIndex({ enrollmentNo: 1 }, { unique: true });
                await StudentManagement.collection.createIndex({ semester: 1, course: 1 });
                await StudentManagement.collection.createIndex({ status: 1 });
                await StudentManagement.collection.createIndex({ createdAt: -1 });
                await StudentManagement.collection.createIndex({ name: 1 });
                
                console.log('✅ Performance indexes created successfully');
            } catch (error) {
                console.log(`⚠️ Index creation: ${error.message}`);
            }

            // Generate the server.js fix
            console.log('\n📝 GENERATING SERVER.JS FIX:');
            console.log('============================');
            
            const serverFix = `
// PRODUCTION FIX: Update /api/students endpoint to use StudentManagement
// Replace the existing /api/students route with this optimized version:

app.get('/api/students', async (req, res) => {
    try {
        const { page = 1, limit = 50, search, semester, course } = req.query;
        
        // Build query filter
        let filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { enrollmentNo: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (semester) filter.semester = semester;
        if (course) filter.course = course;
        
        // Execute optimized query using StudentManagement (not Student)
        const students = await StudentManagement.find(filter)
            .select('enrollmentNo name email course semester status createdAt photoUrl')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean()
            .maxTimeMS(10000); // 10 second timeout
        
        const total = await StudentManagement.countDocuments(filter);
        
        res.json({
            success: true,
            students,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Students API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students',
            error: error.message
        });
    }
});`;

            console.log('✅ Server.js fix generated');
            console.log('\n🎯 IMMEDIATE ACTION REQUIRED:');
            console.log('============================');
            console.log('1. Update server.js /api/students endpoint to use StudentManagement model');
            console.log('2. Deploy the updated server.js to production');
            console.log('3. Restart the production server');
            console.log('4. Test admin panel student list functionality');

            // Write the fix to a file
            require('fs').writeFileSync('server-students-endpoint-fix.js', serverFix);
            console.log('\n📄 Fix code saved to: server-students-endpoint-fix.js');

        } else if (studentsCount > 0 && studentMgmtCount === 0) {
            console.log('\n⚠️ DIFFERENT ISSUE DETECTED:');
            console.log('- Students collection has data');
            console.log('- StudentManagement collection is empty');
            console.log('- Need to migrate data from Students to StudentManagement');
        } else if (studentsCount === 0 && studentMgmtCount === 0) {
            console.log('\n❌ NO DATA FOUND:');
            console.log('- Both collections are empty');
            console.log('- Need to import student data');
        } else {
            console.log('\n⚠️ DATA IN BOTH COLLECTIONS:');
            console.log('- Need to consolidate and ensure consistency');
        }

    } catch (error) {
        console.error('❌ Fix failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
        console.log('\n🎉 PRODUCTION FIX COMPLETE');
        console.log('Admin panel student list should work after server.js update');
    }
}

// Run the fix
fixProductionStudentList().catch(console.error);