const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Function to parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const teachers = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Handle CSV parsing with quoted values
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Add the last value
        
        const teacher = {};
        headers.forEach((header, index) => {
            if (header === 'canEditTimetable') {
                teacher[header] = values[index] && values[index].toLowerCase() === 'true';
            } else {
                teacher[header] = values[index] || '';
            }
        });
        teachers.push(teacher);
    }
    
    return teachers;
}

async function testRealTeachersImport() {
    try {
        const SERVER_URL = 'http://localhost:3001';
        
        console.log('📚 Testing Real Teachers Import...');
        console.log(`📡 Server URL: ${SERVER_URL}`);
        
        // Read CSV file
        const csvData = fs.readFileSync('real-teachers-data.csv', 'utf8');
        console.log('\n📄 CSV Data:');
        console.log(csvData);
        
        // Parse CSV
        const teachers = parseCSV(csvData);
        console.log('\n👥 Parsed Teachers:');
        teachers.forEach((teacher, index) => {
            console.log(`${index + 1}. ${teacher.name} (${teacher.employeeId}) - ${teacher.department} - ${teacher.subject}`);
        });
        
        // Test bulk import
        console.log('\n📥 Importing teachers to server...');
        const response = await fetch(`${SERVER_URL}/api/teachers/bulk`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ teachers })
        });
        
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        
        const result = await response.json();
        console.log(`✅ Import Result:`, JSON.stringify(result, null, 2));
        
        // Verify import
        console.log('\n🔍 Verifying import...');
        const verifyResponse = await fetch(`${SERVER_URL}/api/teachers`);
        const verifyData = await verifyResponse.json();
        
        console.log(`👥 Total teachers in database: ${verifyData.teachers.length}`);
        
        if (verifyData.teachers.length > 0) {
            console.log('\n📋 All teachers in database:');
            verifyData.teachers.forEach((teacher, index) => {
                console.log(`${index + 1}. ${teacher.name} (${teacher.employeeId}) - ${teacher.department}`);
            });
            
            // Get unique departments
            const departments = [...new Set(verifyData.teachers.map(t => t.department))];
            console.log(`\n🏢 Departments: ${departments.join(', ')}`);
        }
        
        // Test departments endpoint
        console.log('\n🏢 Testing departments endpoint...');
        const deptResponse = await fetch(`${SERVER_URL}/api/departments`);
        if (deptResponse.ok) {
            const deptData = await deptResponse.json();
            console.log('✅ Departments API Response:');
            console.log(JSON.stringify(deptData, null, 2));
        } else {
            console.log(`❌ Departments endpoint failed: ${deptResponse.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error testing real teachers import:', error);
    }
}

// Run the test
testRealTeachersImport();