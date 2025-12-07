// Check Azure deployment status
const https = require('https');

const checkEndpoint = () => {
    const url = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/student/0246CS241001';
    
    https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log(`\n✅ Status Code: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('🎉 DEPLOYMENT SUCCESSFUL! Endpoint is working!');
                console.log('Response:', JSON.parse(data));
                process.exit(0);
            } else {
                console.log('⏳ Still deploying... (Status:', res.statusCode, ')');
                console.log('Response:', data);
            }
        });
    }).on('error', (err) => {
        console.log('❌ Error:', err.message);
    });
};

console.log('🔍 Checking Azure deployment status...');
console.log('📍 Endpoint: /api/student/0246CS241001');
console.log('⏰ Waiting for GitHub Actions to deploy...\n');

// Check every 15 seconds for 3 minutes
let attempts = 0;
const maxAttempts = 12;

const interval = setInterval(() => {
    attempts++;
    console.log(`\n📊 Attempt ${attempts}/${maxAttempts}...`);
    checkEndpoint();
    
    if (attempts >= maxAttempts) {
        console.log('\n⚠️  Deployment taking longer than expected.');
        console.log('💡 Options:');
        console.log('   1. Check GitHub Actions: https://github.com/adityasingh03rajput/testing-server-/actions');
        console.log('   2. Use Azure Portal "Sync" button in Deployment Center');
        console.log('   3. Wait a bit longer and run this script again');
        clearInterval(interval);
        process.exit(1);
    }
}, 15000);

// Initial check
checkEndpoint();
