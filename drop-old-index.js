require('dotenv').config();
const mongoose = require('mongoose');

async function dropOldIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const db = mongoose.connection.db;
        const collection = db.collection('studentmanagements');
        
        // List all indexes
        const indexes = await collection.indexes();
        console.log('📋 Current indexes:');
        indexes.forEach(idx => console.log(`   - ${idx.name}:`, JSON.stringify(idx.key)));
        
        // Drop the old enrollmentNo index if it exists
        try {
            await collection.dropIndex('enrollmentNo_1');
            console.log('\n✅ Dropped old enrollmentNo_1 index');
        } catch (err) {
            console.log('\n⚠️  enrollmentNo_1 index not found or already dropped');
        }
        
        // List indexes after drop
        const indexesAfter = await collection.indexes();
        console.log('\n📋 Indexes after drop:');
        indexesAfter.forEach(idx => console.log(`   - ${idx.name}:`, JSON.stringify(idx.key)));
        
        await mongoose.connection.close();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

dropOldIndex();
