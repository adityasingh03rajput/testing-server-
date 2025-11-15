/**
 * MediaPipe Face Detection and Liveness Detection Service
 * Replaces face-api.js with Google's MediaPipe for better accuracy and anti-spoofing
 */

const { FaceLandmarker, FilesetResolver, DrawingUtils } = require('@mediapipe/tasks-vision');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

class MediaPipeService {
    constructor() {
        this.faceLandmarker = null;
        this.isInitialized = false;
        this.modelPath = path.join(__dirname, '../models/mediapipe');
    }

    /**
     * Initialize MediaPipe models
     */
    async initialize() {
        try {
            console.log('🚀 Initializing MediaPipe Face Landmarker...');

            // Create model directory if it doesn't exist
            if (!fs.existsSync(this.modelPath)) {
                fs.mkdirSync(this.modelPath, { recursive: true });
            }

            // Initialize MediaPipe
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            // Create Face Landmarker
            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: "CPU"
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: "IMAGE",
                numFaces: 1
            });

            this.isInitialized = true;
            console.log('✅ MediaPipe initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ MediaPipe initialization failed:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Check if models are loaded
     */
    isReady() {
        return this.isInitialized && this.faceLandmarker !== null;
    }

    /**
     * Alias for isReady() - for compatibility
     */
    isInitialized() {
        return this.isReady();
    }

    /**
     * Detect face and extract features
     */
    async detectFace(imageBuffer) {
        if (!this.isReady()) {
            throw new Error('MediaPipe not initialized');
        }

        try {
            // Load image
            const image = await loadImage(imageBuffer);
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            // Detect face
            const startTime = Date.now();
            const results = await this.faceLandmarker.detect(canvas);
            const detectionTime = Date.now() - startTime;

            if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
                return {
                    success: false,
                    message: 'No face detected',
                    detectionTime
                };
            }

            // Extract face data
            const faceLandmarks = results.faceLandmarks[0];
            const faceBlendshapes = results.faceBlendshapes?.[0];
            const transformationMatrix = results.facialTransformationMatrixes?.[0];

            // Create face descriptor (embedding)
            const descriptor = this.createDescriptor(faceLandmarks);

            return {
                success: true,
                landmarks: faceLandmarks,
                blendshapes: faceBlendshapes,
                transformationMatrix: transformationMatrix,
                descriptor: descriptor,
                detectionTime
            };

        } catch (error) {
            console.error('❌ Face detection error:', error);
            throw error;
        }
    }

    /**
     * Create face descriptor from landmarks
     * This is used for face matching
     */
    createDescriptor(landmarks) {
        // Extract key facial features
        const keyPoints = [
            0, 1, 4, 5, 6, 7, 8, 10, 13, 14, 17, 21, 33, 37, 39, 40, 46, 52, 
            53, 54, 55, 58, 61, 63, 65, 66, 67, 70, 78, 80, 81, 82, 84, 87, 
            88, 91, 93, 95, 103, 105, 107, 109, 127, 132, 133, 136, 144, 145, 
            146, 148, 149, 150, 152, 153, 154, 155, 157, 158, 159, 160, 161, 
            162, 163, 168, 172, 173, 176, 178, 181, 185, 191, 195, 197, 234, 
            249, 263, 267, 269, 270, 276, 282, 283, 284, 285, 288, 291, 293, 
            295, 296, 297, 300, 308, 310, 311, 312, 314, 317, 318, 321, 323, 
            324, 332, 334, 336, 338, 356, 361, 362, 365, 373, 374, 375, 377, 
            378, 379, 380, 381, 382, 384, 385, 386, 387, 388, 389, 390, 397, 
            398, 400, 402, 405, 409, 415, 454, 466
        ];

        // Create descriptor from key points
        const descriptor = [];
        keyPoints.forEach(idx => {
            if (landmarks[idx]) {
                descriptor.push(landmarks[idx].x, landmarks[idx].y, landmarks[idx].z || 0);
            }
        });

        return descriptor;
    }

    /**
     * Compare two face descriptors
     */
    compareDescriptors(descriptor1, descriptor2) {
        if (!descriptor1 || !descriptor2) {
            return { distance: 1, match: false, confidence: 0 };
        }

        // Calculate Euclidean distance
        let sum = 0;
        const minLength = Math.min(descriptor1.length, descriptor2.length);
        
        for (let i = 0; i < minLength; i++) {
            const diff = descriptor1[i] - descriptor2[i];
            sum += diff * diff;
        }

        const distance = Math.sqrt(sum / minLength);

        // MediaPipe threshold (lower is better)
        const threshold = 0.15; // Adjust based on testing
        const match = distance < threshold;
        
        // Convert to confidence percentage
        const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

        return {
            distance,
            match,
            confidence: Math.round(confidence)
        };
    }

    /**
     * LIVENESS DETECTION - Detect if face is real or photo
     * This is the key anti-spoofing feature
     */
    async detectLiveness(imageBuffer) {
        if (!this.isReady()) {
            throw new Error('MediaPipe not initialized');
        }

        try {
            const faceData = await this.detectFace(imageBuffer);
            
            if (!faceData.success) {
                return {
                    isLive: false,
                    confidence: 0,
                    reason: 'No face detected'
                };
            }

            // Check 1: Face depth analysis
            const depthScore = this.analyzeDepth(faceData.landmarks);

            // Check 2: Face blendshapes (3D features)
            const blendshapeScore = this.analyzeBlendshapes(faceData.blendshapes);

            // Check 3: Transformation matrix (3D orientation)
            const orientationScore = this.analyzeOrientation(faceData.transformationMatrix);

            // Combined liveness score
            const livenessScore = (depthScore + blendshapeScore + orientationScore) / 3;
            const isLive = livenessScore > 0.6; // Threshold

            return {
                isLive,
                confidence: Math.round(livenessScore * 100),
                scores: {
                    depth: Math.round(depthScore * 100),
                    blendshape: Math.round(blendshapeScore * 100),
                    orientation: Math.round(orientationScore * 100)
                },
                reason: isLive ? 'Real face detected' : 'Possible photo/screen detected'
            };

        } catch (error) {
            console.error('❌ Liveness detection error:', error);
            return {
                isLive: false,
                confidence: 0,
                reason: 'Liveness check failed: ' + error.message
            };
        }
    }

    /**
     * Analyze face depth (Z-axis variation)
     * Real faces have depth, photos are flat
     */
    analyzeDepth(landmarks) {
        if (!landmarks || landmarks.length === 0) return 0;

        // Calculate Z-axis variance
        const zValues = landmarks.map(l => l.z || 0);
        const avgZ = zValues.reduce((a, b) => a + b, 0) / zValues.length;
        const variance = zValues.reduce((sum, z) => sum + Math.pow(z - avgZ, 2), 0) / zValues.length;
        const stdDev = Math.sqrt(variance);

        // Real faces: stdDev > 0.02
        // Photos: stdDev < 0.01
        return Math.min(1, stdDev / 0.03);
    }

    /**
     * Analyze face blendshapes
     * Real faces have natural expressions, photos don't
     */
    analyzeBlendshapes(blendshapes) {
        if (!blendshapes || !blendshapes.categories) return 0.5;

        // Check for natural micro-expressions
        const expressionVariance = blendshapes.categories
            .map(c => c.score)
            .reduce((sum, score) => sum + Math.abs(score - 0.5), 0) / blendshapes.categories.length;

        // Real faces have some expression variance
        return Math.min(1, expressionVariance * 2);
    }

    /**
     * Analyze 3D face orientation
     * Real faces have proper 3D transformation, photos don't
     */
    analyzeOrientation(matrix) {
        if (!matrix || !matrix.data) return 0.5;

        // Check transformation matrix for 3D properties
        // Real faces have proper rotation/translation
        // Photos have flat/identity-like matrices
        
        const data = matrix.data;
        const hasRotation = Math.abs(data[0]) < 0.99 || Math.abs(data[4]) < 0.99;
        const hasTranslation = Math.abs(data[12]) > 0.01 || Math.abs(data[13]) > 0.01;

        return (hasRotation ? 0.5 : 0) + (hasTranslation ? 0.5 : 0);
    }

    /**
     * Verify face with liveness check
     * Main function for face verification
     */
    async verifyFaceWithLiveness(capturedImageBuffer, referenceImageBuffer) {
        try {
            console.log('🔍 Starting MediaPipe face verification with liveness check...');

            // Step 1: Detect captured face
            const capturedFace = await this.detectFace(capturedImageBuffer);
            if (!capturedFace.success) {
                return {
                    success: false,
                    match: false,
                    confidence: 0,
                    message: 'No face detected in captured image'
                };
            }

            // Step 2: Liveness detection
            const liveness = await this.detectLiveness(capturedImageBuffer);
            if (!liveness.isLive) {
                console.log('⚠️ Liveness check failed:', liveness.reason);
                return {
                    success: false,
                    match: false,
                    confidence: 0,
                    message: `Liveness check failed: ${liveness.reason}`,
                    liveness: liveness
                };
            }

            console.log('✅ Liveness check passed:', liveness.confidence + '%');

            // Step 3: Detect reference face
            const referenceFace = await this.detectFace(referenceImageBuffer);
            if (!referenceFace.success) {
                return {
                    success: false,
                    match: false,
                    confidence: 0,
                    message: 'No face detected in reference image'
                };
            }

            // Step 4: Compare faces
            const comparison = this.compareDescriptors(
                capturedFace.descriptor,
                referenceFace.descriptor
            );

            console.log(`📊 Face match: ${comparison.match ? 'YES' : 'NO'} (${comparison.confidence}%)`);

            return {
                success: true,
                match: comparison.match,
                confidence: comparison.confidence,
                distance: comparison.distance,
                liveness: liveness,
                message: comparison.match ? 'Face verified successfully' : 'Face does not match',
                detectionTime: capturedFace.detectionTime + referenceFace.detectionTime
            };

        } catch (error) {
            console.error('❌ Face verification error:', error);
            return {
                success: false,
                match: false,
                confidence: 0,
                message: 'Verification error: ' + error.message
            };
        }
    }
}

// Singleton instance
const mediaPipeService = new MediaPipeService();

module.exports = mediaPipeService;
