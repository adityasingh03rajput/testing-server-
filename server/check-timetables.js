const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const MONGO_URI = process.env.MONGODB_URI;

const timetableSchema = new mongoose.Schema({
    semester: String,
    branch: String,
    periods: Array,
    timetable: Object
});

const Timetable = mongoose.model('Timetable', timetableSchema);

mongoose.connect(MONGO_URI).then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    
    const timetables = await Timetable.find({}, { semester: 1, branch: 1 });
    console.log(`\n📅 Found ${timetables.length} timetables:\n`);
    
    timetables.forEach(t => {
        console.log(`   ✓ ${t.branch} - Semester ${t.semester}`);
    });
    
    console.log('\n');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
