require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
const CHECK_INTERVAL = 15000; // Check every 15 seconds
const MAX_WAIT_TIME = 600000; // Max 10 minutes

async function checkEndpoint() {
    try {
        const response = await fetch(`${SOCKET_URL}/api/random-ring/teacher-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        });
        
        return response.status !== 404;
    } catch (error) {
        return false;
    }
}

async function waitForDeployment() {
    console.log('⏳ Waiting for Azure deployment to complete...\n');
    console.log(`📡 Server: ${SOCKET_URL}`);
    console.log(`🔍 Checking endpoint: /api/random-ring/teacher-action`);
    console.log(`⏱️  Checking every 15 seconds (max 10 minutes)\n`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const startTime = Date.now();
    let checkCount = 0;
    
    while (Date.now() - startTime < MAX_WAIT_TIME) {
        checkCount++;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        process.stdout.write(`\r🔄 Check #${checkCount} (${elapsed}s elapsed)...`);
        
        const isDeployed = await checkEndpoint();
        
        if (isDeployed) {
            console.log('\n\n✅ DEPLOYMENT COMPLETE!');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🎉 The teacher-action endpoint is now live!');
            console.log('📱 Teachers can now accept/reject students in the app');
            console.log('═══════════════════════════════════════════════════════════\n');
            
            // Run final verification
            console.log('Running final verification...\n');
            require('./check-azure-deployment-status.js');
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
    
    console.log('\n\n⚠️  Timeout reached (10 minutes)');
    console.log('The deployment might still be in progress.');
    console.log('Check GitHub Actions: https://github.com/adityasingh03rajput/testing-server-/actions');
}

waitForDeployment();
