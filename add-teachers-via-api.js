const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Sample teachers data
const sampleTeachers = [
    {
        employeeId: 'EMP001',
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@college.edu',
        password: 'password123',
        department: 'CSE',
        subject: 'Data Structures',
        dob: '1980-05-15',
        phone: '+91-9876543210',
        semester: '3',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP002',
        name: 'Prof. Priya Sharma',
        email: 'priya.sharma@college.edu',
        password: 'password123',
        department: 'CSE',
        subject: 'Database Management',
        dob: '1985-08-22',
        phone: '+91-9876543211',
        semester: '4',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP003',
        name: 'Dr. Amit Patel',
        email: 'amit.patel@college.edu',
        password: 'password123',
        department: 'ECE',
        subject: 'Digital Electronics',
        dob: '1978-12-10',
        phone: '+91-9876543212',
        semester: '2',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP004',
        name: 'Prof. Sunita Verma',
        email: 'sunita.verma@college.edu',
        password: 'password123',
        department: 'ECE',
        subject: 'Communication Systems',
        dob: '1982-03-18',
        phone: '+91-9876543213',
        semester: '5',
        canEditTimetable: false
    },
    {
        employeeId: 'EMP005',
        name: 'Dr. Vikram Singh',
        email: 'vikram.singh@college.edu',
        password: 'password123',
        department: 'ME',
        subject: 'Thermodynamics',
        dob: '1975-09-25',
        phone: '+91-9876543214',
        semester: '3',
        canEditTimetable: true
    },
    {
        employeeId: 'EMP006',
        name: 'Prof. Kavita Joshi',
        email: 'kavita.joshi@college.edu',
        password: 'password123',
        department: 'ME',
        subject: 'Machine Design',
        dob: '1983-07-12',
        phone: '+91-9876543215',
        semester: '6',
        canEditTimetable: false
    }
];

async function addTeachersViaAPI() {
    try {
        const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
        
        console.log('🌐 Adding teachers via API...');
        console.log(`📡 Server URL: ${SERVER_URL}`);
        
        // Add teachers using bulk endpoint
        console.log('\n📥 Adding teachers via POST /api/teachers/bulk...');
        const response = await fetch(`${SERVER_URL}/api/teachers/bulk`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ teachers: sampleTeachers })
        });
        
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Teachers added successfully:');
            console.log(JSON.stringify(data, null, 2));
            
            // Verify by fetching teachers
            console.log('\n🔍 Verifying teachers were added...');
            const verifyResponse = await fetch(`${SERVER_URL}/api/teachers`);
            
            if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                console.log(`👥 Teachers in database: ${verifyData.teachers.length}`);
                
                if (verifyData.teachers.length > 0) {
                    console.log('\n📋 Teacher List:');
                    verifyData.teachers.forEach((teacher, index) => {
                        console.log(`${index + 1}. ${teacher.name} (${teacher.employeeId}) - ${teacher.department}`);
                    });
                    
                    // Get unique departments
                    const departments = [...new Set(verifyData.teachers.map(t => t.department))];
                    console.log(`\n🏢 Departments: ${departments.join(', ')}`);
                    
                    console.log('\n🎉 Success! You can now test the department filter in the admin panel.');
                    console.log('💡 The filter should show: All Departments, CSE, ECE, ME');
                }
            }
        } else {
            const errorText = await response.text();
            console.log(`❌ Failed to add teachers: ${errorText}`);
        }
        
    } catch (error) {
        console.error('❌ Error adding teachers via API:', error);
    }
}

// Run the script
addTeachersViaAPI();