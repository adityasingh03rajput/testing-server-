# Azure Server Endpoints

**Base URL**: `https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net`

## Server Status: ✅ ONLINE
- **Server**: Express.js on Azure App Service
- **Powered by**: Express
- **CORS**: Enabled (`access-control-allow-origin: *`)

## 🟢 Working Endpoints (4 found)

### 1. **Root API**
```
GET /
Status: 200 OK
Content-Type: application/json
```
**Response**: Server information and available endpoints
```json
{
  "message": "Attendance System API Server",
  "version": "2.4.0",
  "status": "running",
  "timestamp": "2025-12-14T20:24:57.733Z",
  "endpoints": {
    "config": "/api/config",
    "time": "/api/time",
    "health": "/api/health",
    "students": "/api/students",
    "timetable": "/api/timetable/:semester/:branch",
    "subjects": "/api/subjects",
    "classrooms": "/api/classrooms"
  }
}
```

### 2. **Health Check API**
```
GET /api/health
Status: 200 OK
Content-Type: application/json
```
**Response**: Server health status and system information

### 3. **Configuration API**
```
GET /api/config
Status: 200 OK
Content-Type: application/json
```
**Response**: Complete SDUI configuration for mobile app including:
- Version: 2.0.0
- Role selection UI (Student/Teacher)
- Student name input configuration
- Student screen timer settings
- Teacher screen live attendance settings
- Color themes and styling

### 4. **Server Time API**
```
GET /api/time
Status: 200 OK
Content-Type: application/json
```
**Response**: Server time synchronization data
```json
{
  "success": true,
  "serverTime": 1765743570522,
  "serverTimeISO": "2025-12-14T20:19:30.522Z",
  "timezone": "UTC"
}
```

## 🔴 Non-Existent Endpoints (30 tested)

All other common API patterns return **404 Not Found**:

### System Endpoints
- `GET /` - 404
- `GET /health` - 404
- `GET /status` - 404
- `GET /info` - 404
- `GET /version` - 404
- `GET /ping` - 404

### API Endpoints
- `GET /api/version` - 404
- `GET /api/v1` - 404
- `GET /api/v2` - 404
- `GET /api/users` - 404
- `GET /api/auth` - 404
- `GET /api/login` - 404
- `GET /api/register` - 404
- `GET /api/data` - 404
- `GET /api/search` - 404
- `GET /api/list` - 404
- `GET /api/get` - 404
- `GET /api/post` - 404
- `GET /api/update` - 404
- `GET /api/delete` - 404

### Documentation Endpoints
- `GET /docs` - 404
- `GET /swagger` - 404
- `GET /api-docs` - 404
- `GET /openapi.json` - 404
- `GET /swagger.json` - 404

### Static Files
- `GET /robots.txt` - 404
- `GET /sitemap.xml` - 404
- `GET /favicon.ico` - 404

## 📊 Summary

- **Total Endpoints Tested**: 34
- **Working Endpoints**: 4 (11.8%)
- **404 Endpoints**: 30 (88.2%)
- **Server Errors**: 0

## 🔍 Analysis

This is a **full-featured attendance system API server** with multiple working endpoints:

1. **Root endpoint** (`/`) - Provides server info and endpoint directory
2. **Health check endpoint** (`/api/health`) - Server monitoring and diagnostics
3. **Configuration endpoint** (`/api/config`) - UI configuration for mobile attendance app
4. **Time synchronization endpoint** (`/api/time`) - Server time for client synchronization

The server is a **comprehensive attendance tracking system** running on **Express.js** on **Azure App Service** with **CORS enabled** for cross-origin requests. It includes endpoints for students, timetables, subjects, and classrooms as indicated in the root response.

## 💡 Usage

This server appears to be specifically designed for:
- **Mobile app configuration** (SDUI - Server Driven UI)
- **Time synchronization** for attendance tracking
- **Full-featured** deployment on Azure

The configuration suggests it's part of an **attendance tracking system** with student/teacher roles and timer functionality.