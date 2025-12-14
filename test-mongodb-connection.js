const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongoConnection() {
  console.log('🔗 Testing MongoDB Connection...');
  console.log('📍 URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');
  
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    console.log('⏳ Connecting to MongoDB...');
    await client.connect();
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test database access
    const db = client.db('attendance_app');
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Test a simple query
    const studentsCount = await db.collection('students').countDocuments();
    console.log(`👥 Students in database: ${studentsCount}`);
    
    await client.close();
    console.log('🔒 Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('   Full error:', error);
  }
}

testMongoConnection();