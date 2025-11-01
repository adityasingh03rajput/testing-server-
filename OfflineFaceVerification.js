import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Server-Side Face Verification
 * Images are sent to server and NOT saved locally
 * Server handles all verification logic
 */

const API_URL = 'http://192.168.9.31:3000';

// Main verification function - sends to server without saving
export const verifyFaceOffline = async (capturedImageUri, referenceImageUri, userId) => {
    try {
        console.log('🔍 Starting server-side face verification...');
        console.log('User ID:', userId);

        // Compress image to reduce upload size
        const compressed = await ImageManipulator.manipulateAsync(
            capturedImageUri,
            [{ resize: { width: 640 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Read compressed image as base64
        const capturedBase64 = await FileSystem.readAsStringAsync(compressed.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        console.log('📤 Sending image to server (size:', capturedBase64.length, 'chars)');

        // Delete temporary compressed file immediately
        await FileSystem.deleteAsync(compressed.uri, { idempotent: true });

        // Send to server for verification
        const response = await fetch(`${API_URL}/api/verify-face`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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

// Initialize - no-op for server-side
export const initializeFaceAPI = async () => {
    console.log('✅ Using server-side face verification');
    return true;
};

// Check if models are loaded - always true for server-side
export const areModelsLoaded = () => true;

// Detect face presence - simple check
export const detectFacePresence = async (imageUri) => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        return fileInfo.exists && fileInfo.size > 1000;
    } catch (error) {
        return false;
    }
};
