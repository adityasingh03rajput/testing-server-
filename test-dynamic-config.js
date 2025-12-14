// Test dynamic configuration endpoints
const fetch = require('node-fetch');

const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

async function testDynamicConfig() {
    console.log('🧪 Testing Dynamic Configuration Endpoints\n');
    console.log('='.repeat(80));
    
    try {
        // Test 1: Get Branches
        console.log('\n1️⃣ Testing GET /api/config/branches');
        const branchesResponse = await fetch(`${SERVER_URL}/api/config/branches`);
        const branchesData = await branchesResponse.json();
        
        if (branchesData.success) {
            console.log('✅ SUCCESS');
            console.log(`   Found ${branchesData.count} branch(es):`);
            branchesData.branches.forEach(branch => {
                console.log(`   - ${branch.name} (ID: ${branch.id})`);
            });
        } else {
            console.log('❌ FAILED:', branchesData.error);
        }
        
        // Test 2: Get Semesters
        console.log('\n2️⃣ Testing GET /api/config/semesters');
        const semestersResponse = await fetch(`${SERVER_URL}/api/config/semesters`);
        const semestersData = await semestersResponse.json();
        
        if (semestersData.success) {
            console.log('✅ SUCCESS');
            console.log(`   Found ${semestersData.count} semester(s):`);
            console.log(`   ${semestersData.semesters.join(', ')}`);
        } else {
            console.log('❌ FAILED:', semestersData.error);
        }
        
        // Test 3: Get Academic Year
        console.log('\n3️⃣ Testing GET /api/config/academic-year');
        const yearResponse = await fetch(`${SERVER_URL}/api/config/academic-year`);
        const yearData = await yearResponse.json();
        
        if (yearData.success) {
            console.log('✅ SUCCESS');
            console.log(`   Academic Year: ${yearData.academicYear}`);
            console.log(`   Start Year: ${yearData.startYear}`);
            console.log(`   End Year: ${yearData.endYear}`);
        } else {
            console.log('❌ FAILED:', yearData.error);
        }
        
        // Test 4: Get Full App Config
        console.log('\n4️⃣ Testing GET /api/config/app');
        const appConfigResponse = await fetch(`${SERVER_URL}/api/config/app`);
        const appConfigData = await appConfigResponse.json();
        
        if (appConfigData.success) {
            console.log('✅ SUCCESS');
            console.log(`   App Name: ${appConfigData.config.appName}`);
            console.log(`   Version: ${appConfigData.config.version}`);
            console.log(`   Academic Year: ${appConfigData.config.academicYear}`);
            console.log(`   Branches: ${appConfigData.config.branches.length}`);
            console.log(`   Semesters: ${appConfigData.config.semesters.length}`);
            console.log('   Features:');
            Object.entries(appConfigData.config.features).forEach(([key, value]) => {
                console.log(`     - ${key}: ${value ? '✅' : '❌'}`);
            });
        } else {
            console.log('❌ FAILED:', appConfigData.error);
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ ALL TESTS COMPLETED');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('   Make sure the server is running and accessible');
    }
}

testDynamicConfig();
