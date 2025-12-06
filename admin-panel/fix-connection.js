// Quick fix script to establish admin panel connection
// Run this in the admin panel's Developer Console (F12)

console.log('🔧 Starting connection fix...');

// 1. Set the correct server URL
const AZURE_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
localStorage.setItem('serverUrl', AZURE_URL);
console.log('✅ Server URL set to:', AZURE_URL);

// 2. Update the global SERVER_URL variable
if (typeof SERVER_URL !== 'undefined') {
    SERVER_URL = AZURE_URL;
    console.log('✅ Global SERVER_URL updated');
}

// 3. Test the connection
async function testConnection() {
    console.log('🧪 Testing connection...');
    try {
        const response = await fetch(`${AZURE_URL}/api/health`);
        const data = await response.json();
        console.log('✅ Server is responding:', data);
        
        // Test students endpoint
        const studentsResponse = await fetch(`${AZURE_URL}/api/students`);
        const studentsData = await studentsResponse.json();
        console.log('✅ Students endpoint:', studentsData.success ? `${studentsData.students.length} students found` : 'No data');
        
        // Test teachers endpoint
        const teachersResponse = await fetch(`${AZURE_URL}/api/teachers`);
        const teachersData = await teachersResponse.json();
        console.log('✅ Teachers endpoint:', teachersData.success ? `${teachersData.teachers.length} teachers found` : 'No data');
        
        console.log('🎉 All tests passed! Connection is working.');
        console.log('📝 Now reload the page: location.reload()');
        
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        console.log('💡 Troubleshooting tips:');
        console.log('   1. Check if server is running');
        console.log('   2. Verify CORS is enabled on server');
        console.log('   3. Check your internet connection');
        return false;
    }
}

// 4. Run the test
testConnection().then(success => {
    if (success) {
        console.log('');
        console.log('🔄 To apply changes, run: location.reload()');
        console.log('   Or press Ctrl+R to refresh the page');
    }
});

// 5. Provide manual reload function
window.fixAndReload = function() {
    localStorage.setItem('serverUrl', AZURE_URL);
    location.reload();
};

console.log('');
console.log('📋 Quick Commands:');
console.log('   testConnection()     - Test server connection');
console.log('   fixAndReload()       - Fix URL and reload page');
console.log('   location.reload()    - Reload the page');
console.log('');
