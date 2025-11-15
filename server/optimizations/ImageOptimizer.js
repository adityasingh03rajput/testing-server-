const sharp = require('sharp');

/**
 * Image optimization for faster processing
 */
class ImageOptimizer {
  /**
   * Optimize image before face detection
   * Reduces size while maintaining face detection accuracy
   */
  static async optimizeForFaceDetection(base64Image) {
    try {
      // Remove data URL prefix
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Optimize image
      const optimized = await sharp(buffer)
        .resize(640, 480, { // Optimal size for face detection
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 }) // Good balance of quality/size
        .toBuffer();

      return optimized;
    } catch (error) {
      console.error('Image optimization error:', error);
      // Fallback to original
      return Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }
  }

  /**
   * Quick image validation
   */
  static isValidImage(base64Image) {
    if (!base64Image || typeof base64Image !== 'string') return false;
    if (base64Image.length < 100) return false; // Too small
    if (base64Image.length > 10000000) return false; // Too large (10MB)
    return true;
  }

  /**
   * Get image dimensions without full decode
   */
  static async getImageDimensions(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return { width: metadata.width, height: metadata.height };
    } catch (error) {
      return null;
    }
  }
}

module.exports = ImageOptimizer;
