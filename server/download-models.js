/**
 * Download face-api.js models
 * Downloads the required models for face recognition
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const MODEL_DIR = path.join(__dirname, 'models');

const MODELS = [
    // Tiny Face Detector (lightweight and fast)
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    
    // Face Landmark 68 - Facial landmarks
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    
    // Face Recognition - Face descriptors
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

// Create models directory
if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
    console.log('📁 Created models directory');
}

// Download a single file
function downloadFile(filename) {
    return new Promise((resolve, reject) => {
        const url = MODEL_BASE_URL + filename;
        const filepath = path.join(MODEL_DIR, filename);

        // Check if file already exists
        if (fs.existsSync(filepath)) {
            console.log(`✅ ${filename} (already exists)`);
            resolve();
            return;
        }

        console.log(`📥 Downloading ${filename}...`);

        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`✅ ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Download all models
async function downloadAllModels() {
    console.log('========================================');
    console.log('📦 Downloading face-api.js models');
    console.log('========================================\n');

    try {
        for (const model of MODELS) {
            await downloadFile(model);
        }

        console.log('\n========================================');
        console.log('✅ All models downloaded successfully!');
        console.log('========================================');
        console.log('\nModels saved to:', MODEL_DIR);
        console.log('\nYou can now start the server:');
        console.log('  node index.js\n');
    } catch (error) {
        console.error('\n❌ Error downloading models:', error.message);
        console.log('\n💡 You can manually download models from:');
        console.log('   https://github.com/vladmandic/face-api/tree/master/model');
        console.log('   Save them to:', MODEL_DIR);
        process.exit(1);
    }
}

// Run download
downloadAllModels();
