// Search for student by partial enrollment number
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const studentSchema = new mongoose.Schema({
    enrollmentNumber: String,
    name: String,
    email: String,
    branch: String,
    semester: String,
    photoUrl: String
});

const Student = mongoose.model('StudentManagement', studentSchema, 'studentmanagements');

async function searchStudent() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected to MongoDB\n');

        // Search for students with CS in enrollment number
        console.log('🔍 Searching for students with "CS241" in enrollment number...');
        const students = await Student.find({ 
            enrollmentNumber: { $regex: 'CS241', $options: 'i' }
        }).limit(20);

        if (students.length === 0) {
            console.log('❌ No students found with CS241 in enrollment number');
            
            // Try broader search
            console.log('\n🔍 Searching for students with "241" in enrollment number...');
            const students2 = await Student.find({ 
                enrollmentNumber: { $regex: '241', $options: 'i' }
            }).limit(20);
            
            if (students2.length > 0) {
                console.log(`✅ Found ${students2.length} students:\n`);
                students2.forEach((student, index) => {
                    console.log(`${index + 1}. ${student.enrollmentNumber} - ${student.name} (${student.branch})`);
                });
            } else {
                console.log('❌ No students found with 241 in enrollment number');
                
                // Show first 10 students
                console.log('\n📋 First 10 students in database:');
                const allStudents = await Student.find({}).limit(10);
                allStudents.forEach((student, index) => {
                    console.log(`${index + 1}. ${student.enrollmentNumber} - ${student.name} (${student.branch})`);
                });
            }
        } else {
            console.log(`✅ Found ${students.length} students:\n`);
            students.forEach((student, index) => {
                console.log(`${index + 1}. ${student.enrollmentNumber} - ${student.name} (${student.branch}, Sem ${student.semester})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

searchStudent();
