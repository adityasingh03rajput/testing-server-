require('dotenv').config();
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({}, { strict: false });
const StudentManagement = mongoose.model('StudentManagement', studentSchema, 'student_management');

async function main() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find student with name containing "Aditya"
        const students = await StudentManagement.find({ 
            name: /Aditya/i 
        }).limit(5);

        console.log(`Found ${students.length} students:`);
        students.forEach((s, i) => {
            console.log(`\n${i + 1}. ${s.name}`);
            console.log(`   ID: ${s._id}`);
            console.log(`   Enrollment: ${s.enrollmentNo}`);
            console.log(`   Semester: ${s.semester}`);
            console.log(`   Course: ${s.course}`);
            console.log(`   Status: ${s.status}`);
            console.log(`   Is Running: ${s.isRunning}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

main();
