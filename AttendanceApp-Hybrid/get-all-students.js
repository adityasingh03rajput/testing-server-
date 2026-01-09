const mongoose = require('mongoose');

// Define StudentManagement schema
const StudentManagementSchema = new mongoose.Schema({}, { strict: false });
const StudentManagement = mongoose.model('StudentManagement', StudentManagementSchema);

async function getAllStudents() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk');
        console.log('🔗 Connected to MongoDB Atlas');
        
        // Get all students
        const students = await StudentManagement.find({})
            .select('enrollmentNo name email course semester status isRunning timerValue createdAt')
            .sort({ createdAt: -1 })
            .lean();
            
        console.log('\n📊 LETSBUNK STUDENT DATABASE - COMPLETE LIST');
        console.log('='.repeat(80));
        console.log(`📈 Total Students: ${students.length}`);
        console.log('='.repeat(80));
        
        // Group by semester and course
        const groupedStudents = {};
        students.forEach(student => {
            const key = `${student.course} - Semester ${student.semester}`;
            if (!groupedStudents[key]) {
                groupedStudents[key] = [];
            }
            groupedStudents[key].push(student);
        });
        
        // Display grouped results
        Object.keys(groupedStudents).forEach(group => {
            console.log(`\n🎓 ${group}`);
            console.log('-'.repeat(60));
            
            groupedStudents[group].forEach((student, index) => {
                const status = student.isRunning ? '🟢 ACTIVE' : 
                              student.status === 'present' ? '🔵 PRESENT' : 
                              student.status === 'absent' ? '🔴 ABSENT' : '⚪ UNKNOWN';
                              
                const timer = student.timerValue ? `(${Math.floor(student.timerValue/60)}m)` : '';
                
                console.log(`${index + 1}. ${student.name.padEnd(25)} | ${student.enrollmentNo.padEnd(15)} | ${status} ${timer}`);
            });
            
            console.log(`   📊 Count: ${groupedStudents[group].length} students`);
        });
        
        // Statistics
        console.log('\n📈 STATISTICS');
        console.log('='.repeat(40));
        const activeStudents = students.filter(s => s.isRunning).length;
        const presentStudents = students.filter(s => s.status === 'present').length;
        const absentStudents = students.filter(s => s.status === 'absent').length;
        
        console.log(`🟢 Active Sessions: ${activeStudents}`);
        console.log(`🔵 Present: ${presentStudents}`);
        console.log(`🔴 Absent: ${absentStudents}`);
        console.log(`📊 Total: ${students.length}`);
        
        // API URL for demo
        console.log('\n🌐 API ACCESS');
        console.log('='.repeat(40));
        console.log('🔗 Base URL: https://letsbunk-uw7g.onrender.com');
        console.log('📡 Students API: /api/students');
        console.log('👤 Student Management: /api/student-management');
        console.log('📊 View Records: /api/view-records/students');
        
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

getAllStudents();