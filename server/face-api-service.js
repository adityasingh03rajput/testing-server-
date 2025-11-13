/**
 * Face-API.js Service - Optimized
 * Server-side face recognition with caching
 */

const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
require('@tensorflow/tfjs');

// Patch face-api.js to use node-canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

// Descriptor cache for fast verification
const descriptorCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

/**
 * Load face-api.js models
 */
async function loadModels() {
    if (modelsLoaded) return true;

    try {
        const modelPath = path.join(__dirname, 'models');
        console.log('📦 Loading face-api.js models from:', modelPath);

        // Check if models directory exists
        const fs = require('fs');
        if (!fs.existsSync(modelPath)) {
            console.error('❌ Models directory not found:', modelPath);
            console.log('💡 Run: node download-models.js');
            return false;
        }

        // Check if model files exist
        const requiredFiles = [
            'tiny_face_detector_model-weights_manifest.json',
            'face_landmark_68_model-weights_manifest.json',
            'face_recognition_model-weights_manifest.json'
        ];

        const missingFiles = requiredFiles.filter(file => 
            !fs.existsSync(path.join(modelPath, file))
        );

        if (missingFiles.length > 0) {
            console.error('❌ Missing model files:', missingFiles.join(', '));
            console.log('💡 Run: node download-models.js');
            return false;
        }

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),
            faceapi.nets.faceLandmark68TinyNet.loadFromDisk(modelPath),
            faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
        ]);

        modelsLoaded = true;
        console.log('✅ Face-api.js models loaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Error loading models:', error.message);
        console.error('   Stack:', error.stack);
        return false;
    }
}

/**
 * Extract face descriptor from image
 */
async function getFaceDescriptor(base64Image, cacheKey = null) {
    try {
        // Check cache
        if (cacheKey && descriptorCache.has(cacheKey)) {
            const cached = descriptorCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('   ⚡ Cache hit');
                return cached.descriptor;
            }
            descriptorCache.delete(cacheKey);
        }

        // Load image
        const buffer = Buffer.from(base64Image, 'base64');
        const img = await canvas.loadImage(buffer);

        // Detect face with 3 attempts (fast to slow)
        const options = [
            new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }),
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.25 }),
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 })
        ];

        for (const option of options) {
            const detection = await faceapi
                .detectSingleFace(img, option)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                // Cache descriptor
                if (cacheKey) {
                    descriptorCache.set(cacheKey, {
                        descriptor: detection.descriptor,
                        timestamp: Date.now()
                    });
                }
                return detection.descriptor;
            }
        }

        return null;
    } catch (error) {
        console.error('   ❌ Error:', error.message);
        return null;
    }
}

/**
 * Compare two faces
 */
async function compareFaces(capturedBase64, referenceBase64, userId = null) {
    const startTime = Date.now();

    try {
        if (!modelsLoaded) {
            const loaded = await loadModels();
            if (!loaded) {
                return {
                    success: false,
                    message: 'Face recognition not available'
                };
            }
        }

        // Process both images in parallel
        const [capturedDescriptor, referenceDescriptor] = await Promise.all([
            getFaceDescriptor(capturedBase64),
            getFaceDescriptor(referenceBase64, userId) // Cache reference
        ]);

        if (!capturedDescriptor) {
            return {
                success: false,
                message: 'No face detected in captured image'
            };
        }

        if (!referenceDescriptor) {
            return {
                success: false,
                message: 'No face detected in reference photo'
            };
        }

        // Calculate distance
        const distance = faceapi.euclideanDistance(capturedDescriptor, referenceDescriptor);
        const threshold = 0.6;
        const match = distance < threshold;
        const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

        const processingTime = Date.now() - startTime;
        console.log(`⚡ Verified in ${processingTime}ms (${match ? 'MATCH' : 'NO MATCH'})`);

        return {
            success: true,
            match: match,
            confidence: Math.round(confidence),
            distance: parseFloat(distance.toFixed(3)),
            processingTime,
            message: match ? 'Face verified!' : 'Face does not match'
        };
    } catch (error) {
        console.error('❌ Comparison error:', error);
        return {
            success: false,
            message: 'Verification failed: ' + error.message
        };
    }
}

/**
 * Pre-load descriptors for all students
 */
async function preloadDescriptors(students) {
    if (!modelsLoaded) await loadModels();

    console.log(`🔄 Pre-caching ${students.length} descriptors...`);
    let cached = 0;

    // Process in batches of 10
    for (let i = 0; i < students.length; i += 10) {
        const batch = students.slice(i, i + 10);

        await Promise.all(batch.map(async (student) => {
            if (student.photoUrl && student.enrollmentNo) {
                try {
                    const base64 = student.photoUrl.replace(/^data:image\/\w+;base64,/, '');
                    await getFaceDescriptor(base64, student.enrollmentNo);
                    cached++;
                } catch (err) {
                    // Skip failed ones
                }
            }
        }));
    }

    console.log(`✅ Cached ${cached}/${students.length} descriptors`);
    return cached;
}

/**
 * Extract descriptor (for client-side verification)
 */
async function extractDescriptor(base64Image) {
    try {
        if (!modelsLoaded) {
            const loaded = await loadModels();
            if (!loaded) return null;
        }

        return await getFaceDescriptor(base64Image);
    } catch (error) {
        console.error('❌ Extract error:', error);
        return null;
    }
}

/**
 * Clear cache
 */
function clearCache() {
    const size = descriptorCache.size;
    descriptorCache.clear();
    console.log(`🗑️ Cleared ${size} cached descriptors`);
}

/**
 * Get cache stats
 */
function getCacheStats() {
    return {
        size: descriptorCache.size,
        maxAge: CACHE_TTL
    };
}

/**
 * Check if models are loaded
 */
function areModelsLoaded() {
    return modelsLoaded;
}

module.exports = {
    loadModels,
    compareFaces,
    extractDescriptor,
    areModelsLoaded,
    preloadDescriptors,
    clearCache,
    getCacheStats
};
