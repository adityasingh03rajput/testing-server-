# Release Information

## Latest Build

**Version**: 1.0.0  
**Build Date**: October 21, 2025  
**Build Type**: Debug APK

### APK Location

The debug APK is located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Or in the root directory as:
```
attendance-app-debug.apk
```

### Installation

**On Android Device:**
1. Enable "Install from Unknown Sources" in Settings
2. Transfer APK to device
3. Open and install
4. Grant camera and notification permissions

**Via ADB:**
```bash
adb install -r attendance-app-debug.apk
```

### Test Credentials

**Students:**
- Enrollment: `0246CS241001`
- Password: `aditya`

**Teachers:**
- Employee ID: `T001`
- Password: `aditya`

### What's New in This Release

✨ **Major Features:**
- Indian-themed color system with Saffron, White, Green palette
- Complete calendar with 100+ Indian holidays for 2025
- Enhanced teacher dashboard with modern UI
- Lanyard card with gyroscope swinging effect
- Period management in admin panel
- Face recognition with offline support
- Real-time attendance tracking
- Lecture-wise attendance breakdown

🎨 **UI/UX Improvements:**
- Smooth animations throughout
- Dark and Light themes
- Indian date/time formats
- Pull-to-refresh functionality
- Responsive design

🔧 **Technical Improvements:**
- Synced calendar across all platforms
- Optimized database queries
- Better error handling
- Improved offline support
- Enhanced security

### System Requirements

- Android 5.0 (Lollipop) or higher
- 100MB free storage
- Camera permission (for face verification)
- Internet connection (for real-time features)

### Known Issues

None reported in this build.

### Building from Source

See `SETUP.md` for complete build instructions.

Quick build:
```bash
BUILD_DEBUG_APK.bat
```

### Support

For issues or questions:
- GitHub: https://github.com/adityasingh03rajput/native-bunk
- Open an issue with error details

---

**Note**: This is a debug build for testing. For production, use the release build process described in SETUP.md.
