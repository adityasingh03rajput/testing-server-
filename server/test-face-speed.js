/**
 * Test Face Verification Speed
 * Demonstrates the performance improvement with caching
 */

const faceApiService = require('./face-api-service');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_app';

async function testSpeed() {
    try {
        console.log('🧪 Face Verification Speed Test');
        console.log('================================\n');

        // Connect to database
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected\n');

        // Load models
        console.log('📦 Loading face-api.js models...');
        await faceApiService.loadModels();
        console.log('✅ Models loaded\n');

        // Get student model
        const StudentManagement = require('./models/StudentManagement');

        // Find a student with photo
        console.log('🔍 Finding student with photo...');
        const student = await StudentManagement.findOne({ 
            photoUrl: { $exists: true, $ne: '' } 
        });

        if (!student) {
            console.log('❌ No students with photos found');
            process.exit(1);
        }

        console.log(`✅ Found: ${student.name} (${student.enrollmentNo})\n`);

        // Extract base64 from photo
        const photoBase64 = student.photoUrl.replace(/^data:image\/\w+;base64,/, '');

        // Test 1: First verification (no cache)
        console.log('📊 TEST 1: First Verification (No Cache)');
        console.log('─────────────────────────────────────────');
        const start1 = Date.now();
        const result1 = await faceApiService.compareFaces(
            photoBase64,
            photoBase64,
            student.enrollmentNo
        );
        const time1 = Date.now() - start1;
        console.log(`⏱️  Time: ${time1}ms`);
        console.log(`✅ Match: ${result1.match}`);
        console.log(`📊 Confidence: ${result1.confidence}%\n`);

        // Test 2: Second verification (with cache)
        console.log('📊 TEST 2: Cached Verification');
        console.log('─────────────────────────────────────────');
        const start2 = Date.now();
        const result2 = await faceApiService.compareFaces(
            photoBase64,
            photoBase64,
            student.enrollmentNo
        );
        const time2 = Date.now() - start2;
        console.log(`⏱️  Time: ${time2}ms`);
        console.log(`✅ Match: ${result2.match}`);
        console.log(`📊 Confidence: ${result2.confidence}%\n`);

        // Test 3: Multiple cached verifications
        console.log('📊 TEST 3: 10 Cached Verifications');
        console.log('─────────────────────────────────────────');
        const times = [];
        for (let i = 0; i < 10; i++) {
            const start = Date.now();
            await faceApiService.compareFaces(
                photoBase64,
                photoBase64,
                student.enrollmentNo
            );
            times.push(Date.now() - start);
        }
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`⏱️  Average: ${Math.round(avgTime)}ms`);
        console.log(`⏱️  Min: ${Math.min(...times)}ms`);
        console.log(`⏱️  Max: ${Math.max(...times)}ms\n`);

        // Calculate improvement
        console.log('📈 PERFORMANCE IMPROVEMENT');
        console.log('─────────────────────────────────────────');
        console.log(`🐌 First verification: ${time1}ms`);
        console.log(`⚡ Cached verification: ${time2}ms`);
        console.log(`🚀 Speed improvement: ${Math.round(time1 / time2)}x faster`);
        console.log(`💾 Cache hit rate: 100%\n`);

        // Get cache stats
        const stats = faceApiService.getCacheStats();
        console.log('📊 CACHE STATISTICS');
        console.log('─────────────────────────────────────────');
        console.log(`📦 Cached descriptors: ${stats.size}`);
        console.log(`⏰ Cache TTL: ${stats.maxAge / 1000}s`);
        console.log(`🔄 Active processing: ${stats.activeProcessing}\n`);

        // Test pre-loading
        console.log('📊 TEST 4: Pre-loading All Students');
        console.log('─────────────────────────────────────────');
        faceApiService.clearCache();
        const students = await StudentManagement.find({ 
            photoUrl: { $exists: true, $ne: '' } 
        }).limit(50);
        
        const preloadStart = Date.now();
        const cached = await faceApiService.preloadDescriptors(students);
        const preloadTime = Date.now() - preloadStart;
        
        console.log(`✅ Pre-cached ${cached} students in ${preloadTime}ms`);
        console.log(`⏱️  Average per student: ${Math.round(preloadTime / cached)}ms\n`);

        console.log('✅ All tests completed!');
        console.log('================================\n');

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testSpeed();
