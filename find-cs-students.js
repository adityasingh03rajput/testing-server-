const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const students = await db.collection('studentmanagements').find({ 
        enrollmentNo: { $regex: 'CS241', $options: 'i' } 
    }).limit(10).toArray();
    
    console.log('CS Students found:');
    students.forEach(s => console.log(`${s.enrollmentNo} - ${s.name} (${s.course})`));
    
    if (students.length === 0) {
        console.log('\nNo CS students found. Showing all students with "241":');
        const all = await db.collection('studentmanagements').find({ 
            enrollmentNo: { $regex: '241', $options: 'i' } 
        }).limit(20).toArray();
        all.forEach(s => console.log(`${s.enrollmentNo} - ${s.name} (${s.course})`));
    }
    
    process.exit(0);
});
