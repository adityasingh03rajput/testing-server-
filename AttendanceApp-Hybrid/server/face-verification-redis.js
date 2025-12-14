const { getRedisClient } = require('./redis-client');
const faceapi = require('@vladmandic/face-api');

/**
 * Redis-cached face verification service
 * Dramatically speeds up face verification by caching descriptors
 */
class FaceVerificationRedis {
  constructor() {
    this.CACHE_TTL = 3600; // 1 hour cache
    this.DESCRIPTOR_PREFIX = 'face:descriptor:';
    this.STUDENT_FACES_PREFIX = 'face:student:';
  }

  /**
   * Cache student face descriptor
   */
  async cacheStudentDescriptor(studentId, descriptor) {
    try {
      const client = await getRedisClient();
      if (!client) return false;

      const key = `${this.DESCRIPTOR_PREFIX}${studentId}`;
      const descriptorArray = Array.from(descriptor);
      
      await client.setEx(
        key,
        this.CACHE_TTL,
        JSON.stringify(descriptorArray)
      );

      console.log(`✅ Cached face descriptor for student: ${studentId}`);
      return true;
    } catch (error) {
      console.error('Error caching descriptor:', error);
      return false;
    }
  }

  /**
   * Get cached student face descriptor
   */
  async getCachedDescriptor(studentId) {
    try {
      const client = await getRedisClient();
      if (!client) return null;

      const key = `${this.DESCRIPTOR_PREFIX}${studentId}`;
      const cached = await client.get(key);

      if (cached) {
        const descriptorArray = JSON.parse(cached);
        console.log(`✅ Retrieved cached descriptor for student: ${studentId}`);
        return new Float32Array(descriptorArray);
      }

      return null;
    } catch (error) {
      console.error('Error getting cached descriptor:', error);
      return null;
    }
  }

  /**
   * Cache all student descriptors for batch verification
   */
  async cacheAllStudentDescriptors(students) {
    try {
      const client = await getRedisClient();
      if (!client) return 0;

      let cached = 0;
      const pipeline = client.multi();

      for (const student of students) {
        if (student.faceDescriptor) {
          const key = `${this.DESCRIPTOR_PREFIX}${student.enrollmentNo}`;
          const descriptorArray = Array.isArray(student.faceDescriptor)
            ? student.faceDescriptor
            : Array.from(student.faceDescriptor);

          pipeline.setEx(
            key,
            this.CACHE_TTL,
            JSON.stringify(descriptorArray)
          );
          cached++;
        }
      }

      await pipeline.exec();
      console.log(`✅ Cached ${cached} student face descriptors`);
      return cached;
    } catch (error) {
      console.error('Error caching all descriptors:', error);
      return 0;
    }
  }

  /**
   * Fast face verification using Redis cache
   */
  async verifyFaceWithCache(capturedDescriptor, studentId, threshold = 0.6) {
    try {
      // Try to get from cache first
      let storedDescriptor = await this.getCachedDescriptor(studentId);

      // If not in cache, return null (caller should fetch from DB and cache)
      if (!storedDescriptor) {
        console.log(`⚠️ No cached descriptor for student: ${studentId}`);
        return null;
      }

      // Calculate distance
      const distance = faceapi.euclideanDistance(capturedDescriptor, storedDescriptor);
      const isMatch = distance < threshold;

      console.log(`Face verification: distance=${distance.toFixed(4)}, threshold=${threshold}, match=${isMatch}`);

      return {
        isMatch,
        distance,
        confidence: (1 - distance).toFixed(4),
        cached: true
      };
    } catch (error) {
      console.error('Error in cached face verification:', error);
      return null;
    }
  }

  /**
   * Batch verify face against multiple students (ultra-fast)
   */
  async batchVerifyWithCache(capturedDescriptor, studentIds, threshold = 0.6) {
    try {
      const client = await getRedisClient();
      if (!client) return [];

      // Get all descriptors in one batch
      const keys = studentIds.map(id => `${this.DESCRIPTOR_PREFIX}${id}`);
      const cachedDescriptors = await client.mGet(keys);

      const results = [];

      for (let i = 0; i < studentIds.length; i++) {
        if (cachedDescriptors[i]) {
          const descriptorArray = JSON.parse(cachedDescriptors[i]);
          const storedDescriptor = new Float32Array(descriptorArray);
          const distance = faceapi.euclideanDistance(capturedDescriptor, storedDescriptor);
          
          if (distance < threshold) {
            results.push({
              studentId: studentIds[i],
              distance,
              confidence: (1 - distance).toFixed(4),
              isMatch: true
            });
          }
        }
      }

      // Sort by distance (best match first)
      results.sort((a, b) => a.distance - b.distance);

      console.log(`✅ Batch verified against ${studentIds.length} students, found ${results.length} matches`);
      return results;
    } catch (error) {
      console.error('Error in batch verification:', error);
      return [];
    }
  }

  /**
   * Invalidate cache for a student (when photo is updated)
   */
  async invalidateCache(studentId) {
    try {
      const client = await getRedisClient();
      if (!client) return false;

      const key = `${this.DESCRIPTOR_PREFIX}${studentId}`;
      await client.del(key);

      console.log(`✅ Invalidated cache for student: ${studentId}`);
      return true;
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return false;
    }
  }

  /**
   * Clear all face descriptor caches
   */
  async clearAllCaches() {
    try {
      const client = await getRedisClient();
      if (!client) return false;

      const keys = await client.keys(`${this.DESCRIPTOR_PREFIX}*`);
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`✅ Cleared ${keys.length} cached descriptors`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing caches:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const client = await getRedisClient();
      if (!client) return null;

      const keys = await client.keys(`${this.DESCRIPTOR_PREFIX}*`);
      const info = await client.info('memory');

      return {
        cachedDescriptors: keys.length,
        memoryUsed: info.match(/used_memory_human:(.+)/)?.[1]?.trim(),
        connected: true
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { connected: false };
    }
  }
}

// Singleton instance
const faceVerificationRedis = new FaceVerificationRedis();

module.exports = faceVerificationRedis;
