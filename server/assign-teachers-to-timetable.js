const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/attendance_app';

mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ Connected to MongoDB');
    assignTeachersToTimetables();
}).catch(err => {
    console.log('❌ MongoDB connection error:', err);
    process.exit(1);
});

const timetableSchema = new mongoose.Schema({
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    periods: [{
        number: Number,
        startTime: String,
        endTime: String
    }],
    timetable: {
        monday: [{ period: Number, subject: String, room: String, isBreak: Boolean, teacher: String }],
        tuesday: [{ period: Number, subject: String, room: String, isBreak: Boolean, teacher: String }],
        wednesday: [{ period: Number, subject: String, room: String, isBreak: Boolean, teacher: String }],
        thursday: [{ period: Number, subject: String, room: String, isBreak: Boolean, teacher: String }],
        friday: [{ period: Number, subject: String, room: String, isBreak: Boolean, teacher: String }],
        saturday: [{ period: Number, subject: String, room: String, isBreak: Boolean, teacher: String }]
    },
    lastUpdated: { type: Date, default: Date.now }
});

const Timetable = mongoose.model('Timetable', timetableSchema);

// Teacher assignments based on subjects
const teacherAssignments = {
    'Mathematics-I': 'Dr. Rajesh Kumar',
    'Mathematics': 'Dr. Rajesh Kumar',
    'Physics': 'Prof. Meera Singh',
    'Chemistry': 'Dr. Sunil Patil',
    'Programming in C': 'Dr. Sunil Patil',
    'Programming': 'Dr. Sunil Patil',
    'English': 'Prof. Anjali Desai',
    'Data Structures': 'Dr. Rajesh Kumar',
    'DBMS': 'Prof. Meera Singh',
    'Operating Systems': 'Dr. Sunil Patil',
    'Computer Networks': 'Prof. Anjali Desai',
    'Machine Learning': 'Prof. Anjali Desai',
    'Compiler Design': 'Dr. Rajesh Kumar',
    'Web Technologies': 'Prof. Meera Singh',
    'Computer Graphics': 'Dr. Sunil Patil',
    'Artificial Intelligence': 'Prof. Anjali Desai',
    'Digital Electronics': 'Dr. Amit Patel',
    'Signals & Systems': 'Prof. Sunita Reddy',
    'Analog Circuits': 'Dr. Amit Patel',
    'Microprocessors': 'Prof. Sunita Reddy',
    'Communication Systems': 'Dr. Amit Patel',
    'VLSI Design': 'Prof. Sunita Reddy',
    'Digital Signal Processing': 'Dr. Amit Patel',
    'Microwave Engineering': 'Prof. Sunita Reddy',
    'Control Systems': 'Dr. Amit Patel',
    'Embedded Systems': 'Prof. Sunita Reddy',
    'Thermodynamics': 'Dr. Ramesh Rao',
    'Fluid Mechanics': 'Prof. Kavita Nair',
    'Manufacturing Processes': 'Dr. Ramesh Rao',
    'Strength of Materials': 'Prof. Kavita Nair',
    'Machine Drawing': 'Dr. Ramesh Rao',
    'Heat Transfer': 'Prof. Kavita Nair',
    'Machine Design': 'Dr. Ramesh Rao',
    'Dynamics of Machinery': 'Prof. Kavita Nair',
    'Manufacturing Technology': 'Dr. Ramesh Rao',
    'Industrial Engineering': 'Prof. Kavita Nair',
    'Engineering Mechanics': 'Dr. Ramesh Rao',
    'Structural Analysis': 'Dr. Prakash Joshi',
    'Surveying': 'Prof. Rekha Iyer',
    'Concrete Technology': 'Dr. Prakash Joshi',
    'Geotechnical Engineering': 'Prof. Rekha Iyer',
    'Design of Structures': 'Dr. Prakash Joshi',
    'Transportation Engineering': 'Prof. Rekha Iyer',
    'Environmental Engineering': 'Dr. Prakash Joshi',
    'Water Resources': 'Prof. Rekha Iyer',
    'Construction Management': 'Dr. Prakash Joshi',
    'Basic Electronics': 'Dr. Amit Patel'
};

async function assignTeachersToTimetables() {
    try {
        console.log('📚 Fetching all timetables...');
        const timetables = await Timetable.find({});
        console.log(`Found ${timetables.length} timetables`);

        let updatedCount = 0;
        let assignmentCount = 0;

        for (const tt of timetables) {
            let modified = false;
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

            days.forEach(day => {
                if (tt.timetable[day]) {
                    tt.timetable[day].forEach(period => {
                        if (period.subject && !period.isBreak && !period.teacher) {
                            // Find matching teacher for this subject
                            const teacher = teacherAssignments[period.subject];
                            if (teacher) {
                                period.teacher = teacher;
                                assignmentCount++;
                                modified = true;
                            }
                        }
                    });
                }
            });

            if (modified) {
                tt.lastUpdated = new Date();
                await tt.save();
                updatedCount++;
                console.log(`✅ Updated ${tt.branch} Semester ${tt.semester}`);
            }
        }

        console.log('\n========================================');
        console.log('✅ TEACHER ASSIGNMENT COMPLETE!');
        console.log('========================================');
        console.log(`📊 Timetables updated: ${updatedCount}`);
        console.log(`👨‍🏫 Teachers assigned: ${assignmentCount}`);
        console.log('\nNow teachers will see their schedules in the app!');
        console.log('\nTest by logging in as:');
        console.log('  ID: TEACH001 | Password: aditya | Dr. Rajesh Kumar');
        console.log('  ID: TEACH003 | Password: aditya | Dr. Sunil Patil');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
