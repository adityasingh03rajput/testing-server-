console.log('Starting timetable feed script...');

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
console.log('MongoDB URI loaded:', MONGODB_URI ? 'Yes' : 'No');

// Timetable Schema
const timetableSchema = new mongoose.Schema({
  branch: String,
  semester: String,
  day: String,
  period: Number,
  subject: String,
  teacher: String,
  teacherName: String,
  startTime: String,
  endTime: String,
  room: String,
  section: String
});

const Timetable = mongoose.model('Timetable', timetableSchema);

// Professor mapping (from faculty list at bottom of timetable)
const professors = {
  'ZH': { id: 'PROF_ZH', name: 'Prof. Zohaib Hasan' },
  'MT': { id: 'PROF_MT', name: 'Prof. MT' },
  'RM': { id: 'PROF_RM', name: 'Prof. RM' },
  'RUPESH': { id: 'PROF_RUPESH', name: 'Mr. Rupesh' },
  'VA': { id: 'PROF_VA', name: 'Prof. VA' },
  'SHAILESH': { id: 'PROF_SHAILESH', name: 'Mr. Shailesh' },
  'DEEPAK': { id: 'PROF_DEEPAK', name: 'Mr. Deepak' },
  'SK': { id: 'PROF_SK', name: 'Prof. SK' },
  'PS': { id: 'PROF_PS', name: 'Prof. PS' },
  'VP': { id: 'PROF_VP', name: 'Prof. VP' },
  'SV': { id: 'PROF_SV', name: 'Prof. SV' }
};

// Timetable data for B.Tech III Semester (Monday only from image)
const timetableData = [
  // ========== CSE A Section (Room W1) ==========
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 1,
    subject: 'OOPM',
    teacher: professors.ZH.id,
    teacherName: professors.ZH.name,
    startTime: '10:20',
    endTime: '11:15',
    room: 'W1'
  },
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 2,
    subject: 'Disc Struct',
    teacher: professors.MT.id,
    teacherName: professors.MT.name,
    startTime: '11:15',
    endTime: '12:10',
    room: 'W1'
  },
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 3,
    subject: 'DIGI SYS',
    teacher: professors.RM.id,
    teacherName: professors.RM.name,
    startTime: '12:40',
    endTime: '01:35',
    room: 'W1'
  },
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 4,
    subject: 'HANDS ON JAVA TRAINING FOR CAMPUS PREPARATION',
    teacher: professors.RUPESH.id,
    teacherName: professors.RUPESH.name,
    startTime: '01:35',
    endTime: '02:30',
    room: 'W1'
  },
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 5,
    subject: 'HANDS ON JAVA TRAINING FOR CAMPUS PREPARATION',
    teacher: professors.RUPESH.id,
    teacherName: professors.RUPESH.name,
    startTime: '02:50',
    endTime: '03:40',
    room: 'W1'
  },

  // ========== CSE B Section (Room W2) ==========
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'B',
    day: 'Monday',
    period: 1,
    subject: 'DS',
    teacher: professors.VA.id,
    teacherName: professors.VA.name,
    startTime: '10:20',
    endTime: '12:10',
    room: 'W2'
  },
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'B',
    day: 'Monday',
    period: 3,
    subject: 'Disc Struct',
    teacher: professors.MT.id,
    teacherName: professors.MT.name,
    startTime: '12:40',
    endTime: '01:35',
    room: 'W2'
  },
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'B',
    day: 'Monday',
    period: 4,
    subject: 'HANDS ON JAVA TRAINING FOR CAMPUS PREPARATION',
    teacher: professors.RUPESH.id,
    teacherName: professors.RUPESH.name,
    startTime: '01:35',
    endTime: '02:30',
    room: 'W2'
  },
  {
    branch: 'B.Tech Computer Science',
    semester: '3',
    section: 'B',
    day: 'Monday',
    period: 5,
    subject: 'HANDS ON JAVA TRAINING FOR CAMPUS PREPARATION',
    teacher: professors.RUPESH.id,
    teacherName: professors.RUPESH.name,
    startTime: '02:50',
    endTime: '03:40',
    room: 'W2'
  },

  // ========== AIML Section (Room W3) ==========
  {
    branch: 'B.Tech Artificial Intelligence',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 1,
    subject: 'HANDS ON JAVA TRAINING FOR CAMPUS PREPARATION',
    teacher: professors.SHAILESH.id,
    teacherName: professors.SHAILESH.name,
    startTime: '10:20',
    endTime: '12:10',
    room: 'W3'
  },
  {
    branch: 'B.Tech Artificial Intelligence',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 3,
    subject: 'HANDS ON Python TRAINING FOR CAMPUS PREPARATION',
    teacher: professors.DEEPAK.id,
    teacherName: professors.DEEPAK.name,
    startTime: '12:40',
    endTime: '02:30',
    room: 'W3'
  },
  {
    branch: 'B.Tech Artificial Intelligence',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 5,
    subject: 'DS',
    teacher: professors.VA.id,
    teacherName: professors.VA.name,
    startTime: '02:50',
    endTime: '03:40',
    room: 'W3'
  },

  // ========== DS (Data Science) Section (Room A 302) ==========
  {
    branch: 'B.Tech Data Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 1,
    subject: 'HANDS ON Python TRAINING FOR CAMPUS PREPARATION Lab 8',
    teacher: professors.DEEPAK.id,
    teacherName: professors.DEEPAK.name,
    startTime: '10:20',
    endTime: '12:10',
    room: 'A 302'
  },
  {
    branch: 'B.Tech Data Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 3,
    subject: 'DS',
    teacher: professors.ZH.id,
    teacherName: professors.ZH.name,
    startTime: '12:40',
    endTime: '01:35',
    room: 'A 302'
  },
  {
    branch: 'B.Tech Data Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 4,
    subject: 'Tech Comm',
    teacher: professors.SK.id,
    teacherName: professors.SK.name,
    startTime: '01:35',
    endTime: '02:30',
    room: 'A 302'
  },
  {
    branch: 'B.Tech Data Science',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 5,
    subject: 'OOPM',
    teacher: professors.PS.id,
    teacherName: professors.PS.name,
    startTime: '02:50',
    endTime: '03:40',
    room: 'A 302'
  },

  // ========== IOT Section (Room A 301) ==========
  {
    branch: 'B.Tech Information Technology',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 1,
    subject: 'HANDS ON Python TRAINING FOR CAMPUS PREPARATION Lab 8',
    teacher: professors.DEEPAK.id,
    teacherName: professors.DEEPAK.name,
    startTime: '10:20',
    endTime: '12:10',
    room: 'A 301'
  },
  {
    branch: 'B.Tech Information Technology',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 3,
    subject: 'IIS',
    teacher: professors.VP.id,
    teacherName: professors.VP.name,
    startTime: '12:40',
    endTime: '01:35',
    room: 'A 301'
  },
  {
    branch: 'B.Tech Information Technology',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 4,
    subject: 'OOPM',
    teacher: professors.PS.id,
    teacherName: professors.PS.name,
    startTime: '01:35',
    endTime: '02:30',
    room: 'A 301'
  },
  {
    branch: 'B.Tech Information Technology',
    semester: '3',
    section: 'A',
    day: 'Monday',
    period: 5,
    subject: 'DS',
    teacher: professors.SV.id,
    teacherName: professors.SV.name,
    startTime: '02:50',
    endTime: '03:40',
    room: 'A 301'
  }
];

async function feedTimetable() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing timetable data for semester 3
    console.log('\n🗑️  Clearing existing Semester 3 timetable data...');
    const deleteResult = await Timetable.deleteMany({ semester: '3' });
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing records`);

    // Insert new timetable data
    console.log('\n📝 Inserting new timetable data...');
    const result = await Timetable.insertMany(timetableData);
    console.log(`✅ Successfully inserted ${result.length} timetable entries`);

    // Display summary
    console.log('\n📊 Timetable Summary:');
    console.log('─'.repeat(60));
    
    const branches = [...new Set(timetableData.map(t => t.branch))];
    for (const branch of branches) {
      const count = timetableData.filter(t => t.branch === branch).length;
      console.log(`${branch}: ${count} periods`);
    }

    console.log('\n📚 Subjects covered:');
    const subjects = [...new Set(timetableData.map(t => t.subject))];
    subjects.forEach(subject => {
      console.log(`  • ${subject}`);
    });

    console.log('\n👨‍🏫 Teachers assigned:');
    const teachers = [...new Set(timetableData.map(t => t.teacherName))];
    teachers.forEach(teacher => {
      console.log(`  • ${teacher}`);
    });

    console.log('\n🏫 Rooms used:');
    const rooms = [...new Set(timetableData.map(t => t.room))];
    rooms.forEach(room => {
      console.log(`  • ${room}`);
    });

    console.log('\n✅ Timetable data successfully seeded!');
    console.log('📅 Day: Monday');
    console.log('🎓 Semester: 3 (B.Tech III Semester)');
    console.log('📆 Academic Year: July-Dec 2025');

  } catch (error) {
    console.error('❌ Error feeding timetable:', error);
    console.error(error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
feedTimetable().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
