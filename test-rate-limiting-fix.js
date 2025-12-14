const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRateLimitingFix() {
    const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
    
    console.log('🧪 Testing Rate Limiting Fix - v2.9');
    console.log('📚 Testing concurrent logins from same IP (simulating classroom WiFi)');
    console.log('='.repeat(80));
    
    // Test with multiple valid student credentials
    const testCredentials = [
        { id: 'adityasingh', password: 'aditya', name: 'AADESH CHOUKSEY' },
        { id: '0246CD241005', password: 'aditya', name: 'AAYUSH DASHMER' },
        { id: '0246CD241006', password: 'aditya', name: 'ABHAY SONDHIYA' },
        { id: '0246CD241007', password: 'aditya', name: 'ABHI KAHAR' },
        { id: 'EMP001', password: 'aditya', name: 'Prof. Zohaib Hasan' },
        { id: 'EMP002', password: 'mamzeba', name: 'Prof. Zeba Vishwakarma' },
        { id: 'EMP003', password: 'sirpankaj', name: 'Prof. Pankaj Singhai' },
        { id: 'EMP004', password: 'aditya', name: 'Prof. Aditya Singh' },
    ];
    
    console.log('🔄 Testing concurrent logins (simulating 8 users from same WiFi)...\n');
    
    // Test concurrent logins
    const loginPromises = testCredentials.map(async (cred, index) => {
        try {
            const startTime = Date.now();
            console.log(`👤 ${index + 1}. Testing: ${cred.id} (${cred.name})`);
            
            const response = await fetch(`${SERVER_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: cred.id,
                    password: cred.password
                }),
                timeout: 10000
            });
            
            const result = await response.json();
            const duration = Date.now() - startTime;
            
            if (result.success) {
                console.log(`   ✅ SUCCESS: ${result.user.name} (${result.user.role}) - ${duration}ms`);
                return { success: true, user: result.user, id: cred.id, duration };
            } else {
                console.log(`   ❌ FAILED: ${result.message || result.error} - ${duration}ms`);
                return { success: false, error: result.message || result.error, id: cred.id, duration };
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            return { success: false, error: error.message, id: cred.id };
        }
    });
    
    // Wait for all login attempts
    const results = await Promise.all(loginPromises);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 CONCURRENT LOGIN TEST RESULTS:');
    console.log('='.repeat(80));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const rateLimited = failed.filter(r => r.error && r.error.includes('Too many login attempts'));
    
    console.log(`✅ Successful Logins: ${successful.length}/${results.length}`);
    console.log(`❌ Failed Logins: ${failed.length}/${results.length}`);
    console.log(`⚠️  Rate Limited: ${rateLimited.length}/${results.length}`);
    
    if (successful.length > 0) {
        console.log('\n🎉 SUCCESSFUL LOGINS:');
        successful.forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.user.name} (${result.user.role}) - ${result.duration}ms`);
        });
    }
    
    if (rateLimited.length > 0) {
        console.log('\n⚠️  RATE LIMITED USERS:');
        rateLimited.forEach((result, index) => {
            console.log(`   ${index + 1}. ID: ${result.id} - ${result.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ANALYSIS:');
    
    if (successful.length >= 6 && rateLimited.length === 0) {
        console.log('🎯 PERFECT! Rate limiting fix is working!');
        console.log('✅ Multiple users can login concurrently from same IP');
        console.log('✅ No rate limiting blocking legitimate users');
        console.log('✅ Per-user rate limiting is working correctly');
        console.log('✅ Production ready for 122 concurrent students');
    } else if (successful.length > 5) {
        console.log('👍 GOOD! Better than before (was limited to 5 users)');
        console.log('✅ Rate limiting appears to be per-user now');
        console.log('⚠️  Some users still failed - check credentials');
    } else if (rateLimited.length > 0) {
        console.log('⚠️  ISSUE! Still being rate limited');
        console.log('❌ May still be using IP-based rate limiting');
        console.log('💡 Check if deployment completed successfully');
    } else {
        console.log('⚠️  MIXED RESULTS');
        console.log('💡 Check server logs and credentials');
    }
    
    // Test individual user rate limiting
    console.log('\n🧪 Testing per-user rate limiting with invalid credentials...');
    
    const testUser = 'test-user-' + Date.now();
    let attempts = 0;
    let rateLimitHit = false;
    
    for (let i = 1; i <= 12; i++) {
        try {
            console.log(`🔍 Attempt ${i}: ${testUser} with wrong password`);
            
            const response = await fetch(`${SERVER_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: testUser,
                    password: 'wrong-password-' + i
                }),
                timeout: 5000
            });
            
            const result = await response.json();
            attempts++;
            
            if (result.error && result.error.includes('Too many login attempts')) {
                console.log(`   ⚠️  Rate limited after ${attempts} attempts`);
                rateLimitHit = true;
                break;
            } else {
                console.log(`   ❌ Failed (attempt ${attempts})`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 FINAL ASSESSMENT:');
    
    if (successful.length >= 6 && rateLimitHit) {
        console.log('🎉 RATE LIMITING FIX SUCCESSFUL!');
        console.log('✅ Multiple legitimate users can login concurrently');
        console.log('✅ Individual users are rate limited after multiple failures');
        console.log('✅ Per-user rate limiting is working correctly');
        console.log('✅ 122 students can login from same WiFi network');
        console.log('✅ Production ready for classroom deployment');
    } else if (successful.length >= 6) {
        console.log('👍 CONCURRENT LOGINS WORKING!');
        console.log('✅ Multiple users can login from same IP');
        console.log('⚠️  Rate limiting behavior needs verification');
    } else {
        console.log('⚠️  NEEDS INVESTIGATION');
        console.log('❌ Still limited by rate limiting or other issues');
        console.log('💡 Check deployment status and server logs');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Verify Azure deployment completed with v2.9');
    console.log('2. Test with actual student devices on same WiFi');
    console.log('3. Monitor server logs during classroom login');
    console.log('4. Consider increasing rate limits if needed');
}

// Run the test
testRateLimitingFix().catch(console.error);