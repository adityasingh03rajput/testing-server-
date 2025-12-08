const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// Subject Schema
const subjectSchema = new mongoose.Schema({
    subjectCode: { type: String, required: true, unique: true },
    subjectName: { type: String, required: true },
    shortName: { type: String },
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    credits: { type: Number, default: 3 },
    type: { type: String, enum: ['Theory', 'Lab', 'Practical', 'Training'], default: 'Theory' },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Subject = mongoose.model('Subject', subjectSchema);

// Subjects for Semester 3 (from timetable)
const subjects = [
    // Computer Science Subjects
    {
        subjectCode: 'CS301',
        subjectName: 'Object Oriented Programming Methodology',
        shortName: 'OOPM',
        semester: '3',
        branch: 'B.Tech Computer Science',
        credits: 4,
        type: 'Theory',
        description: 'Object-oriented programming concepts and methodology'
    },
    {
        subjectCode: 'CS302',
        subjectName: 'Discrete Structures',
        shortName: 'Disc Struct',
        semester: '3',
        branch: 'B.Tech Computer Science',
        credits: 4,
        type: 'Theory',
        description: 'Mathematical foundations for computer science'
    },
    {
        subjectCode: 'CS303',
        subjectName: 'Digital Systems',
        shortName: 'DIGI SYS',
        semester: '3',
        branch: 'B.Tech Computer Science',
        credits: 4,
        type: 'Theory',
        description: 'Digital logic and computer organization'
    },
    {
        subjectCode: 'CS304',
        subjectName: 'Data Structures',
        shortName: 'DS',
        semester: '3',
        branch: 'B.Tech Computer Science',
        credits: 4,
        type: 'Theory',
        description: 'Fundamental data structures and algorithms'
    },
    {
        subjectCode: 'CS305',
        subjectName: 'Hands On Java Training for Campus Preparation',
        shortName: 'Java Training',
        semester: '3',
        branch: 'B.Tech Computer Science',
        credits: 2,
        type: 'Training',
        description: 'Practical Java programming for placement preparation'
    },
    
    // Data Science Subjects
    {
        subjectCode: 'DS301',
        subjectName: 'Data Structures',
        shortName: 'DS',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 4,
        type: 'Theory',
        description: 'Fundamental data structures and algorithms'
    },
    {
        subjectCode: 'DS302',
        subjectName: 'Object Oriented Programming Methodology',
        shortName: 'OOPM',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 4,
        type: 'Theory',
        description: 'Object-oriented programming concepts'
    },
    {
        subjectCode: 'DS303',
        subjectName: 'Technical Communication',
        shortName: 'Tech Comm',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 3,
        type: 'Theory',
        description: 'Professional communication skills'
    },
    {
        subjectCode: 'DS304',
        subjectName: 'Hands On Python Training for Campus Preparation',
        shortName: 'Python Training',
        semester: '3',
        branch: 'B.Tech Data Science',
        credits: 2,
        type: 'Training',
        description: 'Practical Python programming for placement preparation'
    },
    
    // AIML Subjects
    {
        subjectCode: 'AI301',
        subjectName: 'Data Structures',
        shortName: 'DS',
        semester: '3',
        branch: 'B.Tech Artificial Intelligence',
        credits: 4,
        type: 'Theory',
        description: 'Fundamental data structures and algorithms'
    },
    {
        subjectCode: 'AI302',
        subjectName: 'Hands On Java Training for Campus Preparation',
        shortName: 'Java Training',
        semester: '3',
        branch: 'B.Tech Artificial Intelligence',
        credits: 2,
        type: 'Training',
        description: 'Practical Java programming for placement preparation'
    },
    {
        subjectCode: 'AI303',
        subjectName: 'Hands On Python Training for Campus Preparation',
        shortName: 'Python Training',
        semester: '3',
        branch: 'B.Tech Artificial Intelligence',
        credits: 2,
        type: 'Training',
        description: 'Practical Python programming for placement preparation'
    },
    
    // Information Technology (IOT) Subjects
    {
        subjectCode: 'IT301',
        subjectName: 'Data Structures',
        shortName: 'DS',
        semester: '3',
        branch: 'B.Tech Information Technology',
        credits: 4,
        type: 'Theory',
        description: 'Fundamental data structures and algorithms'
    },
    {
        subjectCode: 'IT302',
        subjectName: 'Object Oriented Programming Methodology',
        shortName: 'OOPM',
        semester: '3',
        branch: 'B.Tech Information Technology',
        credits: 4,
        type: 'Theory',
        description: 'Object-oriented programming concepts'
    },
    {
        subjectCode: 'IT303',
        subjectName: 'Internet and Intranet Systems',
        shortName: 'IIS',
        semester: '3',
        branch: 'B.Tech Information Technology',
        credits: 4,
        type: 'Theory',
        description: 'Network systems and protocols'
    },
    {
        subjectCode: 'IT304',
        subjectName: 'Hands On Python Training for Campus Preparation',
        shortName: 'Python Training',
        semester: '3',
        branch: 'B.Tech Information Technology',
        credits: 2,
        type: 'Training',
        description: 'Practical Python programming for placement preparation'
    }
];

async function seedSubjects() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing semester 3 subjects
        console.log('\n🗑️  Clearing existing Semester 3 subjects...');
        const deleteResult = await Subject.deleteMany({ semester: '3' });
        console.log(`✅ Deleted ${deleteResult.deletedCount} existing subjects`);

        // Insert new subjects
        console.log('\n📝 Inserting new subjects...');
        const result = await Subject.insertMany(subjects);
        console.log(`✅ Successfully inserted ${result.length} subjects`);

        // Display summary
        console.log('\n📊 Subject Summary:');
        console.log('─'.repeat(60));
        
        const branches = [...new Set(subjects.map(s => s.branch))];
        for (const branch of branches) {
            const count = subjects.filter(s => s.branch === branch).length;
            console.log(`\n${branch}:`);
            const branchSubjects = subjects.filter(s => s.branch === branch);
            branchSubjects.forEach(sub => {
                console.log(`  • ${sub.subjectCode} - ${sub.subjectName} (${sub.credits} credits, ${sub.type})`);
            });
        }

        console.log('\n✅ Subjects successfully seeded!');
        console.log('🎓 Semester: 3 (B.Tech III Semester)');
        console.log(`📚 Total Subjects: ${subjects.length}`);

    } catch (error) {
        console.error('❌ Error seeding subjects:', error);
        console.error(error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the script
seedSubjects().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
