require('dotenv').config();
const mongoose = require('mongoose');

const studentManagementSchema = new mongoose.Schema({
    name: String,
    fatherName: String,
    enrollmentNumber: String,
    course: String,
    semester: String,
    email: String,
    phone: String,
    password: String,
    profilePhoto: String
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

// Mapping from CSV: enrollment number -> student name
const enrollmentMapping = {
    '0246CD241001': 'AADESH CHOUKSEY',
    '0246CD241002': 'AASHI VISHWAKARMA',
    '0246CD241003': 'AASTHA SINGH',
    '0246CD241004': 'AAYAM JAIN',
    '0246CD241005': 'AAYUSH DASHMER',
    '0246CD241006': 'ABHAY SONDHIYA',
    '0246CD241007': 'ABHI KAHAR',
    '0246CD241008': 'ABHINESH PATEL',
    '0246CD241009': 'ABHISHEK KURMI',
    '0246CD241010': 'ADARSH SAHU',
    '0246CD241011': 'ADITI GUPTA',
    '0246CD241012': 'ADITYA ANSHUL',
    '0246CD241013': 'ADITYA RAJ MAHULE',
    '0246CD241014': 'ADITYA SAINI',
    '0246CD241015': 'AISHWARYA AGNIHOTRI',
    '0246CD241016': 'AJAY AHIRWAR',
    '0246CD241017': 'AMIT SINGH',
    '0246CD241018': 'ANAY SINGH',
    '0246CD241019': 'ANKIT SINGH',
    '0246CD241020': 'ANKUR DUBEY',
    '0246CD241021': 'ANSHIKA PATEL',
    '0246CD241022': 'ANUBHAV SINGH CHOUHAN',
    '0246CD241023': 'ANUJ SINGH',
    '0246CD241024': 'ANURAG SAHU',
    '0246CD241025': 'ANURAG SINGH',
    '0246CD241026': 'APARNA GUPTA',
    '0246CD241027': 'ARYAN PAUL',
    '0246CD241028': 'ARYAN VISHWAKARMA',
    '0246CD241029': 'AVI KOSHTA',
    '0246CD241030': 'AYUSH KUMAR',
    '0246CD241031': 'AYUSH UPADHYAY',
    '0246CD241032': 'DEEP KUMAR DEHARIYA',
    '0246CD241033': 'DEV KUMAR CHAKRAVARTY',
    '0246CD241034': 'DEVANSH TRIPATHI',
    '0246CD241035': 'DURGESH TRIPATHI',
    '0246CD241036': 'ESHA GUPTA',
    '0246CD241038': 'HARIOM PANDEY',
    '0246CD241039': 'HARIOM SINGH GOUTAM',
    '0246CD241040': 'HARSH CHOUDHARY',
    '0246CD241041': 'HARSH KUMAR GUPTA',
    '0246CD241042': 'HARSH KUSHWAHA',
    '0246CD241043': 'HARSHIT TAMRAKAR',
    '0246CD241044': 'HARSHIT VERMA',
    '0246CD241045': 'HIMANSHU CHOUDHARY',
    '0246CD241046': 'HIMANSHU SHEKHAR',
    '0246CD241048': 'KHUSHI DUBEY',
    '0246CD241049': 'KHUSHI RAI',
    '0246CD241050': 'KHUSHI TIWARI',
    '0246CD241051': 'LUCKY KUMAR',
    '0246CD241052': 'MANOHAR GADHWAL',
    '0246CD241053': 'MANOJ KUMAR RAJAK',
    '0246CD241054': 'MAYANK PATEL',
    '0246CD241055': 'MEGHNA SINGH',
    '0246CD241056': 'MOHIT KATRE',
    '0246CD241058': 'MOHIT PATEL',
    '0246CD241059': 'MUSKAN JHARIYA',
    '0246CD241060': 'NAMAN PATEL',
    '0246CD241061': 'NIDHI PRAJAPATI',
    '0246CD241062': 'NISHANT SINGH RAJPOOT',
    '0246CD241063': 'NITESH KOSTA',
    '0246CD241064': 'OMI CHAURASIA',
    '0246CD241065': 'PARTH JHA',
    '0246CD241066': 'PRABHAT PATEL',
    '0246CD241067': 'PRANAV TRIPATHI',
    '0246CD241068': 'PRATHMESH MEHRA',
    '0246CD241069': 'PRERIT KESHARWANI',
    '0246CD241070': 'PRINCY KASHYAP',
    '0246CD241071': 'PRIYANSHI VISHWAKARMA',
    '0246CD241072': 'PRIYANSHU VISHWAKARMA',
    '0246CD241073': 'PUSHPRAJ SINGH RAJPOOT',
    '0246CD241074': 'PUSHPRAJ SINGH RAJPUT',
    '0246CD241075': 'RACHIT VERMA',
    '0246CD241076': 'RAJ BEN',
    '0246CD241077': 'RASHI JAISWAL',
    '0246CD241078': 'RIJUL KUMAR KUSHVAHA',
    '0246CD241079': 'RITESH RAJAK',
    '0246CD241080': 'SAHIL KUMAR PATEL',
    '0246CD241081': 'SAMARTH PAWAR',
    '0246CD241082': 'SAMRIDDHI KUNDWANI',
    '0246CD241083': 'SANKALP TIWARI',
    '0246CD241084': 'SARVESH JATAV',
    '0246CD241085': 'SATYAM JHARIYA',
    '0246CD241086': 'SATYAM KESHERWANI',
    '0246CD241087': 'SHARMA SANSKRUTI SACHIN',
    '0246CD241088': 'SHISHIR RIMJHE',
    '0246CD241089': 'SHIVAM KUMAR',
    '0246CD241090': 'SHIVAM PRAJAPATI',
    '0246CD241091': 'SHRADHA GONTIYA',
    '0246CD241092': 'SHRASHTI MISHRA',
    '0246CD241093': 'SHREYA SEN',
    '0246CD241094': 'SHRIYANSHI BHARTI',
    '0246CD241095': 'SHRUTI CHOUBEY',
    '0246CD241096': 'SIDDHARTH PATEL',
    '0246CD241098': 'SNEHA LODHI',
    '0246CD241099': 'SOUMYA TIWARI',
    '0246CD241100': 'SUBHESH SAHU',
    '0246CD241101': 'SURAJ KUMAR',
    '0246CD241102': 'SURYANSH YADAV',
    '0246CD241103': 'SWATI LODHI',
    '0246CD241104': 'TANISHA CHOUDHARY',
    '0246CD241105': 'TANISHA DIXIT',
    '0246CD241106': 'TANISHKA CHOUHAN',
    '0246CD241107': 'TANISHKA VISHWAKARMA',
    '0246CD241108': 'TANISHQ YADAV',
    '0246CD241109': 'TEJASH CHAURASIYA',
    '0246CD241110': 'TULSI KEWAT',
    '0246CD241111': 'UDAY CHAND SAHU',
    '0246CD241112': 'UNNATI SHRIVASTAVA',
    '0246CD241113': 'VIJAY KUMAR GUPTA',
    '0246CD241114': 'VIKAS TRIPATHI',
    '0246CD241115': 'VINAMRA UIKEY',
    '0246CD241116': 'VIPUL GUPTA',
};

async function updateEnrollmentNumbers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        let updated = 0;
        let notFound = 0;
        
        // First, clear all enrollment numbers to avoid duplicates
        await StudentManagement.updateMany({}, { $unset: { enrollmentNumber: "" } });
        console.log('🧹 Cleared all enrollment numbers\n');
        
        for (const [enrollment, csvName] of Object.entries(enrollmentMapping)) {
            // Normalize CSV name: "AADESH CHOUKSEY" -> "aadesh chouksey"
            const normalizedCsvName = csvName.toLowerCase();
            
            // Find student where database name starts with CSV name
            // DB: "Aadesh Chouksey Rajesh Kumar Chouksey" should match CSV: "AADESH CHOUKSEY"
            const students = await StudentManagement.find({});
            
            let matched = false;
            for (const student of students) {
                if (student.enrollmentNumber) continue; // Skip already assigned
                
                const dbName = student.name.toLowerCase();
                // Check if DB name starts with CSV name (first name + last name match)
                if (dbName.startsWith(normalizedCsvName)) {
                    student.enrollmentNumber = enrollment;
                    await student.save();
                    console.log(`✅ ${enrollment} -> ${student.name}`);
                    updated++;
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                console.log(`❌ Not found: ${csvName}`);
                notFound++;
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Not Found: ${notFound}`);
        
        await mongoose.connection.close();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateEnrollmentNumbers();
