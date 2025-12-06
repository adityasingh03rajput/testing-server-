// Inject Server URL Script
// This script runs in the admin panel console to fix the connection

const AZURE_SERVER = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

console.log('🔧 Admin Panel Connection Fix Script');
console.log('=====================================\n');

// Step 1: Save to localStorage
console.log('📝 Step 1: Saving server URL to localStorage...');
localStorage.setItem('serverUrl', AZURE_SERVER);
console.log('✅ Saved:', AZURE_SERVER);

// Step 2: Update global variable
console.log('\n📝 Step 2: Updating global SERVER_URL variable...');
if (typeof SERVER_URL !== 'undefined') {
    SERVER_URL = AZURE_SERVER;
    console.log('✅ Updated SERVER_URL:', SERVER_URL);
} else {
    console.warn('⚠️ SERVER_URL variable not found (page may need to reload)');
}

// Step 3: Update settings input if it exists
console.log('\n📝 Step 3: Updating settings input field...');
const urlInput = document.getElementById('serverUrl');
if (urlInput) {
    urlInput.value = AZURE_SERVER;
    console.log('✅ Updated input field');
} else {
    console.log('ℹ️ Settings input not found (not on settings page)');
}

// Step 4: Test connection
console.log('\n📝 Step 4: Testing connection...');
fetch(AZURE_SERVER + '/api/health')
    .then(response => response.json())
    .then(data => {
        console.log('✅ Connection successful!');
        console.log('📊 Server response:', data);
        console.log('\n🎉 Fix complete! Reloading page in 2 seconds...');
        setTimeout(() => {
            location.reload();
        }, 2000);
    })
    .catch(error => {
        console.error('❌ Connection failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Check if server is running');
        console.log('   2. Check internet connection');
        console.log('   3. Try reloading the page manually (Ctrl+R)');
    });
