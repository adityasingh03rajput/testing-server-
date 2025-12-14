/**
 * MediaPipe Face Verification Routes
 * Handles face verification with liveness detection
 */

const express = require('express');
const router = express.Router();
const mediaPipeService = require('../mediapipe-service');
const StudentManagement = require('../models/StudentManagement');
const Teacher = require('../models/Teacher');

/**
 * Face Verification with Liveness Detection
 * POST /api/mediapipe/verify-face
 */
router.post('/verify-face', async (req, res) => {
    try {
        const { userId, capturedImage } = req.body;

        console.log('📸 MediaPipe face verification request for user:', userId);

        if (!userId || !capturedImage) {
            return res.status(400).json({
                success: false,
                match: false,
                confidence: 0,
                message: 'Missing userId or capturedImage'
            });
        }

        // Find user
        let user = await StudentManagement.findOne({
            $or: [
                { _id: userId },
                { enrollmentNo: userId }
            ]
        });

        if (!user) {
            user = await Teacher.findOne({
                $or: [
                    { _id: userId },
                    { employeeId: userId }
                ]
            });
        }

        if (!user) {
            console.log('❌ User not found:', userId);
            return res.json({
                success: false,
                match: false,
                confidence: 0,
                message: 'User not found'
            });
        }

        // Check if user has photo
        if (!user.photoUrl) {
            console.log('❌ User has no profile photo');
            return res.json({
                success: false,
                match: false,
                confidence: 0,
                message: 'No profile photo found. Please upload your photo in admin panel.'
            });
        }

        // Convert captured image from base64
        const capturedImageBuffer = Buffer.from(
            capturedImage.replace(/^data:image\/\w+;base64,/, ''),
            'base64'
        );

        // Load reference photo
        let referenceImageBase64 = '';
        if (user.photoUrl.startsWith('data:image')) {
            referenceImageBase64 = user.photoUrl.replace(/^data:image\/\w+;base64,/, '');
        } else {
            // Handle Cloudinary or other URLs
            const axios = require('axios');
            const response = await axios.get(user.photoUrl, { responseType: 'arraybuffer' });
            referenceImageBase64 = Buffer.from(response.data, 'binary').toString('base64');
        }

        const referenceImageBuffer = Buffer.from(referenceImageBase64, 'base64');

        // Verify face with liveness detection
        console.log('🤖 Using MediaPipe for verification with liveness check...');
        const result = await mediaPipeService.verifyFaceWithLiveness(
            capturedImageBuffer,
            referenceImageBuffer
        );

        if (!result.success) {
            console.log('❌ Face verification failed:', result.message);
            return res.json(result);
        }

        // Log result
        console.log(`📊 Verification result:`);
        console.log(`   User: ${user.name}`);
        console.log(`   Match: ${result.match ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   Confidence: ${result.confidence}%`);
        console.log(`   Liveness: ${result.liveness.isLive ? 'REAL ✅' : 'FAKE ❌'} (${result.liveness.confidence}%)`);

        // Update user verification status
        await StudentManagement.findByIdAndUpdate(user._id, {
            lastFaceVerification: new Date(),
            lastVerificationResult: result.match,
            lastVerificationConfidence: result.confidence
        });

        return res.json({
            success: result.success,
            match: result.match,
            confidence: result.confidence,
            liveness: result.liveness,
            message: result.message,
            detectionTime: result.detectionTime
        });

    } catch (error) {
        console.error('❌ Face verification error:', error);
        res.status(500).json({
            success: false,
            match: false,
            confidence: 0,
            message: 'Verification error: ' + error.message
        });
    }
});

/**
 * Liveness Check Only
 * POST /api/mediapipe/check-liveness
 */
router.post('/check-liveness', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Missing image'
            });
        }

        const imageBuffer = Buffer.from(
            image.replace(/^data:image\/\w+;base64,/, ''),
            'base64'
        );

        const result = await mediaPipeService.detectLiveness(imageBuffer);

        return res.json({
            success: true,
            liveness: result
        });

    } catch (error) {
        console.error('❌ Liveness check error:', error);
        res.status(500).json({
            success: false,
            message: 'Liveness check error: ' + error.message
        });
    }
});

/**
 * Health check
 * GET /api/mediapipe/health
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        ready: mediaPipeService.isReady(),
        service: 'MediaPipe Face Verification',
        features: [
            'Face Detection',
            'Face Matching',
            'Liveness Detection',
            'Anti-Spoofing'
        ]
    });
});

module.exports = router;
