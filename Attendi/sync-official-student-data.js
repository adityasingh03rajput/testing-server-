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
    profilePhoto: String,
    dateOfBirth: Date
});

const StudentManagement = mongoose.model('StudentManagement', studentManagementSchema);

// Official RGPV student data
const officialStudents = [
    { enrollment: '0246CD241001', name: 'AADESH CHOUKSEY', father: 'RAJESH KUMAR CHOUKSEY', dob: '1/2/2006' },
    { enrollment: '0246CD241002', name: 'AASHI VISHWAKARMA', father: 'BRIJMOHAN VISHWAKARMA', dob: '14/08/2006' },
    { enrollment: '0246CD241003', name: 'AASTHA SINGH', father: 'PANKAJ SINGH', dob: '16/04/2006' },
    { enrollment: '0246CD241004', name: 'AAYAM JAIN', father: 'ABHAY KUMAR JAIN', dob: '4/10/2005' },
    { enrollment: '0246CD241005', name: 'AAYUSH DASHMER', father: 'VIRENDRA DASHMER', dob: '21/08/2006' },
    { enrollment: '0246CD241006', name: 'ABHAY SONDHIYA', father: 'DILIP SONDHIYA', dob: '6/12/2005' },
    { enrollment: '0246CD241007', name: 'ABHI KAHAR', father: 'MOHAN KAHAR', dob: '13/09/2006' },
    { enrollment: '0246CD241008', name: 'ABHINESH PATEL', father: 'RAJESH KUMAR PATEL', dob: '7/7/2006' },
    { enrollment: '0246CD241009', name: 'ABHISHEK KURMI', father: 'NARMDA PRASAD KURMI', dob: '25/10/2003' },
    { enrollment: '0246CD241010', name: 'ADARSH SAHU', father: 'ASHOK KUMAR SAHU', dob: '6/6/2003' },
    { enrollment: '0246CD241011', name: 'ADITI GUPTA', father: 'MANISH GUPTA', dob: '4/5/2005' },
    { enrollment: '0246CD241012', name: 'ADITYA ANSHUL', father: 'SUSHIL KUMAR', dob: '30/09/2005' },
    { enrollment: '0246CD241013', name: 'ADITYA RAJ MAHULE', father: 'RAJESH J MAHULE', dob: '3/11/2006' },
    { enrollment: '0246CD241014', name: 'ADITYA SAINI', father: 'DEEPAK SAINI', dob: '20/02/2007' },
    { enrollment: '0246CD241015', name: 'AISHWARYA AGNIHOTRI', father: 'ANURAG AGNIHOTRI', dob: '5/1/2005' },
    { enrollment: '0246CD241016', name: 'AJAY AHIRWAR', father: 'RAJESH AHIRWAR', dob: '13/09/2006' },
    { enrollment: '0246CD241017', name: 'AMIT SINGH', father: 'LAXMAN SINGH', dob: '29/11/2006' },
    { enrollment: '0246CD241018', name: 'ANAY SINGH', father: 'RAKESH SINGH', dob: '17/09/2006' },
    { enrollment: '0246CD241019', name: 'ANKIT SINGH', father: 'SHREE DEVI SINGH', dob: '25/07/2005' },
    { enrollment: '0246CD241020', name: 'ANKUR DUBEY', father: 'DEENANATH DUBEY', dob: '21/05/2006' },
    { enrollment: '0246CD241021', name: 'ANSHIKA PATEL', father: 'ANIL PATEL', dob: '3/1/2006' },
    { enrollment: '0246CD241022', name: 'ANUBHAV SINGH CHOUHAN', father: 'SANDEEP SINGH CHOUHAN', dob: '4/11/2006' },
    { enrollment: '0246CD241023', name: 'ANUJ SINGH', father: 'PAPPU SINGH', dob: '23/07/2007' },
    { enrollment: '0246CD241024', name: 'ANURAG SAHU', father: 'LAXMI KANT SAHU', dob: '25/09/2005' },
    { enrollment: '0246CD241025', name: 'ANURAG SINGH', father: 'DHEERAJ SINGH', dob: '27/12/2006' },
    { enrollment: '0246CD241026', name: 'APARNA GUPTA', father: 'ANIL KUMAR GUPTA', dob: '29/08/2005' },
    { enrollment: '0246CD241027', name: 'ARYAN PAUL', father: 'SUSHIL PAUL', dob: '14/05/2006' },
    { enrollment: '0246CD241028', name: 'ARYAN VISHWAKARMA', father: 'GANESH PRASAD VISHWAKARMA', dob: '25/06/2006' },
    { enrollment: '0246CD241029', name: 'AVI KOSHTA', father: 'DAULAT RAM KOSHTA', dob: '5/12/2005' },
    { enrollment: '0246CD241030', name: 'AYUSH KUMAR', father: 'PANKAJ KUMAR', dob: '2/1/2007' },
    { enrollment: '0246CD241031', name: 'AYUSH UPADHYAY', father: 'HEMANT UPADHYAY', dob: '1/1/2007' },
    { enrollment: '0246CD241032', name: 'DEEP KUMAR DEHARIYA', father: 'SHIVPRASAD', dob: '19/06/2006' },
    { enrollment: '0246CD241033', name: 'DEV KUMAR CHAKRAVARTY', father: 'DHARMENDRA CHAKRAVARTY', dob: '6/10/2006' },
    { enrollment: '0246CD241034', name: 'DEVANSH TRIPATHI', father: 'RAMRUDRA TRIPATHI', dob: '5/10/2006' },
    { enrollment: '0246CD241035', name: 'DURGESH TRIPATHI', father: 'SANJEEV TRIPATHI', dob: '10/7/2006' },
    { enrollment: '0246CD241036', name: 'ESHA GUPTA', father: 'NAVEEN GUPTA', dob: '25/12/2005' },
    { enrollment: '0246CD241037', name: 'GUNJAN KOHLI', father: 'VINEET KOHLI', dob: '26/03/2006' },
    { enrollment: '0246CD241038', name: 'HARIOM PANDEY', father: 'GIRISH PANDEY', dob: '19/08/2007' },
    { enrollment: '0246CD241039', name: 'HARIOM SINGH GOUTAM', father: 'SUKHENDRA SINGH', dob: '11/2/2006' },
    { enrollment: '0246CD241040', name: 'HARSH CHOUDHARY', father: 'THAKURDEEN CHOUDHARY', dob: '25/09/2005' },
    { enrollment: '0246CD241041', name: 'HARSH KUMAR GUPTA', father: 'MUKESH KUMAR GUPTA', dob: '1/4/2006' },
    { enrollment: '0246CD241042', name: 'HARSH KUSHWAHA', father: 'KRISHNA KUMAR KUSHWAHA', dob: '28/03/2007' },
    { enrollment: '0246CD241043', name: 'HARSHIT TAMRAKAR', father: 'HARISHANKAR', dob: '21/03/2007' },
    { enrollment: '0246CD241044', name: 'HARSHIT VERMA', father: 'SANTOSH VERMA', dob: '1/8/2005' },
    { enrollment: '0246CD241045', name: 'HIMANSHU CHOUDHARY', father: 'RAJESH CHOUDHARY', dob: '7/4/2006' },
    { enrollment: '0246CD241046', name: 'HIMANSHU SHEKHAR', father: 'BALIRAM PASWAN', dob: '28/09/2004' },
    { enrollment: '0246CD241047', name: 'KALP JAIN', father: 'SANJAY JAIN', dob: '4/1/2007' },
    { enrollment: '0246CD241048', name: 'KHUSHI DUBEY', father: 'RAJESH DUBEY', dob: '12/8/2006' },
    { enrollment: '0246CD241049', name: 'KHUSHI RAI', father: 'VIJAY KUMAR RAI', dob: '5/1/2007' },
    { enrollment: '0246CD241050', name: 'KHUSHI TIWARI', father: 'AMIT TIWARI', dob: '8/11/2005' },
    { enrollment: '0246CD241051', name: 'LUCKY KUMAR', father: 'VINOD KUMAR', dob: '14/04/2006' },
    { enrollment: '0246CD241052', name: 'MANOHAR GADHWAL', father: 'MAHENDRA GADHEWAL', dob: '12/11/2006' },
    { enrollment: '0246CD241053', name: 'MANOJ KUMAR RAJAK', father: 'PUSHPENDRA KUMAR RAJAK', dob: '23/06/2004' },
    { enrollment: '0246CD241054', name: 'MAYANK PATEL', father: 'CHANDRABHAN PATEL', dob: '6/2/2007' },
    { enrollment: '0246CD241055', name: 'MEGHNA SINGH', father: 'SHIVRAJ SINGH', dob: '24/02/2006' },
    { enrollment: '0246CD241056', name: 'MOHIT KATRE', father: 'CHOTELAL KATRE', dob: '22/03/2005' },
    { enrollment: '0246CD241057', name: 'MOHIT MAHRA', father: 'SHRIKANT MAHRA', dob: '17/04/2007' },
    { enrollment: '0246CD241058', name: 'MOHIT PATEL', father: 'MUKESH PATEL', dob: '2/7/2007' },
    { enrollment: '0246CD241059', name: 'MUSKAN JHARIYA', father: 'KAMLESH JHARIYA', dob: '31/03/2006' },
    { enrollment: '0246CD241060', name: 'NAMAN PATEL', father: 'MANISH PATEL', dob: '24/08/2006' },
    { enrollment: '0246CD241061', name: 'NIDHI PRAJAPATI', father: 'PRAKASH PRAJAPATI', dob: '7/1/2005' },
    { enrollment: '0246CD241062', name: 'NISHANT SINGH RAJPOOT', father: 'SUSHIL KUMAR RAJPOOT', dob: '13/07/2006' },
    { enrollment: '0246CD241063', name: 'NITESH KOSTA', father: 'TULSI DAS KOSTA', dob: '6/3/2005' },
    { enrollment: '0246CD241064', name: 'OMI CHAURASIA', father: 'KANCHAN CHAURASIA', dob: '30/12/2003' },
    { enrollment: '0246CD241065', name: 'PARTH JHA', father: 'RITESH KUMAR JHA', dob: '9/1/2007' },
    { enrollment: '0246CD241066', name: 'PRABHAT PATEL', father: 'MANOJ PATEL', dob: '5/9/2006' },
    { enrollment: '0246CD241067', name: 'PRANAV TRIPATHI', father: 'DINESH TRIPATHI', dob: '19/04/2006' },
    { enrollment: '0246CD241068', name: 'PRATHMESH MEHRA', father: 'PARAMLAL MEHRA', dob: '19/10/2006' },
    { enrollment: '0246CD241069', name: 'PRERIT KESHARWANI', father: 'RISHI KESHARWANI', dob: '4/4/2004' },
    { enrollment: '0246CD241070', name: 'PRINCY KASHYAP', father: 'GIRAJA KASHYAP', dob: '12/11/2005' },
    { enrollment: '0246CD241071', name: 'PRIYANSHI VISHWAKARMA', father: 'RAJESH VISHWAKARMA', dob: '22/01/2007' },
    { enrollment: '0246CD241072', name: 'PRIYANSHU VISHWAKARMA', father: 'ASHOK VISHWAKARMA', dob: '19/08/2006' },
    { enrollment: '0246CD241073', name: 'PUSHPRAJ SINGH RAJPOOT', father: 'MAN SINGH RAJPOOT', dob: '27/07/2006' },
    { enrollment: '0246CD241074', name: 'PUSHPRAJ SINGH RAJPUT', father: 'AJEET SINGH RAJPUT', dob: '12/11/2005' },
    { enrollment: '0246CD241075', name: 'RACHIT VERMA', father: 'BRIJESH VERMA', dob: '25/08/2005' },
    { enrollment: '0246CD241076', name: 'RAJ BEN', father: 'MANOJ BEN', dob: '3/5/2005' },
    { enrollment: '0246CD241077', name: 'RASHI JAISWAL', father: 'RAKESH JAISWAL', dob: '4/5/2006' },
    { enrollment: '0246CD241078', name: 'RIJUL KUMAR KUSHVAHA', father: 'ARVIND KUMAR KUSHVAHA', dob: '1/5/2005' },
    { enrollment: '0246CD241079', name: 'RITESH RAJAK', father: 'RAKESH RAJAK', dob: '26/06/2007' },
    { enrollment: '0246CD241080', name: 'SAHIL KUMAR PATEL', father: 'RAJNEESH PATEL', dob: '27/08/2006' },
    { enrollment: '0246CD241081', name: 'SAMARTH PAWAR', father: 'SATISH PAWAR', dob: '3/8/2006' },
    { enrollment: '0246CD241082', name: 'SAMRIDDHI KUNDWANI', father: 'SANJAY KUNDWANI', dob: '25/11/2006' },
    { enrollment: '0246CD241083', name: 'SANKALP TIWARI', father: 'DEEPAK TIWARI', dob: '27/10/2004' },
    { enrollment: '0246CD241084', name: 'SARVESH JATAV', father: 'HEERALAL JATAV', dob: '2/9/2005' },
    { enrollment: '0246CD241085', name: 'SATYAM JHARIYA', father: 'GANGARAM JHARIYA', dob: '19/01/2006' },
    { enrollment: '0246CD241086', name: 'SATYAM KESHERWANI', father: 'SHRI RAKESH KESHERWANI', dob: '10/9/2006' },
    { enrollment: '0246CD241087', name: 'SHARMA SANSKRUTI SACHIN', father: 'SACHIN', dob: '29/09/2006' },
    { enrollment: '0246CD241088', name: 'SHISHIR RIMJHE', father: 'SITA RAM RIMJHE', dob: '3/5/2005' },
    { enrollment: '0246CD241089', name: 'SHIVAM KUMAR', father: 'GOPAL JEE', dob: '9/10/2006' },
    { enrollment: '0246CD241090', name: 'SHIVAM PRAJAPATI', father: 'MAHESH PRASAD', dob: '10/9/2006' },
    { enrollment: '0246CD241091', name: 'SHRADHA GONTIYA', father: 'SUDAMA PRASAD GONTIYA', dob: '26/11/2006' },
    { enrollment: '0246CD241092', name: 'SHRASHTI MISHRA', father: 'MUKESH MISHRA', dob: '17/03/2006' },
    { enrollment: '0246CD241093', name: 'SHREYA SEN', father: 'PRAMOD SEN', dob: '13/12/2005' },
    { enrollment: '0246CD241094', name: 'SHRIYANSHI BHARTI', father: 'ARUN KUMAR BHARTI', dob: '5/3/2006' },
    { enrollment: '0246CD241095', name: 'SHRUTI CHOUBEY', father: 'ARUN CHOUBEY', dob: '23/12/2005' },
    { enrollment: '0246CD241096', name: 'SIDDHARTH PATEL', father: 'MUNEEM PATEL', dob: '9/2/2006' },
    { enrollment: '0246CD241097', name: 'SITARAM PATEL', father: 'KAILASH PATEL', dob: '14/06/2006' },
    { enrollment: '0246CD241098', name: 'SNEHA LODHI', father: 'RAJENDRA LODHI', dob: '15/04/2005' },
    { enrollment: '0246CD241099', name: 'SOUMYA TIWARI', father: 'ABHISHEK TIWARI', dob: '3/12/2005' },
    { enrollment: '0246CD241100', name: 'SUBHESH SAHU', father: 'RAJESH SAHU', dob: '7/7/2006' },
    { enrollment: '0246CD241101', name: 'SURAJ KUMAR', father: 'SANJEET KUMAR', dob: '15/10/2006' },
    { enrollment: '0246CD241102', name: 'SURYANSH YADAV', father: 'NARESH YADAV', dob: '5/7/2003' },
    { enrollment: '0246CD241103', name: 'SWATI LODHI', father: 'RAJENDRA SINGH LODHI', dob: '26/11/2005' },
    { enrollment: '0246CD241104', name: 'TANISHA CHOUDHARY', father: 'BEDI LAL CHOUDHARY', dob: '8/2/2007' },
    { enrollment: '0246CD241105', name: 'TANISHA DIXIT', father: 'RAJESH DIXIT', dob: '20/02/2006' },
    { enrollment: '0246CD241106', name: 'TANISHKA CHOUHAN', father: 'SONU CHOUHAN', dob: '24/05/2006' },
    { enrollment: '0246CD241107', name: 'TANISHKA VISHWAKARMA', father: 'BASANT VISHWAKARMA', dob: '13/01/2006' },
    { enrollment: '0246CD241108', name: 'TANISHQ YADAV', father: 'PREMLAL YADAV', dob: '11/10/2005' },
    { enrollment: '0246CD241109', name: 'TEJASH CHAURASIYA', father: 'BRIJESH KUMAR CHAURASIYA', dob: '24/09/2006' },
    { enrollment: '0246CD241110', name: 'TULSI KEWAT', father: 'SURYANARAYAN KEWAT', dob: '8/12/2006' },
    { enrollment: '0246CD241111', name: 'UDAY CHAND SAHU', father: 'MANNULAL SAHU', dob: '9/1/2005' },
    { enrollment: '0246CD241112', name: 'UNNATI SHRIVASTAVA', father: 'AJAY SHRIVASTAVA', dob: '24/04/2006' },
    { enrollment: '0246CD241113', name: 'VIJAY KUMAR GUPTA', father: 'NARENDRA PRASAD GUPTA', dob: '12/12/2006' },
    { enrollment: '0246CD241114', name: 'VIKAS TRIPATHI', father: 'CHANDRAMANI TRIPATHI', dob: '1/7/2007' },
    { enrollment: '0246CD241115', name: 'VINAMRA UIKEY', father: 'KACHRU', dob: '18/10/2006' },
    { enrollment: '0246CD241116', name: 'VIPUL GUPTA', father: 'DHARMENDRA KUMAR GUPTA', dob: '1/7/2006' },
    { enrollment: '0246CD241117', name: 'VIVEK SHUKLA', father: 'LALIT MOHAN SHUKLA', dob: '6/1/2007' },
    { enrollment: '0246CD243D01', name: 'ADITYA BARMAN', father: 'SANTOSH BARMAN', dob: '2/2/2005' },
    { enrollment: '0246CD243D02', name: 'AKASH PATEL', father: 'INDRAKUMAR PATEL', dob: '30/03/1999' },
    { enrollment: '0246CD243D03', name: 'ANSH NAMDEO', father: 'RAKESH KUMAR NAMDEO', dob: '23/07/2003' },
    { enrollment: '0246CD243D04', name: 'ARYAN MISHRA', father: 'ASHOK KUMAR MISHRA', dob: '24/10/2003' },
    { enrollment: '0246CD243D05', name: 'NAMAN SURYAWANSHI', father: 'MANGESH SURYAWANSHI', dob: '12/3/2004' },
];

async function syncStudentData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        let updated = 0;
        let created = 0;
        let errors = 0;
        
        for (const official of officialStudents) {
            try {
                // Try to find existing student by enrollment number
                let student = await StudentManagement.findOne({ 
                    enrollmentNumber: official.enrollment 
                });
                
                // Parse date properly (DD/MM/YYYY format)
                let parsedDate = null;
                try {
                    const parts = official.dob.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                        const year = parseInt(parts[2]);
                        parsedDate = new Date(year, month, day);
                    }
                } catch (e) {
                    console.warn(`⚠️  Invalid date format for ${official.enrollment}: ${official.dob}`);
                }
                
                if (student) {
                    // Update existing student
                    student.fatherName = official.father;
                    if (parsedDate) student.dateOfBirth = parsedDate;
                    await student.save();
                    console.log(`✅ Updated: ${official.enrollment} - ${official.name}`);
                    updated++;
                } else {
                    // Create new student
                    student = new StudentManagement({
                        name: official.name + ' ' + official.father,
                        fatherName: official.father,
                        enrollmentNumber: official.enrollment,
                        course: 'B.Tech Data Science',
                        semester: '1',
                        dateOfBirth: parsedDate,
                        password: 'student123'
                    });
                    await student.save();
                    console.log(`🆕 Created: ${official.enrollment} - ${official.name}`);
                    created++;
                }
            } catch (err) {
                console.error(`❌ Error processing ${official.enrollment}: ${err.message}`);
                errors++;
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Created: ${created}`);
        console.log(`   Errors: ${errors}`);
        console.log(`   Total Processed: ${officialStudents.length}`);
        
        await mongoose.connection.close();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

syncStudentData();
