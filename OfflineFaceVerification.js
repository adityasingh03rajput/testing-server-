import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * SERVER-SIDE FACE VERIFICATION (Optimized)
 * 
 * Security Measures:
 * 1. All verification happens on server (secure)
 * 2. Only sends compressed image (reduced bandwidth)
 * 3. Server fetches reference photo from database
 * 4. No client-side models needed (faster app startup)
 */

const API_URL = 'https://google-8j5x.onrender.com';

// Initialize - no-op for server-side verification
export const initializeFaceAPI = async () => {
    console.log('✅ Using server-side face verification');
    return true;
};

// Main verification function - SERVER-SIDE (Optimized)
export const verifyFaceOffline = async (capturedImageUri, _referenceImageUri, userId) => {
    try {
        console.log('🔍 Starting server-side face verification...');
        console.log('User ID:', userId);

        // Compress image to reduce upload size (640px width, 70% quality)
        const compressed = await ImageManipulator.manipulateAsync(
            capturedImageUri,
            [{ resize: { width: 640 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Read compressed image as base64
        const capturedBase64 = await FileSystem.readAsStringAsync(compressed.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        console.log('📤 Sending to server (size:', Math.round(capturedBase64.length / 1024), 'KB)');

        // Delete temporary compressed file
        await FileSystem.deleteAsync(compressed.uri, { idempotent: true });

        // Send to server for verification
        const response = await fetch(`${API_URL}/api/verify-face`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                capturedImage: capturedBase64,
            }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Server response:', result.message);

        return {
            success: result.success,
            match: result.match,
            confidence: result.confidence,
            message: result.message,
        };
    } catch (error) {
        console.error('❌ Verification error:', error);
        return {
            success: false,
            match: false,
            confidence: 0,
            message: 'Verification error: ' + error.message
        };
    }
};

// Check if models are loaded (always true for server-side)
export const areModelsLoaded = () => true;
