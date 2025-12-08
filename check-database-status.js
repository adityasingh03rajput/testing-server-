// Check MongoDB Database Status
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDatabaseStatus() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        
        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log('📊 DATABASE STATUS');
        console.log('==================\n');
        
        let totalDocuments = 0;
        
        for (const collection of collections) {
            const collectionName = collection.name;
            const count = await db.collection(collectionName).countDocuments();
            totalDocuments += count;
            
            const icon = count > 0 ? '📦' : '⚪';
            console.log(`${icon} ${collectionName.padEnd(30)} ${count.toString().padStart(6)} documents`);
        }
        
        console.log('\n==================');
        console.log(`📊 Total Collections: ${collections.length}`);
        console.log(`📄 Total Documents: ${totalDocuments}`);
        console.log('==================\n');
        
        // Get sample data from key collections
        const keyCollections = ['studentmanagements', 'teachers', 'attendancerecords', 'timetables'];
        
        for (const collName of keyCollections) {
            const exists = collections.find(c => c.name === collName);
            if (exists) {
                const count = await db.collection(collName).countDocuments();
                if (count > 0) {
                    console.log(`\n📋 Sample from "${collName}":`);
                    const sample = await db.collection(collName).findOne();
                    if (sample) {
                        const keys = Object.keys(sample).filter(k => k !== '_id' && k !== '__v');
                        console.log(`   Fields: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
                    }
                }
            }
        }
        
        await mongoose.connection.close();
        console.log('\n✅ Check complete\n');
        
    } catch (error) {
        console.error('❌ Error checking database:', error);
        process.exit(1);
    }
}

checkDatabaseStatus();
