require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function checkDeploymentStatus() {
    console.log('🔍 Checking Azure Deployment Status...\n');
    console.log(`📡 Server: ${SOCKET_URL}\n`);
    
    const endpoints = [
        { name: 'Health Check', url: `${SOCKET_URL}/`, method: 'GET' },
        { name: 'Random Ring - Teacher Action', url: `${SOCKET_URL}/api/random-ring/teacher-action`, method: 'POST' },
        { name: 'Random Ring - Verify', url: `${SOCKET_URL}/api/random-ring/verify`, method: 'POST' },
        { name: 'Student Management', url: `${SOCKET_URL}/api/student-management`, method: 'GET' },
    ];
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ENDPOINT STATUS CHECK');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    for (const endpoint of endpoints) {
        try {
            const options = {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            if (endpoint.method === 'POST') {
                options.body = JSON.stringify({ test: true });
            }
            
            const response = await fetch(endpoint.url, options);
            const status = response.status;
            
            let statusIcon = '❌';
            let statusText = 'NOT FOUND';
            
            if (status === 200) {
                statusIcon = '✅';
                statusText = 'OK';
            } else if (status === 400 || status === 404 && endpoint.method === 'GET') {
                statusIcon = '⚠️';
                statusText = 'EXISTS (validation error)';
            } else if (status === 404) {
                statusIcon = '❌';
                statusText = 'NOT FOUND';
            } else if (status >= 500) {
                statusIcon = '🔴';
                statusText = 'SERVER ERROR';
            }
            
            console.log(`${statusIcon} ${endpoint.name}`);
            console.log(`   Status: ${status} - ${statusText}`);
            console.log(`   URL: ${endpoint.url}`);
            console.log();
            
        } catch (error) {
            console.log(`❌ ${endpoint.name}`);
            console.log(`   Error: ${error.message}`);
            console.log();
        }
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DEPLOYMENT RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('If endpoints show "NOT FOUND":');
    console.log('1. Commit your changes: git add . && git commit -m "Add teacher action endpoint"');
    console.log('2. Push to main branch: git push origin main');
    console.log('3. Wait 5-10 minutes for GitHub Actions to deploy');
    console.log('4. Run this script again to verify deployment');
    console.log('\nGitHub Actions URL:');
    console.log('https://github.com/YOUR_USERNAME/YOUR_REPO/actions');
}

checkDeploymentStatus();
