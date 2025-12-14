// Reset MongoDB Database - Clear all data but keep schemas
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function resetDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        
        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log(`📋 Found ${collections.length} collections:\n`);
        
        // Delete all documents from each collection
        for (const collection of collections) {
            const collectionName = collection.name;
            const count = await db.collection(collectionName).countDocuments();
            
            if (count > 0) {
                console.log(`   🗑️  Deleting ${count} documents from "${collectionName}"...`);
                await db.collection(collectionName).deleteMany({});
                console.log(`   ✅ Cleared "${collectionName}"`);
            } else {
                console.log(`   ⚪ "${collectionName}" is already empty`);
            }
        }
        
        console.log('\n✅ Database reset complete!');
        console.log('📊 All data has been deleted');
        console.log('🏗️  All schemas/collections remain intact');
        console.log('\n📝 Summary:');
        console.log(`   - Collections: ${collections.length}`);
        console.log(`   - All documents deleted`);
        console.log(`   - Schemas preserved`);
        
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL data from the database!');
console.log('📋 Collections that will be cleared:');
console.log('   - Students');
console.log('   - Teachers');
console.log('   - Attendance Records');
console.log('   - Attendance History');
console.log('   - Timetables');
console.log('   - Classrooms');
console.log('   - Holidays');
console.log('   - And all other collections');
console.log('\n🏗️  Schemas will be preserved (collections will remain)');
console.log('\nStarting in 3 seconds...\n');

setTimeout(() => {
    resetDatabase();
}, 3000);
