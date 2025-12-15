const mongoose = require('mongoose');
require('dotenv').config();

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

async function checkTimetable() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const count = await Timetable.countDocuments({ semester: '3' });
  console.log(`Found ${count} timetable entries for Semester 3`);
  
  if (count > 0) {
    const entries = await Timetable.find({ semester: '3' }).limit(5);
    console.log('\nSample entries:');
    entries.forEach(entry => {
      console.log(`- ${entry.branch} | ${entry.subject} | ${entry.teacherName} | Room ${entry.room}`);
    });
  }
  
  await mongoose.connection.close();
  process.exit(0);
}

checkTimetable();
