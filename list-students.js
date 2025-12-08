require('dotenv').config();
const mongoose = require('mongoose');

const studentManagementSchema = new mongoose.Schema({
    name: String,
    fatherName: String,
    enrollmentNumber: String,
    course: String,
    semester: String,
    email: String,
    phone: String,
    password: String,
    profilePhoto: String
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

async function listStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        const students = await StudentManagement.find({})
            .select('name enrollmentNumber course semester')
            .sort({ enrollmentNumber: 1 });
        
        console.log(`📋 Total Students: ${students.length}\n`);
        console.log('Enrollment Number | Name');
        console.log('='.repeat(60));
        
        students.forEach(student => {
            console.log(`${student.enrollmentNumber} | ${student.name}`);
        });
        
        await mongoose.connection.close();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listStudents();
