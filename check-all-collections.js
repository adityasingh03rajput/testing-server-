const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

async function checkAllCollections() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Get database
        const db = mongoose.connection.db;
        
        // List all collections
        console.log('\n📋 Listing all collections...');
        const collections = await db.listCollections().toArray();
        
        console.log(`\n📊 Total Collections Found: ${collections.length}`);
        
        if (collections.length === 0) {
            console.log('❌ No collections found in the database');
            return;
        }

        console.log('\n📁 Collections:');
        for (let i = 0; i < collections.length; i++) {
            const collection = collections[i];
            const count = await db.collection(collection.name).countDocuments();
            console.log(`${i + 1}. ${collection.name} (${count} documents)`);
        }

        // Check for teacher-related collections
        console.log('\n👥 Checking for teacher data...');
        const teacherCollections = collections.filter(c => 
            c.name.toLowerCase().includes('teacher') || 
            c.name.toLowerCase().includes('faculty') ||
            c.name.toLowerCase().includes('staff')
        );

        if (teacherCollections.length > 0) {
            console.log('\n🎯 Found teacher-related collections:');
            for (const collection of teacherCollections) {
                const count = await db.collection(collection.name).countDocuments();
                console.log(`• ${collection.name}: ${count} documents`);
                
                if (count > 0) {
                    console.log(`\n📄 Sample document from ${collection.name}:`);
                    const sample = await db.collection(collection.name).findOne();
                    console.log(JSON.stringify(sample, null, 2));
                }
            }
        } else {
            console.log('❌ No teacher-related collections found');
            
            // Check all collections for teacher-like documents
            console.log('\n🔍 Searching all collections for teacher-like documents...');
            for (const collection of collections) {
                if (collection.name === 'system.indexes') continue;
                
                const teacherDoc = await db.collection(collection.name).findOne({
                    $or: [
                        { employeeId: { $exists: true } },
                        { department: { $exists: true } },
                        { subject: { $exists: true } },
                        { canEditTimetable: { $exists: true } }
                    ]
                });
                
                if (teacherDoc) {
                    console.log(`🎯 Found teacher-like document in ${collection.name}:`);
                    console.log(JSON.stringify(teacherDoc, null, 2));
                }
            }
        }

    } catch (error) {
        console.error('❌ Error checking collections:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkAllCollections();