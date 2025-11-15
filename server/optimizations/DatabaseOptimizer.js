const mongoose = require('mongoose');

/**
 * Database query optimization
 */
class DatabaseOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Optimized student query with caching
   */
  async getStudentOptimized(StudentModel, enrollmentNo) {
    const cacheKey = `student:${enrollmentNo}`;
    
    // Check cache first
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Query with minimal fields
    const student = await StudentModel
      .findOne({ enrollmentNo })
      .select('enrollmentNo name faceDescriptor semester course')
      .lean() // Returns plain JS object (faster)
      .exec();

    // Cache result
    if (student) {
      this.queryCache.set(cacheKey, {
        data: student,
        timestamp: Date.now()
      });
    }

    return student;
  }

  /**
   * Batch query optimization
   */
  async getStudentsBatch(StudentModel, query, limit = 1000) {
    const cacheKey = `batch:${JSON.stringify(query)}`;
    
    // Check cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Optimized batch query
    const students = await StudentModel
      .find(query)
      .select('enrollmentNo name faceDescriptor')
      .limit(limit)
      .lean()
      .exec();

    // Cache result
    this.queryCache.set(cacheKey, {
      data: students,
      timestamp: Date.now()
    });

    return students;
  }

  /**
   * Clear cache for specific student
   */
  invalidateStudent(enrollmentNo) {
    this.queryCache.delete(`student:${enrollmentNo}`);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.queryCache.clear();
  }

  /**
   * Configure MongoDB for optimal performance
   */
  static configureMongoose() {
    // Connection pool settings
    mongoose.set('maxPoolSize', 50); // Increase pool size
    mongoose.set('minPoolSize', 10);
    mongoose.set('socketTimeoutMS', 45000);
    mongoose.set('serverSelectionTimeoutMS', 5000);

    // Query optimization
    mongoose.set('autoIndex', false); // Disable in production
    mongoose.set('bufferCommands', false); // Fail fast
    
    console.log('✅ MongoDB optimized for performance');
  }

  /**
   * Create indexes for faster queries
   */
  static async createOptimalIndexes(StudentModel) {
    try {
      // Compound index for common queries
      await StudentModel.collection.createIndex(
        { enrollmentNo: 1, semester: 1, course: 1 },
        { background: true }
      );

      // Index for face descriptor queries
      await StudentModel.collection.createIndex(
        { enrollmentNo: 1, faceDescriptor: 1 },
        { background: true, sparse: true }
      );

      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }
}

// Singleton instance
const dbOptimizer = new DatabaseOptimizer();

module.exports = dbOptimizer;
