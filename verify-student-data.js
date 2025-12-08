require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityasingh03rajput:Aditya%402004@cluster0.mongodb.net/attendance_app?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    verifyData();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function verifyData() {
    try {
        const students = await mongoose.connection.db.collection('studentmanagements').find().limit(10).toArray();
        
        console.log('\n👨‍🎓 Sample Student Data:\n');
        console.log('='.repeat(100));
        
        students.forEach(student => {
            const dob = student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A';
            console.log(`Name: ${student.name.padEnd(30)} | Enrollment: ${student.enrollmentNo}`);
            console.log(`Email: ${student.email.padEnd(40)} | DOB: ${dob}`);
            console.log(`Course: ${student.course.padEnd(25)} | Semester: ${student.semester}`);
            console.log(`Father: ${student.fatherName || 'N/A'}`);
            console.log('-'.repeat(100));
        });
        
        console.log(`\n✅ Showing ${students.length} sample students with complete data\n`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
