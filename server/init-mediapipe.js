/**
 * Initialize MediaPipe Service
 * Run this on server startup
 */

const mediaPipeService = require('./mediapipe-service');

async function initializeMediaPipe() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 Initializing MediaPipe Face Recognition System');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    try {
        const success = await mediaPipeService.initialize();

        if (success) {
            console.log('');
            console.log('✅ MediaPipe initialized successfully!');
            console.log('');
            console.log('Features enabled:');
            console.log('  ✓ Face Detection');
            console.log('  ✓ Face Matching');
            console.log('  ✓ Liveness Detection (Anti-Spoofing)');
            console.log('  ✓ 3D Face Mesh');
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
            return true;
        } else {
            console.log('');
            console.log('❌ MediaPipe initialization failed!');
            console.log('');
            console.log('Troubleshooting:');
            console.log('  1. Check internet connection (models download from CDN)');
            console.log('  2. Verify dependencies: npm install');
            console.log('  3. Check firewall/proxy settings');
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
            return false;
        }
    } catch (error) {
        console.error('');
        console.error('❌ MediaPipe initialization error:', error.message);
        console.error('');
        console.error('═══════════════════════════════════════════════════════');
        console.error('');
        return false;
    }
}

module.exports = { initializeMediaPipe };
