// Complete MongoDB Database Checker - Analyze all collections and data
const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

async function checkCompleteDatabase() {
    try {
        console.log('🔍 COMPLETE MONGODB DATABASE ANALYSIS');
        console.log('='.repeat(60));
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Connected to MongoDB Atlas');
        
        // Get database instance
        const db = mongoose.connection.db;
        
        // List all collections
        console.log('\n📋 LISTING ALL COLLECTIONS:');
        console.log('-'.repeat(40));
        const collections = await db.listCollections().toArray();
        
        if (collections.length === 0) {
            console.log('❌ No collections found in database!');
            return;
        }
        
        console.log(`Found ${collections.length} collections:`);
        collections.forEach((collection, index) => {
            console.log(`${index + 1}. ${collection.name}`);
        });
        
        // Analyze each collection
        console.log('\n📊 COLLECTION ANALYSIS:');
        console.log('='.repeat(60));
        
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`\n📁 Collection: ${collectionName}`);
            console.log('-'.repeat(30));
            
            try {
                // Get document count
                const count = await db.collection(collectionName).countDocuments();
                console.log(`📊 Document Count: ${count}`);
                
                if (count > 0) {
                    // Get sample documents
                    const sampleDocs = await db.collection(collectionName)
                        .find({})
                        .limit(3)
                        .toArray();
                    
                    console.log('📄 Sample Documents:');
                    sampleDocs.forEach((doc, index) => {
                        console.log(`   ${index + 1}. ID: ${doc._id}`);
                        
                        // Show key fields based on collection type
                        if (collectionName.toLowerCase().includes('student')) {
                            console.log(`      Name: ${doc.name || 'N/A'}`);
                            console.log(`      Enrollment: ${doc.enrollmentNo || 'N/A'}`);
                            console.log(`      Course: ${doc.course || 'N/A'}`);
                            console.log(`      Semester: ${doc.semester || 'N/A'}`);
                            console.log(`      Status: ${doc.status || 'N/A'}`);
                            console.log(`      Running: ${doc.isRunning || false}`);
                        } else if (collectionName.toLowerCase().includes('teacher')) {
                            console.log(`      Name: ${doc.name || 'N/A'}`);
                            console.log(`      Employee ID: ${doc.employeeId || 'N/A'}`);
                            console.log(`      Department: ${doc.department || 'N/A'}`);
                        } else if (collectionName.toLowerCase().includes('classroom')) {
                            console.log(`      Room: ${doc.roomNumber || 'N/A'}`);
                            console.log(`      Building: ${doc.building || 'N/A'}`);
                            console.log(`      BSSID: ${doc.bssid || 'N/A'}`);
                        } else {
                            // Show first few fields for other collections
                            const keys = Object.keys(doc).filter(key => key !== '_id').slice(0, 3);
                            keys.forEach(key => {
                                let value = doc[key];
                                if (typeof value === 'object' && value !== null) {
                                    value = '[Object]';
                                } else if (typeof value === 'string' && value.length > 50) {
                                    value = value.substring(0, 50) + '...';
                                }
                                console.log(`      ${key}: ${value}`);
                            });
                        }
                        console.log('');
                    });
                    
                    // Get indexes
                    const indexes = await db.collection(collectionName).indexes();
                    if (indexes.length > 1) { // More than just _id index
                        console.log('🔍 Indexes:');
                        indexes.forEach(index => {
                            if (index.name !== '_id_') {
                                console.log(`   • ${index.name}: ${JSON.stringify(index.key)}`);
                            }
                        });
                    }
                } else {
                    console.log('📄 Collection is empty');
                }
                
            } catch (error) {
                console.log(`❌ Error analyzing collection: ${error.message}`);
            }
        }
        
        // Specific analysis for StudentManagement collection
        console.log('\n🎓 DETAILED STUDENTMANAGEMENT ANALYSIS:');
        console.log('='.repeat(60));
        
        const studentMgmtCollection = db.collection('studentmanagements');
        const studentCount = await studentMgmtCollection.countDocuments();
        
        if (studentCount > 0) {
            console.log(`📊 Total Students: ${studentCount}`);
            
            // Course distribution
            const courseStats = await studentMgmtCollection.aggregate([
                { $group: { _id: '$course', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]).toArray();
            
            console.log('\n📊 Course Distribution:');
            courseStats.forEach(stat => {
                console.log(`   ${stat._id}: ${stat.count} students`);
            });
            
            // Semester distribution
            const semesterStats = await studentMgmtCollection.aggregate([
                { $group: { _id: '$semester', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray();
            
            console.log('\n📊 Semester Distribution:');
            semesterStats.forEach(stat => {
                console.log(`   Semester ${stat._id}: ${stat.count} students`);
            });
            
            // Status distribution
            const statusStats = await studentMgmtCollection.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]).toArray();
            
            console.log('\n📊 Status Distribution:');
            statusStats.forEach(stat => {
                console.log(`   ${stat._id}: ${stat.count} students`);
            });
            
            // Active sessions
            const activeCount = await studentMgmtCollection.countDocuments({ isRunning: true });
            console.log(`\n🟢 Active Sessions: ${activeCount} students`);
            
            // Recent students
            const recentStudents = await studentMgmtCollection
                .find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .toArray();
            
            console.log('\n👥 Recent Students:');
            recentStudents.forEach((student, index) => {
                console.log(`   ${index + 1}. ${student.name} (${student.enrollmentNo}) - ${student.course} - Sem ${student.semester}`);
            });
            
        } else {
            console.log('❌ No students found in StudentManagement collection');
        }
        
        // Database statistics
        console.log('\n📈 DATABASE STATISTICS:');
        console.log('='.repeat(40));
        const stats = await db.stats();
        console.log(`📦 Database Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📄 Total Documents: ${stats.objects}`);
        console.log(`🗂️ Total Collections: ${stats.collections}`);
        console.log(`📊 Average Document Size: ${(stats.avgObjSize / 1024).toFixed(2)} KB`);
        
        // Connection info
        console.log('\n🔗 CONNECTION INFO:');
        console.log('='.repeat(30));
        console.log(`📍 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
        console.log(`🔌 Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        
        await mongoose.disconnect();
        console.log('\n✅ Database analysis complete');
        
    } catch (error) {
        console.error('❌ Database analysis failed:', error);
        if (error.message.includes('Authentication failed')) {
            console.log('\n🔑 Authentication Error - Check MongoDB credentials');
        } else if (error.message.includes('network')) {
            console.log('\n🌐 Network Error - Check internet connection');
        }
    }
}

// Run the checker
checkCompleteDatabase();