require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityasingh03rajput:Aditya%402004@cluster0.mongodb.net/attendance_app?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    verifyEmails();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function verifyEmails() {
    try {
        const students = await mongoose.connection.db.collection('studentmanagements').find().limit(10).toArray();
        
        console.log('\n📧 Sample Student Emails:\n');
        console.log('='.repeat(80));
        
        students.forEach(student => {
            console.log(`${student.name.padEnd(30)} | ${student.enrollmentNo.padEnd(15)} | ${student.email}`);
        });
        
        console.log('='.repeat(80));
        console.log(`\n✅ Showing ${students.length} sample students\n`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
