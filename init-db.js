const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

async function initializeDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB');

        // Create indexes for better performance
        const db = mongoose.connection.db;

        console.log('🔄 Creating indexes...');

        // Student Management indexes
        await db.collection('studentmanagements').createIndex({ enrollmentNo: 1 }, { unique: true });
        await db.collection('studentmanagements').createIndex({ email: 1 });
        await db.collection('studentmanagements').createIndex({ course: 1, semester: 1 });

        // Teacher indexes
        await db.collection('teachers').createIndex({ employeeId: 1 }, { unique: true });
        await db.collection('teachers').createIndex({ email: 1 });
        await db.collection('teachers').createIndex({ department: 1 });

        // Attendance Record indexes
        await db.collection('attendancerecords').createIndex({ studentId: 1, date: -1 });
        await db.collection('attendancerecords').createIndex({ date: -1 });
        await db.collection('attendancerecords').createIndex({ semester: 1, branch: 1 });

        // Timetable indexes
        await db.collection('timetables').createIndex({ semester: 1, branch: 1 }, { unique: true });

        // Classroom indexes
        await db.collection('classrooms').createIndex({ roomNumber: 1 }, { unique: true });
        await db.collection('classrooms').createIndex({ building: 1 });

        console.log('✅ Indexes created successfully');

        // Display collection stats
        console.log('\n📊 Database Statistics:');
        const collections = await db.listCollections().toArray();
        
        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            console.log(`   ${collection.name}: ${count} documents`);
        }

        console.log('\n✅ Database initialization complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

initializeDatabase();
