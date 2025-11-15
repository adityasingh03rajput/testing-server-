const express = require('express');
const router = express.Router();
const faceVerificationRedis = require('../face-verification-redis');
const faceVerificationQueue = require('../services/FaceVerificationQueue');

/**
 * Fast face verification endpoint using queue + Redis cache
 * Handles concurrent requests efficiently
 * POST /api/face/verify-fast
 */
router.post('/verify-fast', async (req, res) => {
  try {
    const { imageData, studentId, threshold = 0.6 } = req.body;

    if (!imageData || !studentId) {
      return res.status(400).json({ error: 'Missing imageData or studentId' });
    }

    // Add to queue for parallel processing
    const result = await faceVerificationQueue.addToQueue({
      imageData,
      studentId,
      threshold,
      type: 'verify'
    });

    res.json(result);

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

    // Add to queue for parallel processing
    const result = await faceVerificationQueue.addToQueue({
      imageData,
      semester,
      branch,
      threshold,
      type: 'identify'
    });

    res.json(result);

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

/**
 * Get queue statistics
 * GET /api/face/queue-stats
 */
router.get('/queue-stats', (req, res) => {
  try {
    const stats = faceVerificationQueue.getStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue stats'
    });
  }
});

/**
 * Configure queue settings
 * POST /api/face/queue-config
 */
router.post('/queue-config', (req, res) => {
  try {
    const { maxConcurrent } = req.body;
    
    if (maxConcurrent) {
      faceVerificationQueue.setMaxConcurrent(maxConcurrent);
    }

    res.json({
      success: true,
      message: 'Queue configured successfully',
      config: {
        maxConcurrent: faceVerificationQueue.maxConcurrent
      }
    });
  } catch (error) {
    console.error('Error configuring queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure queue'
    });
  }
});

module.exports = router;
