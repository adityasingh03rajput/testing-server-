const zlib = require('zlib');

/**
 * Ultra-fast response compression and optimization
 */
class ResponseOptimizer {
  /**
   * Compress response data
   */
  static compress(data) {
    if (typeof data === 'string') {
      return zlib.gzipSync(data);
    }
    return zlib.gzipSync(JSON.stringify(data));
  }

  /**
   * Minimize JSON response (remove unnecessary fields)
   */
  static minimizeResponse(data) {
    // Remove null/undefined values
    const cleaned = {};
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        cleaned[key] = data[key];
      }
    }
    return cleaned;
  }

  /**
   * Create lightweight response
   */
  static createLightResponse(success, data, error = null) {
    const response = { s: success ? 1 : 0 }; // s = success (1 byte vs 7 bytes)
    
    if (data) {
      // Use short keys to reduce payload size
      if (data.isMatch !== undefined) response.m = data.isMatch ? 1 : 0; // m = match
      if (data.confidence) response.c = parseFloat(data.confidence); // c = confidence
      if (data.distance) response.d = parseFloat(data.distance); // d = distance
      if (data.cached !== undefined) response.ch = data.cached ? 1 : 0; // ch = cached
      if (data.studentId) response.id = data.studentId;
      if (data.studentName) response.n = data.studentName;
      if (data.processingTime) response.t = data.processingTime; // t = time
    }
    
    if (error) response.e = error; // e = error
    
    return response;
  }

  /**
   * Parse lightweight request
   */
  static parseLightRequest(req) {
    const body = req.body;
    return {
      imageData: body.img || body.imageData,
      studentId: body.id || body.studentId,
      threshold: body.th || body.threshold || 0.6,
      semester: body.sem || body.semester,
      branch: body.br || body.branch
    };
  }
}

module.exports = ResponseOptimizer;
