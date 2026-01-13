/**
 * Debug bcrypt issue
 */

console.log('🔍 Debugging bcrypt issue...');

try {
    console.log('1. Trying to require bcryptjs...');
    const bcryptjs = require('bcryptjs');
    console.log('✅ bcryptjs loaded successfully');
} catch (error) {
    console.log('❌ bcryptjs failed:', error.message);
}

try {
    console.log('2. Trying to require bcrypt...');
    const bcrypt = require('bcrypt');
    console.log('✅ bcrypt loaded successfully');
} catch (error) {
    console.log('❌ bcrypt failed:', error.message);
}

console.log('3. Checking package.json dependencies...');
const packageJson = require('./package.json');
console.log('bcrypt in dependencies:', !!packageJson.dependencies.bcrypt);
console.log('bcryptjs in dependencies:', !!packageJson.dependencies.bcryptjs);

console.log('4. Current working directory:', process.cwd());
console.log('5. __dirname:', __dirname);