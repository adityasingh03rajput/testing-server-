// MongoDB Diagnostic and Fix Script for Production Issues
// Addresses the student list timeout issue in admin panel

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://letsbunk:letsbunk@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

// Define schemas to match server.js
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

async function runDiagnostic() {
    console.log('🔍 MongoDB Production Diagnostic Starting...\n');
    
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

        const Student = mongoose.model('Student', StudentSchema);
        const StudentManagement = mongoose.model('StudentManagement', StudentManagementSchema);

        // 1. Check collection sizes and indexes
        console.log('📊 COLLECTION ANALYSIS:');
        console.log('========================');
        
        const studentsCount = await Student.countDocuments();
        const studentMgmtCount = await StudentManagement.countDocuments();
        
        console.log(`📋 Students Collection: ${studentsCount} documents`);
        console.log(`📋 StudentManagement Collection: ${studentMgmtCount} documents`);
        
        // 2. Check indexes
        console.log('\n🔍 INDEX ANALYSIS:');
        console.log('==================');
        
        const studentIndexes = await Student.collection.getIndexes();
        const studentMgmtIndexes = await StudentManagement.collection.getIndexes();
        
        console.log('📋 Students Indexes:', Object.keys(studentIndexes));
        console.log('📋 StudentManagement Indexes:', Object.keys(studentMgmtIndexes));
        
        // 3. Performance test queries
        console.log('\n⚡ PERFORMANCE TESTING:');
        console.log('======================');
        
        // Test Students query performance
        console.log('🔄 Testing Students.find() performance...');
        const studentsStart = Date.now();
        try {
            const studentsResult = await Student.find().limit(10).lean().maxTimeMS(5000);
            const studentsTime = Date.now() - studentsStart;
            console.log(`✅ Students query: ${studentsTime}ms (${studentsResult.length} docs)`);
        } catch (error) {
            console.log(`❌ Students query failed: ${error.message}`);
        }
        
        // Test StudentManagement query performance
        console.log('🔄 Testing StudentManagement.find() performance...');
        const mgmtStart = Date.now();
        try {
            const mgmtResult = await StudentManagement.find().limit(10).lean().maxTimeMS(5000);
            const mgmtTime = Date.now() - mgmtStart;
            console.log(`✅ StudentManagement query: ${mgmtTime}ms (${mgmtResult.length} docs)`);
        } catch (error) {
            console.log(`❌ StudentManagement query failed: ${error.message}`);
        }
        
        // 4. Check for data inconsistencies
        console.log('\n🔍 DATA CONSISTENCY CHECK:');
        console.log('==========================');
        
        if (studentsCount > 0) {
            const sampleStudent = await Student.findOne().lean();
            console.log('📋 Sample Student document structure:');
            console.log(JSON.stringify(sampleStudent, null, 2));
        }
        
        if (studentMgmtCount > 0) {
            const sampleMgmt = await StudentManagement.findOne().lean();
            console.log('📋 Sample StudentManagement document structure:');
            console.log(JSON.stringify(sampleMgmt, null, 2));
        }
        
        // 5. Recommendations
        console.log('\n💡 DIAGNOSTIC RESULTS & RECOMMENDATIONS:');
        console.log('========================================');
        
        if (studentsCount === 0 && studentMgmtCount > 0) {
            console.log('🎯 ISSUE IDENTIFIED: Empty Students collection, data in StudentManagement');
            console.log('📝 SOLUTION: Admin panel should use StudentManagement collection');
            console.log('🔧 ACTION: Update server.js /api/students endpoint to use StudentManagement model');
        } else if (studentsCount > 0 && studentMgmtCount === 0) {
            console.log('🎯 ISSUE IDENTIFIED: Data in Students collection, empty StudentManagement');
            console.log('📝 SOLUTION: Migrate data from Students to StudentManagement');
        } else if (studentsCount === 0 && studentMgmtCount === 0) {
            console.log('🎯 ISSUE IDENTIFIED: Both collections are empty');
            console.log('📝 SOLUTION: Import student data or create test data');
        } else {
            console.log('🎯 ISSUE IDENTIFIED: Data exists in both collections');
            console.log('📝 SOLUTION: Consolidate data and ensure consistency');
        }
        
        // 6. Create optimized indexes if needed
        console.log('\n🔧 CREATING OPTIMIZED INDEXES:');
        console.log('==============================');
        
        try {
            // Create indexes for better performance
            await StudentManagement.collection.createIndex({ enrollmentNo: 1 }, { unique: true });
            await StudentManagement.collection.createIndex({ semester: 1, course: 1 });
            await StudentManagement.collection.createIndex({ status: 1 });
            await StudentManagement.collection.createIndex({ createdAt: -1 });
            
            console.log('✅ Optimized indexes created for StudentManagement');
        } catch (error) {
            console.log(`⚠️ Index creation: ${error.message}`);
        }
        
        // 7. Test the fixed query
        console.log('\n🧪 TESTING OPTIMIZED QUERY:');
        console.log('===========================');
        
        const optimizedStart = Date.now();
        try {
            const optimizedResult = await StudentManagement.find()
                .select('enrollmentNo name email course semester status createdAt')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean()
                .maxTimeMS(10000);
            
            const optimizedTime = Date.now() - optimizedStart;
            console.log(`✅ Optimized query: ${optimizedTime}ms (${optimizedResult.length} docs)`);
            
            if (optimizedResult.length > 0) {
                console.log('📋 Sample result:');
                console.log(JSON.stringify(optimizedResult[0], null, 2));
            }
        } catch (error) {
            console.log(`❌ Optimized query failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
}

// Run diagnostic
runDiagnostic().catch(console.error);