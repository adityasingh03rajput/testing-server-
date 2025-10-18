# Photo Upload System

## Overview
This system stores user profile photos on the server's file system and saves the URL path in MongoDB.

## How It Works

### 1. Upload Process
- Admin panel captures/uploads photo
- Photo is sent as base64 to `/api/upload-photo`
- Server converts base64 to image file
- File is saved to `server/uploads/` directory
- Filename format: `{type}_{id}_{timestamp}.jpg`
- URL path is returned: `/uploads/{filename}`

### 2. Storage
- **File System**: Images stored in `server/uploads/`
- **Database**: Only the URL path is stored (e.g., `/uploads/student_E12345_1234567890.jpg`)
- **Full URL**: Constructed as `http://SERVER_IP:3000/uploads/filename.jpg`

### 3. Retrieval
- Mobile app fetches user data with `photoUrl` field
- Image component loads from: `http://192.168.107.31:3000/uploads/filename.jpg`
- Server serves images via static file middleware

## API Endpoints

### Upload Photo
```
POST /api/upload-photo
Body: {
  photoData: "data:image/jpeg;base64,...",
  type: "student" | "teacher",
  id: "enrollment_or_employee_id"
}
Response: {
  success: true,
  photoUrl: "/uploads/student_E12345_1234567890.jpg",
  filename: "student_E12345_1234567890.jpg"
}
```

### Get Photo
```
GET /uploads/{filename}
Returns: Image file (JPEG)
```

### Test Photo Endpoint
```
GET /api/photo/{filename}
Returns: Image file or 404
```

## Directory Structure
```
server/
├── uploads/              # Photo storage (gitignored)
│   ├── student_E12345_1234567890.jpg
│   ├── teacher_T001_1234567891.jpg
│   └── ...
├── index.js             # Server with upload endpoints
└── UPLOADS_README.md    # This file
```

## Configuration

### Server URL
Update in mobile app (`App.js`):
```javascript
const SOCKET_URL = 'http://192.168.107.31:3000';
```

Update in admin panel (`renderer.js`):
```javascript
let SERVER_URL = 'http://localhost:3000';
```

## Benefits
- ✅ Efficient storage (files on disk, not in DB)
- ✅ Fast image loading
- ✅ Easy to backup (just copy uploads folder)
- ✅ Scalable (can move to CDN later)
- ✅ Reduced database size

## Security Notes
- Photos are publicly accessible via URL
- Consider adding authentication for sensitive photos
- Implement file size limits (currently 50MB)
- Validate file types (currently accepts all images)

## Maintenance
- Regularly backup `uploads/` folder
- Clean up orphaned photos (photos without DB records)
- Monitor disk space usage
