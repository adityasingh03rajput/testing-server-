const express = require('express');
const router = express.Router();
const faceVerificationRedis = require('../face-verification-redis');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;

// Patch face-api to use node-canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

/**
 * Fast face verification endpoint using Redis cache
 * POST /api/face/verify-fast
 */
router.post('/verify-fast', async (req, res) => {
  try {
    const { imageData, studentId, threshold = 0.6 } = req.body;

    if (!imageData || !studentId) {
      return res.status(400).json({ error: 'Missing imageData or studentId' });
    }

    // Decode base64 image
    const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const img = await canvas.loadImage(buffer);

    // Detect face and get descriptor
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return res.json({
        success: false,
        error: 'No face detected in image'
      });
    }

    const capturedDescriptor = detection.descriptor;

    // Try Redis cache first
    const cachedResult = await faceVerificationRedis.verifyFaceWithCache(
      capturedDescriptor,
      studentId,
      threshold
    );

    if (cachedResult) {
      // Cache hit - ultra fast!
      return res.json({
        success: true,
        isMatch: cachedResult.isMatch,
        confidence: cachedResult.confidence,
        distance: cachedResult.distance,
        cached: true,
        processingTime: '< 50ms'
      });
    }

    // Cache miss - fetch from DB and cache it
    const StudentManagement = require('../models/StudentManagement');
    const student = await StudentManagement.findOne({ enrollmentNo: studentId });

    if (!student || !student.faceDescriptor) {
      return res.json({
        success: false,
        error: 'Student not found or no face descriptor stored'
      });
    }

    // Cache the descriptor for next time
    await faceVerificationRedis.cacheStudentDescriptor(studentId, student.faceDescriptor);

    // Verify
    const storedDescriptor = new Float32Array(student.faceDescriptor);
    const distance = faceapi.euclideanDistance(capturedDescriptor, storedDescriptor);
    const isMatch = distance < threshold;

    res.json({
      success: true,
      isMatch,
      confidence: (1 - distance).toFixed(4),
      distance: distance.toFixed(4),
      cached: false,
      processingTime: '< 200ms'
    });

  } catch (error) {
    console.error('Error in fast face verification:', error);
    res.status(500).json({
      success: false,
      error: 'Face verification failed',
      details: error.message
    });
  }
});

/**
 * Batch face verification (find matching student from all)
 * POST /api/face/identify-fast
 */
router.post('/identify-fast', async (req, res) => {
  try {
    const { imageData, semester, branch, threshold = 0.6 } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Missing imageData' });
    }

    const startTime = Date.now();

    // Decode and detect face
    const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const img = await canvas.loadImage(buffer);

    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return res.json({
        success: false,
        error: 'No face detected in image'
      });
    }

    const capturedDescriptor = detection.descriptor;

    // Get all students for the semester/branch
    const StudentManagement = require('../models/StudentManagement');
    const query = {};
    if (semester) query.semester = semester;
    if (branch) query.course = branch;

    const students = await StudentManagement.find(query).select('enrollmentNo name faceDescriptor');
    const studentIds = students.map(s => s.enrollmentNo);

    // Try batch verification with cache
    const matches = await faceVerificationRedis.batchVerifyWithCache(
      capturedDescriptor,
      studentIds,
      threshold
    );

    if (matches.length > 0) {
      // Found match in cache
      const bestMatch = matches[0];
      const student = students.find(s => s.enrollmentNo === bestMatch.studentId);

      const processingTime = Date.now() - startTime;

      return res.json({
        success: true,
        identified: true,
        student: {
          enrollmentNo: student.enrollmentNo,
          name: student.name
        },
        confidence: bestMatch.confidence,
        distance: bestMatch.distance,
        cached: true,
        processingTime: `${processingTime}ms`,
        totalStudentsChecked: studentIds.length
      });
    }

    // Cache miss - do full verification and cache results
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const student of students) {
      if (!student.faceDescriptor) continue;

      const storedDescriptor = new Float32Array(student.faceDescriptor);
      const distance = faceapi.euclideanDistance(capturedDescriptor, storedDescriptor);

      // Cache this descriptor
      await faceVerificationRedis.cacheStudentDescriptor(student.enrollmentNo, student.faceDescriptor);

      if (distance < threshold && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = student;
      }
    }

    const processingTime = Date.now() - startTime;

    if (bestMatch) {
      res.json({
        success: true,
        identified: true,
        student: {
          enrollmentNo: bestMatch.enrollmentNo,
          name: bestMatch.name
        },
        confidence: (1 - bestDistance).toFixed(4),
        distance: bestDistance.toFixed(4),
        cached: false,
        processingTime: `${processingTime}ms`,
        totalStudentsChecked: students.length
      });
    } else {
      res.json({
        success: true,
        identified: false,
        message: 'No matching student found',
        processingTime: `${processingTime}ms`,
        totalStudentsChecked: students.length
      });
    }

  } catch (error) {
    console.error('Error in fast identification:', error);
    res.status(500).json({
      success: false,
      error: 'Face identification failed',
      details: error.message
    });
  }
});

/**
 * Warm up cache - preload all student descriptors
 * POST /api/face/warmup-cache
 */
router.post('/warmup-cache', async (req, res) => {
  try {
    const { semester, branch } = req.body;

    const StudentManagement = require('../models/StudentManagement');
    const query = {};
    if (semester) query.semester = semester;
    if (branch) query.course = branch;

    const students = await StudentManagement.find(query).select('enrollmentNo faceDescriptor');
    const cached = await faceVerificationRedis.cacheAllStudentDescriptors(students);

    res.json({
      success: true,
      message: 'Cache warmed up successfully',
      cachedCount: cached,
      totalStudents: students.length
    });

  } catch (error) {
    console.error('Error warming up cache:', error);
    res.status(500).json({
      success: false,
      error: 'Cache warmup failed',
      details: error.message
    });
  }
});

/**
 * Get cache statistics
 * GET /api/face/cache-stats
 */
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = await faceVerificationRedis.getCacheStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats'
    });
  }
});

/**
 * Clear cache
 * POST /api/face/clear-cache
 */
router.post('/clear-cache', async (req, res) => {
  try {
    await faceVerificationRedis.clearAllCaches();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

module.exports = router;
