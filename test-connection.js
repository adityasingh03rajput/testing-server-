const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';

console.log('🔍 Testing MongoDB Connection...');
console.log('📍 URI:', MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // Test creating a simple document
    const TestSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', TestSchema);
    
    return TestModel.create({ test: 'Connection test successful!' });
})
.then((doc) => {
    console.log('✅ Test document created:', doc._id);
    console.log('🎉 MongoDB Atlas is working perfectly!');
    process.exit(0);
})
.catch((err) => {
    console.error('❌ Connection failed!');
    console.error('Error:', err.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if MONGODB_URI is set in .env file');
    console.log('2. Verify username and password are correct');
    console.log('3. Make sure your IP is whitelisted in MongoDB Atlas');
    console.log('4. Check if cluster is running in MongoDB Atlas dashboard');
    console.log('\n📖 See MONGODB_ATLAS_SETUP.md for detailed instructions');
    process.exit(1);
});
