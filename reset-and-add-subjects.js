const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityarajsir162_db_user:fkfWRAFNcVNoVFWW@letsbunk.cdxihb7.mongodb.net/attendance_app?retryWrites=true&w=majority&appName=letsbunk';

// Subject Schema (matching server.js)
const subjectSchema = new mongoose.Schema({
    subjectCode: { type: String, required: true, unique: true },
    subjectName: { type: String, required: true },
    shortName: String,
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    credits: { type: Number, default: 3 },
    type: { type: String, enum: ['Theory', 'Practical', 'Lab'], default: 'Theory' },
    description: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Subject = mongoose.model('Subject', subjectSchema);

// Subjects from teachers data
const newSubjects = [
    {
        subjectCode: 'DS101',
        subjectName: 'Data Structure',
        shortName: 'DS',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 4,
        type: 'Theory',
        description: 'Fundamental data structures and algorithms',
        isActive: true
    },
    {
        subjectCode: 'DS102',
        subjectName: 'Database Management Systems',
        shortName: 'DBMS',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 4,
        type: 'Theory',
        description: 'Database design and management concepts',
        isActive: true
    },
    {
        subjectCode: 'DS103',
        subjectName: 'Object Oriented Programming & Methodology',
        shortName: 'OOP',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 4,
        type: 'Theory',
        description: 'Object-oriented programming concepts and methodologies',
        isActive: true
    },
    {
        subjectCode: 'DS104',
        subjectName: 'Introduction to Probability and Statistics',
        shortName: 'Stats',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 3,
        type: 'Theory',
        description: 'Basic probability theory and statistical methods',
        isActive: true
    },
    {
        subjectCode: 'DS105',
        subjectName: 'Technical Communication',
        shortName: 'Tech Comm',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 2,
        type: 'Theory',
        description: 'Professional communication skills for technical fields',
        isActive: true
    },
    {
        subjectCode: 'DS106',
        subjectName: 'Computer Workshop - Introduction to Python',
        shortName: 'Python Lab',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 2,
        type: 'Lab',
        description: 'Hands-on programming workshop using Python',
        isActive: true
    }
];

async function resetAndAddSubjects() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Step 1: Remove all existing subjects
        console.log('\n🗑️ Removing all existing subjects...');
        const deleteResult = await Subject.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} existing subjects`);

        // Step 2: Add new subjects
        console.log('\n📚 Adding new subjects...');
        const insertResult = await Subject.insertMany(newSubjects);
        console.log(`✅ Added ${insertResult.length} new subjects`);

        // Step 3: Verify the subjects
        console.log('\n📋 Verifying subjects in database...');
        const allSubjects = await Subject.find({}).sort({ subjectCode: 1 });
        
        console.log(`\n📊 Total Subjects: ${allSubjects.length}`);
        console.log('='.repeat(100));
        console.log('| Code   | Subject Name                                    | Semester | Branch           | Credits | Type     |');
        console.log('='.repeat(100));
        
        allSubjects.forEach(subject => {
            const code = subject.subjectCode.padEnd(6);
            const name = subject.subjectName.substring(0, 45).padEnd(45);
            const semester = subject.semester.padEnd(8);
            const branch = subject.branch.substring(0, 15).padEnd(15);
            const credits = subject.credits.toString().padEnd(7);
            const type = subject.type.padEnd(8);
            
            console.log(`| ${code} | ${name} | ${semester} | ${branch} | ${credits} | ${type} |`);
        });
        console.log('='.repeat(100));

        // Step 4: Get unique branches and semesters
        console.log('\n🏢 Unique Branches:');
        const branches = await Subject.distinct('branch');
        branches.forEach((branch, index) => {
            const count = allSubjects.filter(s => s.branch === branch).length;
            console.log(`${index + 1}. ${branch} (${count} subject${count !== 1 ? 's' : ''})`);
        });

        console.log('\n📚 Subjects by Type:');
        const types = await Subject.distinct('type');
        types.forEach(type => {
            const count = allSubjects.filter(s => s.type === type).length;
            console.log(`• ${type}: ${count} subject${count !== 1 ? 's' : ''}`);
        });

        console.log('\n🎉 Subject reset and addition completed successfully!');
        console.log('💡 These subjects now match the teachers data provided');

    } catch (error) {
        console.error('❌ Error resetting and adding subjects:', error);
        
        if (error.code === 11000) {
            console.log('💡 Duplicate subject code found. Please check for duplicates.');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
resetAndAddSubjects();