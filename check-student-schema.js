// Check actual student document structure
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkSchema() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected to MongoDB\n');

        // Get raw document
        const db = mongoose.connection.db;
        const collection = db.collection('studentmanagements');
        
        const student = await collection.findOne({});
        
        if (student) {
            console.log('📄 Sample Student Document Structure:');
            console.log('═'.repeat(80));
            console.log(JSON.stringify(student, null, 2));
            console.log('═'.repeat(80));
            
            console.log('\n🔑 Available Fields:');
            Object.keys(student).forEach(key => {
                console.log(`  - ${key}: ${typeof student[key]}`);
            });
        } else {
            console.log('❌ No students found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

checkSchema();
