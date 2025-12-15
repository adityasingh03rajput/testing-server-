const faceVerificationRedis = require('../face-verification-redis');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;

// Patch face-api to use node-canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

/**
 * High-performance face verification queue
 * Handles concurrent verification requests with parallel processing
 */
class FaceVerificationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 10; // Process 10 verifications in parallel
    this.activeWorkers = 0;
    this.stats = {
      totalProcessed: 0,
      totalFailed: 0,
      averageTime: 0,
      peakConcurrent: 0
    };
  }

  /**
   * Add verification request to queue
   */
  async addToQueue(verificationRequest) {
    return new Promise((resolve, reject) => {
      const request = {
        ...verificationRequest,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.queue.push(request);
      
      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queue with parallel workers
   */
  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 || this.activeWorkers > 0) {
      // Launch workers up to max concurrent limit
      while (this.activeWorkers < this.maxConcurrent && this.queue.length > 0) {
        const request = this.queue.shift();
        this.activeWorkers++;
        
        // Update peak concurrent stat
        if (this.activeWorkers > this.stats.peakConcurrent) {
          this.stats.peakConcurrent = this.activeWorkers;
        }

        // Process in parallel (don't await)
        this.processRequest(request).finally(() => {
          this.activeWorkers--;
        });
      }

      // Wait a bit before checking again
      if (this.queue.length > 0 || this.activeWorkers > 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    this.processing = false;
  }

  /**
   * Process single verification request
   */
  async processRequest(request) {
    const startTime = Date.now();

    try {
      const { imageData, studentId, threshold = 0.6, type = 'verify' } = request;

      // Decode base64 image
      const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const img = await canvas.loadImage(buffer);

      // Detect face and get descriptor
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        request.resolve({
          success: false,
          error: 'No face detected in image',
          processingTime: Date.now() - startTime
        });
        this.stats.totalFailed++;
        return;
      }

      const capturedDescriptor = detection.descriptor;

      if (type === 'verify') {
        // Single student verification
        const result = await this.verifySingleStudent(capturedDescriptor, studentId, threshold);
        result.processingTime = Date.now() - startTime;
        request.resolve(result);
      } else if (type === 'identify') {
        // Identify from multiple students
        const result = await this.identifyStudent(capturedDescriptor, request.semester, request.branch, threshold);
        result.processingTime = Date.now() - startTime;
        request.resolve(result);
      }

      // Update stats
      this.stats.totalProcessed++;
      const totalTime = this.stats.averageTime * (this.stats.totalProcessed - 1) + (Date.now() - startTime);
      this.stats.averageTime = totalTime / this.stats.totalProcessed;

    } catch (error) {
      console.error('Error processing verification request:', error);
      request.reject({
        success: false,
        error: 'Verification failed',
        details: error.message,
        processingTime: Date.now() - startTime
      });
      this.stats.totalFailed++;
    }
  }

  /**
   * Verify against single student (with Redis cache + DB optimization)
   */
  async verifySingleStudent(capturedDescriptor, studentId, threshold) {
    // Try Redis cache first
    const cachedResult = await faceVerificationRedis.verifyFaceWithCache(
      capturedDescriptor,
      studentId,
      threshold
    );

    if (cachedResult) {
      return {
        success: true,
        isMatch: cachedResult.isMatch,
        confidence: cachedResult.confidence,
        distance: cachedResult.distance,
        cached: true,
        studentId
      };
    }

    // Cache miss - fetch from DB with optimization
    const StudentManagement = require('../models/StudentManagement');
    const dbOptimizer = require('../optimizations/DatabaseOptimizer');
    
    const student = await dbOptimizer.getStudentOptimized(StudentManagement, studentId);

    if (!student || !student.faceDescriptor) {
      return {
        success: false,
        error: 'Student not found or no face descriptor stored'
      };
    }

    // Cache for next time (fire and forget)
    faceVerificationRedis.cacheStudentDescriptor(studentId, student.faceDescriptor).catch(() => {});

    // Verify
    const storedDescriptor = new Float32Array(student.faceDescriptor);
    const distance = faceapi.euclideanDistance(capturedDescriptor, storedDescriptor);
    const isMatch = distance < threshold;

    return {
      success: true,
      isMatch,
      confidence: (1 - distance).toFixed(4),
      distance: distance.toFixed(4),
      cached: false,
      studentId,
      studentName: student.name
    };
  }

  /**
   * Identify student from batch (with Redis cache + DB optimization)
   */
  async identifyStudent(capturedDescriptor, semester, branch, threshold) {
    const StudentManagement = require('../models/StudentManagement');
    const dbOptimizer = require('../optimizations/DatabaseOptimizer');
    
    // Build query
    const query = {};
    if (semester) query.semester = semester;
    if (branch) query.course = branch;

    // Get all students with optimization
    const students = await dbOptimizer.getStudentsBatch(StudentManagement, query);
    const studentIds = students.map(s => s.enrollmentNo);

    // Try batch verification with Redis cache
    const matches = await faceVerificationRedis.batchVerifyWithCache(
      capturedDescriptor,
      studentIds,
      threshold
    );

    if (matches.length > 0) {
      // Found match in cache
      const bestMatch = matches[0];
      const student = students.find(s => s.enrollmentNo === bestMatch.studentId);

      return {
        success: true,
        identified: true,
        student: {
          enrollmentNo: student.enrollmentNo,
          name: student.name
        },
        confidence: bestMatch.confidence,
        distance: bestMatch.distance,
        cached: true,
        totalStudentsChecked: studentIds.length
      };
    }

    // Cache miss - verify against all and cache results
    let bestMatch = null;
    let bestDistance = Infinity;

    // Process in batches for better performance
    const batchSize = 20;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (student) => {
        if (!student.faceDescriptor) return;

        const storedDescriptor = new Float32Array(student.faceDescriptor);
        const distance = faceapi.euclideanDistance(capturedDescriptor, storedDescriptor);

        // Cache this descriptor for future use
        faceVerificationRedis.cacheStudentDescriptor(student.enrollmentNo, student.faceDescriptor);

        if (distance < threshold && distance < bestDistance) {
          bestDistance = distance;
          bestMatch = student;
        }
      }));
    }

    if (bestMatch) {
      return {
        success: true,
        identified: true,
        student: {
          enrollmentNo: bestMatch.enrollmentNo,
          name: bestMatch.name
        },
        confidence: (1 - bestDistance).toFixed(4),
        distance: bestDistance.toFixed(4),
        cached: false,
        totalStudentsChecked: students.length
      };
    }

    return {
      success: true,
      identified: false,
      message: 'No matching student found',
      totalStudentsChecked: students.length
    };
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeWorkers: this.activeWorkers,
      maxConcurrent: this.maxConcurrent,
      processing: this.processing,
      stats: {
        ...this.stats,
        averageTime: Math.round(this.stats.averageTime)
      }
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this.queue.forEach(request => {
      request.reject({
        success: false,
        error: 'Queue cleared'
      });
    });
    this.queue = [];
  }

  /**
   * Set max concurrent workers
   */
  setMaxConcurrent(max) {
    this.maxConcurrent = Math.max(1, Math.min(max, 50)); // Between 1 and 50
  }
}

// Singleton instance
const faceVerificationQueue = new FaceVerificationQueue();

module.exports = faceVerificationQueue;
