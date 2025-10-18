# Photo Guidelines for Face Recognition

## Why Face Detection Failed

The error "No face detected in reference image" means face-api.js couldn't find a face in your profile photo. This usually happens when:

1. **Poor lighting** - Face is too dark or shadowed
2. **Low resolution** - Image is too small or blurry
3. **Face too small** - Face takes up less than 20% of image
4. **Angle issues** - Face is turned away or tilted
5. **Obstructions** - Glasses, masks, hair covering face

## Photo Requirements

### For Profile Photos (Admin Panel Upload)

✅ **Good Lighting**
- Well-lit environment
- Face clearly visible
- No harsh shadows
- Natural or soft lighting

✅ **Clear Face**
- Face centered in frame
- Face takes up 40-60% of image
- Looking directly at camera
- Neutral expression

✅ **High Resolution**
- Minimum: 640x480 pixels
- Recommended: 1024x768 or higher
- Clear, not blurry
- JPEG or PNG format

✅ **No Obstructions**
- Remove sunglasses
- Remove masks
- Hair not covering face
- Clear view of eyes, nose, mouth

❌ **Avoid**
- Selfies with filters
- Group photos
- Side profile shots
- Photos with hats/caps
- Very old photos
- Low-light photos
- Blurry or pixelated images

### For Verification Photos (Mobile App Capture)

✅ **Same Conditions as Profile**
- Similar lighting
- Similar angle (front-facing)
- Similar distance from camera
- No obstructions

✅ **Camera Tips**
- Hold phone steady
- Look directly at camera
- Ensure good lighting
- Remove glasses if possible

## How to Fix "No Face Detected"

### Step 1: Check Your Profile Photo

1. Open admin panel
2. View your profile photo
3. Check if face is clearly visible
4. Verify photo meets requirements above

### Step 2: Re-upload Better Photo

1. Take a new photo with good lighting
2. Ensure face is centered and clear
3. Upload via admin panel
4. Wait for upload to complete

### Step 3: Test Again

1. Open mobile app
2. Try face verification again
3. Ensure good lighting when capturing
4. Look directly at camera

## Example Good Photos

### ✅ Good Profile Photo
```
- Face centered
- Good lighting
- Clear features
- Front-facing
- No obstructions
- High resolution
```

### ❌ Bad Profile Photo
```
- Face in shadow
- Blurry image
- Side profile
- Wearing sunglasses
- Low resolution
- Face too small
```

## Technical Details

Face-api.js uses TinyFaceDetector which:
- Detects faces in images
- Requires minimum face size of ~80x80 pixels in image
- Works best with front-facing photos
- Needs clear facial features (eyes, nose, mouth)

The system tries 4 different detection settings:
1. High quality (inputSize: 512, threshold: 0.5)
2. Medium quality (inputSize: 416, threshold: 0.4)
3. Lower quality (inputSize: 320, threshold: 0.3)
4. Lowest quality (inputSize: 224, threshold: 0.2)

If all 4 attempts fail, it means the face is not detectable.

## Troubleshooting

### "No face detected in captured image"
- Improve lighting when capturing
- Hold camera steady
- Look directly at camera
- Move closer to camera

### "No face detected in reference image"
- Re-upload profile photo
- Use better quality photo
- Ensure face is clearly visible
- Follow photo guidelines above

### Low confidence score (<70%)
- Use similar lighting for both photos
- Capture from same angle as profile
- Ensure both photos are clear
- Remove obstructions (glasses, etc.)

## Best Practices

1. **Upload Profile Photo**
   - Use professional-quality photo
   - Good lighting, clear face
   - Front-facing, neutral expression
   - High resolution (1024x768+)

2. **Capture Verification Photo**
   - Use same lighting as profile
   - Same angle (front-facing)
   - Look directly at camera
   - Hold phone steady

3. **Environment**
   - Well-lit room
   - Natural light if possible
   - Avoid backlighting
   - No harsh shadows

## Need Help?

If you continue to have issues:
1. Check server logs for detailed error messages
2. Verify models are loaded: "✅ Face-api.js models loaded successfully"
3. Try different profile photos
4. Ensure good lighting conditions
5. Contact administrator if problems persist
